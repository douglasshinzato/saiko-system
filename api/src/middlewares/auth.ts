import { FastifyReply, FastifyRequest } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ message: 'Não autorizado. Token inválido ou ausente.' });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user || request.user.role !== 'ADMIN') {
    reply.status(403).send({ message: 'Acesso negado. Apenas administradores podem acessar este recurso.' });
  }
}
