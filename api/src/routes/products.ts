import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

export async function productRoutes(app: FastifyInstance) {
  // Todas as rotas de produtos exigem autenticação
  app.addHook('preHandler', authenticate);

  const appWithZod = app.withTypeProvider<ZodTypeProvider>();

  // Listar produtos (com filtro opcional por busca: nome ou código de barras)
  appWithZod.get(
    '/',
    {
      schema: {
        querystring: z.object({
          search: z.string().optional(),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              barcode: z.string(),
              name: z.string(),
              description: z.string().nullable(),
              price: z.number(),
              cost: z.number().nullable(),
              quantity: z.number(),
              createdAt: z.date(),
              updatedAt: z.date(),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      const { search } = request.query;

      const products = await prisma.product.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search } },
                { barcode: { contains: search } },
              ],
            }
          : undefined,
        orderBy: { name: 'asc' },
      });

      return reply.send(products);
    }
  );

  // Buscar produto por código de barras (essencial para o leitor de código de barras)
  appWithZod.get(
    '/barcode/:barcode',
    {
      schema: {
        params: z.object({
          barcode: z.string(),
        }),
        response: {
          200: z.object({
            id: z.string(),
            barcode: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            price: z.number(),
            cost: z.number().nullable(),
            quantity: z.number(),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { barcode } = request.params;

      const product = await prisma.product.findUnique({
        where: { barcode },
      });

      if (!product) {
        return reply.status(404).send({ message: 'Produto não encontrado para este código de barras.' });
      }

      return reply.send(product);
    }
  );

  // Criar produto (apenas ADMIN)
  appWithZod.post(
    '/',
    {
      schema: {
        body: z.object({
          barcode: z.string().min(1, { message: 'Código de barras é obrigatório' }),
          name: z.string().min(1, { message: 'Nome do produto é obrigatório' }),
          description: z.string().optional(),
          price: z.number().positive({ message: 'O preço deve ser maior que zero' }),
          cost: z.number().positive().optional().nullable(),
          quantity: z.number().int().nonnegative({ message: 'A quantidade não pode ser negativa' }).default(0),
        }),
        response: {
          201: z.object({
            id: z.string(),
            barcode: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            price: z.number(),
            cost: z.number().nullable(),
            quantity: z.number(),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      // Middleware adicional para exigir Admin
      await requireAdmin(request, reply);
      if (reply.sent) return;

      const { barcode, name, description, price, cost, quantity } = request.body;

      const productExists = await prisma.product.findUnique({
        where: { barcode },
      });

      if (productExists) {
        return reply.status(400).send({ message: 'Já existe um produto cadastrado com este código de barras.' });
      }

      const product = await prisma.product.create({
        data: {
          barcode,
          name,
          description,
          price,
          cost,
          quantity,
        },
      });

      return reply.status(201).send(product);
    }
  );

  // Atualizar produto (apenas ADMIN)
  appWithZod.put(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid({ message: 'ID inválido' }),
        }),
        body: z.object({
          barcode: z.string().min(1).optional(),
          name: z.string().min(1).optional(),
          description: z.string().optional().nullable(),
          price: z.number().positive().optional(),
          cost: z.number().positive().optional().nullable(),
          quantity: z.number().int().nonnegative().optional(),
        }),
        response: {
          200: z.object({
            id: z.string(),
            barcode: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            price: z.number(),
            cost: z.number().nullable(),
            quantity: z.number(),
          }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      await requireAdmin(request, reply);
      if (reply.sent) return;

      const { id } = request.params;
      const { barcode, name, description, price, cost, quantity } = request.body;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return reply.status(404).send({ message: 'Produto não encontrado.' });
      }

      // Se alterou o código de barras, verifica unicidade
      if (barcode && barcode !== product.barcode) {
        const barcodeExists = await prisma.product.findUnique({
          where: { barcode },
        });

        if (barcodeExists) {
          return reply.status(400).send({ message: 'Já existe outro produto cadastrado com este código de barras.' });
        }
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          barcode,
          name,
          description,
          price,
          cost,
          quantity,
        },
      });

      return reply.send(updatedProduct);
    }
  );

  // Deletar produto (apenas ADMIN)
  appWithZod.delete(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        response: {
          200: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      await requireAdmin(request, reply);
      if (reply.sent) return;

      const { id } = request.params;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return reply.status(404).send({ message: 'Produto não encontrado.' });
      }

      await prisma.product.delete({
        where: { id },
      });

      return reply.send({ message: 'Produto excluído com sucesso.' });
    }
  );
}
