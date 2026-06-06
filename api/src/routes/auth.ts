import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

export async function authRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/login',
    {
      schema: {
        body: z.object({
          email: z.string().email({ message: 'E-mail inválido' }),
          password: z.string().min(1, { message: 'Senha é obrigatória' }),
        }),
        response: {
          200: z.object({
            token: z.string(),
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              role: z.string(),
            }),
          }),
          400: z.object({ message: z.string() }),
          401: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const employee = await prisma.employee.findUnique({
        where: { email },
      });

      if (!employee) {
        return reply.status(401).send({ message: 'E-mail ou senha incorretos.' });
      }

      if (!employee.isActive) {
        return reply.status(400).send({ message: 'Esta conta está inativa.' });
      }

      const isPasswordValid = await bcrypt.compare(password, employee.password);

      if (!isPasswordValid) {
        return reply.status(401).send({ message: 'E-mail ou senha incorretos.' });
      }

      const token = app.jwt.sign(
        {
          name: employee.name,
          email: employee.email,
          role: employee.role,
        },
        {
          sub: employee.id,
          expiresIn: '7d',
        }
      );

      return reply.send({
        token,
        user: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
        },
      });
    }
  );
}
