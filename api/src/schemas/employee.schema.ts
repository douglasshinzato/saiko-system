import { z } from 'zod';

export const employeeParamsSchema = z.object({
  id: z.string().uuid({ message: 'ID inválido' }),
});

export const employeeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  isActive: z.boolean(),
});

export const listEmployeesResponseSchema = z.array(
  employeeResponseSchema.extend({
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

export const createEmployeeBodySchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
  role: z.enum(['ADMIN', 'OPERATOR']).default('OPERATOR'),
});

export const updateEmployeeBodySchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'OPERATOR']).optional(),
  isActive: z.boolean().optional(),
});

export const errorResponseSchema = z.object({ message: z.string() });
