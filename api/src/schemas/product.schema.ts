import { z } from 'zod';

export const productParamsSchema = z.object({
  id: z.string().uuid({ message: 'ID inválido' }),
});

export const barcodeParamsSchema = z.object({
  barcode: z.string(),
});

export const productQuerySchema = z.object({
  search: z.string().optional(),
});

export const productVariantResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  barcode: z.string(),
  sku: z.string().nullable(),
  description: z.string(),
  price: z.number(),
  cost: z.number().nullable(),
  quantity: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const productResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  variants: z.array(productVariantResponseSchema),
});

export const listProductsResponseSchema = z.array(productResponseSchema);

export const variantWithProductResponseSchema = productVariantResponseSchema.extend({
  product: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
  }),
});

export const listVariantsWithProductResponseSchema = z.array(variantWithProductResponseSchema);

export const createProductVariantSchema = z.object({
  barcode: z.string().min(1, { message: 'Código de barras é obrigatório' }),
  sku: z.string().optional().nullable(),
  description: z.string().min(1, { message: 'Descrição/tamanho é obrigatório' }),
  price: z.number().positive({ message: 'O preço deve ser maior que zero' }),
  cost: z.number().positive().optional().nullable(),
  quantity: z.number().int().nonnegative({ message: 'A quantidade não pode ser negativa' }).default(0),
});

export const createProductBodySchema = z.object({
  name: z.string().min(1, { message: 'Nome do produto é obrigatório' }),
  description: z.string().optional().nullable(),
  variants: z.array(createProductVariantSchema).min(1, { message: 'Pelo menos uma variação é obrigatória' }),
});

export const updateProductVariantSchema = z.object({
  id: z.string().uuid().optional(),
  barcode: z.string().min(1, { message: 'Código de barras é obrigatório' }),
  sku: z.string().optional().nullable(),
  description: z.string().min(1, { message: 'Descrição/tamanho é obrigatório' }),
  price: z.number().positive({ message: 'O preço deve ser maior que zero' }),
  cost: z.number().positive().optional().nullable(),
  quantity: z.number().int().nonnegative({ message: 'A quantidade não pode ser negativa' }),
});

export const updateProductBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  variants: z.array(updateProductVariantSchema).optional(),
});

export const errorResponseSchema = z.object({ message: z.string() });
