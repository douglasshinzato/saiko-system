import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import {
  listEmployeesResponseSchema,
  employeeResponseSchema,
  createEmployeeBodySchema,
  updateEmployeeBodySchema,
  employeeParamsSchema,
  errorResponseSchema,
} from '../schemas/employee.schema.js';
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../services/employee.service.js';

export async function employeeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireAdmin);

  const appWithZod = app.withTypeProvider<ZodTypeProvider>();

  // Listar funcionários
  appWithZod.get(
    '/',
    {
      schema: {
        response: { 200: listEmployeesResponseSchema },
      },
    },
    async (_request, reply) => {
      const employees = await listEmployees();
      return reply.send(employees);
    }
  );

  // Criar funcionário
  appWithZod.post(
    '/',
    {
      schema: {
        body: createEmployeeBodySchema,
        response: {
          201: employeeResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const employee = await createEmployee(request.body);
      return reply.status(201).send(employee);
    }
  );

  // Atualizar funcionário
  appWithZod.put(
    '/:id',
    {
      schema: {
        params: employeeParamsSchema,
        body: updateEmployeeBodySchema,
        response: {
          200: employeeResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const employee = await updateEmployee(request.params.id, request.body);
      return reply.send(employee);
    }
  );

  // Deletar funcionário
  appWithZod.delete(
    '/:id',
    {
      schema: {
        params: employeeParamsSchema,
        response: {
          200: errorResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await deleteEmployee(request.params.id);
      return reply.send({ message: 'Funcionário excluído com sucesso.' });
    }
  );
}
