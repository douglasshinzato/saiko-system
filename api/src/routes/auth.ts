import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loginBodySchema, loginResponseSchema, errorResponseSchema } from '../schemas/auth.schema.js';
import { loginService } from '../services/auth.service.js';

export async function authRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/login',
    {
      schema: {
        body: loginBodySchema,
        response: {
          200: loginResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const result = await loginService(email, password, app.jwt.sign.bind(app.jwt));
      return reply.send(result);
    }
  );
}
