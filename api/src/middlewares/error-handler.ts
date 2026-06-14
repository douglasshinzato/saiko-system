import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Erro de validação.',
      errors: error.format(),
    });
  }

  // Se for erro de validação do próprio compilador do Fastify (Zod type provider)
  if (error.validation) {
    return reply.status(400).send({
      message: 'Erro de validação nos parâmetros/corpo da requisição.',
      errors: error.validation,
    });
  }

  // Loga erros desconhecidos para debug
  request.log.error(error);

  return reply.status(500).send({ message: 'Erro interno do servidor.' });
}
