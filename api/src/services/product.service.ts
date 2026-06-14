import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { createProductBodySchema, updateProductBodySchema } from '../schemas/product.schema.js';
import { NotFoundError, ConflictError } from '../errors/app-error.js';

type CreateProductInput = z.infer<typeof createProductBodySchema>;
type UpdateProductInput = z.infer<typeof updateProductBodySchema>;

export async function listProducts(search?: string) {
  return prisma.product.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            {
              variants: {
                some: {
                  OR: [
                    { barcode: { contains: search } },
                    { sku: { contains: search } },
                  ],
                },
              },
            },
          ],
        }
      : undefined,
    include: {
      variants: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getVariantsByBarcode(barcode: string) {
  const variants = await prisma.productVariant.findMany({
    where: { barcode },
    include: {
      product: true,
    },
  });

  if (variants.length === 0) {
    throw new NotFoundError('Produto não encontrado para este código de barras.');
  }

  return variants;
}

export async function createProduct(data: CreateProductInput) {
  const { name, description, variants } = data;

  // Validar se algum SKU já existe
  for (const variant of variants) {
    if (variant.sku) {
      const skuExists = await prisma.productVariant.findUnique({
        where: { sku: variant.sku },
      });
      if (skuExists) {
        throw new ConflictError(`Já existe um produto com o SKU "${variant.sku}".`);
      }
    }
  }

  return prisma.product.create({
    data: {
      name,
      description,
      variants: {
        create: variants,
      },
    },
    include: {
      variants: true,
    },
  });
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const { name, description, variants } = data;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!product) {
    throw new NotFoundError('Produto não encontrado.');
  }

  if (variants) {
    // Validar SKUs exclusivos das variações recebidas
    for (const variant of variants) {
      if (variant.sku) {
        const skuExists = await prisma.productVariant.findFirst({
          where: {
            sku: variant.sku,
            NOT: variant.id ? { id: variant.id } : undefined,
          },
        });
        if (skuExists) {
          throw new ConflictError(`Já existe um produto com o SKU "${variant.sku}".`);
        }
      }
    }

    const existingVariantIds = product.variants.map((v) => v.id);
    const incomingVariantIds = variants
      .map((v) => v.id)
      .filter((vid): vid is string => !!vid);

    const variantIdsToDelete = existingVariantIds.filter(
      (vid) => !incomingVariantIds.includes(vid)
    );

    return prisma.$transaction(async (tx) => {
      // 1. Excluir variações removidas
      if (variantIdsToDelete.length > 0) {
        await tx.productVariant.deleteMany({
          where: {
            id: { in: variantIdsToDelete },
          },
        });
      }

      // 2. Criar ou Atualizar as variações recebidas
      for (const v of variants) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              barcode: v.barcode,
              sku: v.sku,
              description: v.description,
              price: v.price,
              cost: v.cost,
              quantity: v.quantity,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: id,
              barcode: v.barcode,
              sku: v.sku,
              description: v.description,
              price: v.price,
              cost: v.cost,
              quantity: v.quantity,
            },
          });
        }
      }

      // 3. Atualizar dados básicos do produto
      return tx.product.update({
        where: { id },
        data: {
          name,
          description,
        },
        include: {
          variants: true,
        },
      });
    });
  }

  return prisma.product.update({
    where: { id },
    data: {
      name,
      description,
    },
    include: {
      variants: true,
    },
  });
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new NotFoundError('Produto não encontrado.');
  }

  await prisma.product.delete({ where: { id } });
}
