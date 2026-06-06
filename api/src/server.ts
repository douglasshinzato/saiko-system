import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from './env.js';
import { authRoutes } from './routes/auth.js';
import { employeeRoutes } from './routes/employees.js';
import { productRoutes } from './routes/products.js';

const app = Fastify({
  logger: true,
});

// Registrar compiladores do Zod
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Registrar plugins
app.register(cors, {
  origin: '*', // Aceita chamadas de qualquer origem no ambiente de desenvolvimento local
});

app.register(jwt, {
  secret: env.JWT_SECRET,
});

// Registrar rotas
app.register(authRoutes, { prefix: '/auth' });
app.register(employeeRoutes, { prefix: '/employees' });
app.register(productRoutes, { prefix: '/products' });

// Iniciar servidor
const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Servidor rodando em http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
