# Lista de Tarefas - Saiko System (Fase 1)

## Estrutura do Monorepo
- [x] Criar pastas base do projeto (`/api` e `/web`) no diretório `saiko-system/`
- [x] Configurar `.gitignore` global e arquivos de configuração iniciais

## Backend (`/api`)
- [x] Inicializar projeto Node.js (`package.json`) e TypeScript (`tsconfig.json`)
- [x] Instalar dependências (Fastify, Prisma, Zod, bcrypt, JWT, CORS)
- [x] Configurar o Prisma ORM com SQLite
- [x] Criar o schema do banco (`schema.prisma` com Product e Employee)
- [x] Criar as migrações iniciais e executar o migrate
- [x] Desenvolver script de Seed para criar o primeiro usuário `ADMIN`
- [x] Implementar a inicialização do Fastify (`server.ts`) com middlewares (Zod, CORS, JWT)
- [x] Desenvolver rotas e controllers de Autenticação (`/auth/login`)
- [x] Desenvolver rotas e controllers de Funcionários (`/employees`)
- [x] Desenvolver rotas e controllers de Produtos (`/products`)

## Frontend (`/web`)
- [x] Criar projeto Next.js com TypeScript e Tailwind CSS
- [x] Instalar dependências (Axios, TanStack Query, Lucide React)
- [x] Inicializar o **shadcn/ui** e configurar componentes base (Button, Input, Table, Dialog, etc.)
- [x] Configurar suporte nativo a Dark/Light Mode
- [x] Configurar cliente de API (Axios) e Provider do TanStack Query
- [x] Criar tela de Login
- [x] Criar Sidebar / Layout com controle de acesso por cargo (`role`)
- [x] Criar tela de Produtos (CRUD e leitor de código de barras USB)
- [x] Criar tela de Funcionários (CRUD exclusivo para admins)

## Ajuste e Sincronização Estética (Fase 1.1)
- [x] Padronizar componente `<Card>` com bordas e sombras do `saas-booking`
- [x] Atualizar tela de Login (`app/login/page.tsx`) com layout e largura `max-w-sm` da referência
- [x] Ajustar layout do formulário de Login para evitar sobreposição (botão no `<CardContent>`)
- [x] Limpar estilos customizados de Card no Dashboard (`app/dashboard/page.tsx`)
- [x] Padronizar containers das tabelas de Produtos e Funcionários

## Integração e Verificação
- [x] Testar fluxo de autenticação e segurança de rotas
- [x] Testar fluxo do leitor de código de barras USB
- [x] Testar fluxo do banco de dados local SQLite
