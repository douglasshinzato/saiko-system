import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

import { BadRequestError, UnauthorizedError } from '../errors/app-error.js';

type JwtSign = (
  payload: Record<string, unknown>,
  options: { sub: string; expiresIn: string }
) => string;

interface LoginResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export async function loginService(
  email: string,
  password: string,
  signJwt: JwtSign
): Promise<LoginResult> {
  const employee = await prisma.employee.findUnique({ where: { email } });

  if (!employee) {
    throw new UnauthorizedError('E-mail ou senha incorretos.');
  }

  if (!employee.isActive) {
    throw new BadRequestError('Esta conta está inativa.');
  }

  const isPasswordValid = await bcrypt.compare(password, employee.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('E-mail ou senha incorretos.');
  }

  const token = signJwt(
    { name: employee.name, email: employee.email, role: employee.role },
    { sub: employee.id, expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
    },
  };
}
