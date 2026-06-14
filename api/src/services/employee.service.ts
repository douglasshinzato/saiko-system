import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { createEmployeeBodySchema, updateEmployeeBodySchema } from '../schemas/employee.schema.js';

import { BadRequestError, NotFoundError, ConflictError } from '../errors/app-error.js';

type CreateEmployeeInput = z.infer<typeof createEmployeeBodySchema>;
type UpdateEmployeeInput = z.infer<typeof updateEmployeeBodySchema>;

type EmployeeUpdateData = {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'OPERATOR';
  isActive?: boolean;
  password?: string;
};

export async function listEmployees() {
  return prisma.employee.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createEmployee(data: CreateEmployeeInput) {
  const { name, email, password, role } = data;

  const employeeExists = await prisma.employee.findUnique({ where: { email } });

  if (employeeExists) {
    throw new ConflictError('E-mail já cadastrado.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.employee.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    },
  });
}

export async function updateEmployee(id: string, data: UpdateEmployeeInput) {
  const { name, email, password, role, isActive } = data;

  const employee = await prisma.employee.findUnique({ where: { id } });

  if (!employee) {
    throw new NotFoundError('Funcionário não encontrado.');
  }

  if (email && email !== employee.email) {
    const emailExists = await prisma.employee.findUnique({ where: { email } });

    if (emailExists) {
      throw new ConflictError('E-mail já está em uso por outro funcionário.');
    }
  }

  if (isActive === false && employee.role === 'ADMIN') {
    const adminCount = await prisma.employee.count({
      where: { role: 'ADMIN', isActive: true },
    });

    if (adminCount <= 1) {
      throw new BadRequestError('Não é possível desativar o único administrador ativo.');
    }
  }

  const updateData: EmployeeUpdateData = { name, email, role, isActive };

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  return prisma.employee.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteEmployee(id: string) {
  const employee = await prisma.employee.findUnique({ where: { id } });

  if (!employee) {
    throw new NotFoundError('Funcionário não encontrado.');
  }

  if (employee.role === 'ADMIN') {
    const adminCount = await prisma.employee.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount <= 1) {
      throw new BadRequestError('Não é possível excluir o único administrador do sistema.');
    }
  }

  await prisma.employee.delete({ where: { id } });
}
