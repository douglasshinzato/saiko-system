import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

export async function employeeRoutes(app: FastifyInstance) {
  // Adiciona hook de autenticação e verificação de admin para todas as rotas deste plugin
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireAdmin);

  const appWithZod = app.withTypeProvider<ZodTypeProvider>();

  // Listar funcionários
  appWithZod.get(
    '/',
    {
      schema: {
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              role: z.string(),
              isActive: z.boolean(),
              createdAt: z.date(),
              updatedAt: z.date(),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      const employees = await prisma.employee.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return reply.send(employees);
    }
  );

  // Criar funcionário
  appWithZod.post(
    '/',
    {
      schema: {
        body: z.object({
          name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
          email: z.string().email({ message: 'E-mail inválido' }),
          password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
          role: z.enum(['ADMIN', 'OPERATOR']).default('OPERATOR'),
        }),
        response: {
          201: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            role: z.string(),
            isActive: z.boolean(),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, password, role } = request.body;

      const employeeExists = await prisma.employee.findUnique({
        where: { email },
      });

      if (employeeExists) {
        return reply.status(400).send({ message: 'E-mail já cadastrado.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const employee = await prisma.employee.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          isActive: true,
        },
      });

      return reply.status(201).send({
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        isActive: employee.isActive,
      });
    }
  );

  // Atualizar funcionário
  appWithZod.put(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid({ message: 'ID inválido' }),
        }),
        body: z.object({
          name: z.string().min(2).optional(),
          email: z.string().email().optional(),
          password: z.string().min(6).optional(),
          role: z.enum(['ADMIN', 'OPERATOR']).optional(),
          isActive: z.boolean().optional(),
        }),
        response: {
          200: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            role: z.string(),
            isActive: z.boolean(),
          }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { name, email, password, role, isActive } = request.body;

      const employee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!employee) {
        return reply.status(404).send({ message: 'Funcionário não encontrado.' });
      }

      // Se alterou o email, verifica se já existe
      if (email && email !== employee.email) {
        const emailExists = await prisma.employee.findUnique({
          where: { email },
        });

        if (emailExists) {
          return reply.status(400).send({ message: 'E-mail já está em uso por outro funcionário.' });
        }
      }

      // Impede inativar o último admin
      if (isActive === false && employee.role === 'ADMIN') {
        const adminCount = await prisma.employee.count({
          where: { role: 'ADMIN', isActive: true },
        });

        if (adminCount <= 1) {
          return reply.status(400).send({ message: 'Não é possível desativar o único administrador ativo.' });
        }
      }

      const updateData: any = {
        name,
        email,
        role,
        isActive,
      };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedEmployee = await prisma.employee.update({
        where: { id },
        data: updateData,
      });

      return reply.send({
        id: updatedEmployee.id,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        role: updatedEmployee.role,
        isActive: updatedEmployee.isActive,
      });
    }
  );

  // Deletar funcionário
  appWithZod.delete(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        response: {
          200: z.object({ message: z.string() }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const employee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!employee) {
        return reply.status(404).send({ message: 'Funcionário não encontrado.' });
      }

      // Impede deletar o último admin
      if (employee.role === 'ADMIN') {
        const adminCount = await prisma.employee.count({
          where: { role: 'ADMIN' },
        });

        if (adminCount <= 1) {
          return reply.status(400).send({ message: 'Não é possível excluir o único administrador do sistema.' });
        }
      }

      await prisma.employee.delete({
        where: { id },
      });

      return reply.send({ message: 'Funcionário excluído com sucesso.' });
    }
  );
}
