import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import {
  listProductsResponseSchema,
  productResponseSchema,
  createProductBodySchema,
  updateProductBodySchema,
  productParamsSchema,
  barcodeParamsSchema,
  productQuerySchema,
  errorResponseSchema,
  listVariantsWithProductResponseSchema,
} from '../schemas/product.schema.js';
import {
  listProducts,
  getVariantsByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/product.service.js';

export async function productRoutes(app: FastifyInstance) {
  // Todas as rotas de produtos exigem autenticação
  app.addHook('preHandler', authenticate);

  const appWithZod = app.withTypeProvider<ZodTypeProvider>();

  // Listar produtos (com filtro opcional por busca: nome ou código de barras)
  appWithZod.get(
    '/',
    {
      schema: {
        querystring: productQuerySchema,
        response: { 200: listProductsResponseSchema },
      },
    },
    async (request, reply) => {
      const products = await listProducts(request.query.search);
      return reply.send(products);
    }
  );

  // Buscar produto por código de barras (essencial para o leitor de código de barras)
  appWithZod.get(
    '/barcode/:barcode',
    {
      schema: {
        params: barcodeParamsSchema,
        response: {
          200: listVariantsWithProductResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const variants = await getVariantsByBarcode(request.params.barcode);
      return reply.send(variants);
    }
  );

  // Criar produto (apenas ADMIN)
  appWithZod.post(
    '/',
    {
      preHandler: requireAdmin,
      schema: {
        body: createProductBodySchema,
        response: {
          201: productResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const product = await createProduct(request.body);
      return reply.status(201).send(product);
    }
  );

  // Atualizar produto (apenas ADMIN)
  appWithZod.put(
    '/:id',
    {
      preHandler: requireAdmin,
      schema: {
        params: productParamsSchema,
        body: updateProductBodySchema,
        response: {
          200: productResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const product = await updateProduct(request.params.id, request.body);
      return reply.send(product);
    }
  );

  // Deletar produto (apenas ADMIN)
  appWithZod.delete(
    '/:id',
    {
      preHandler: requireAdmin,
      schema: {
        params: productParamsSchema,
        response: {
          200: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await deleteProduct(request.params.id);
      return reply.send({ message: 'Produto excluído com sucesso.' });
    }
  );
}
