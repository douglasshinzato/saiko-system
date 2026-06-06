# Saiko System 📦

> Sistema offline-first de controle de estoque local integrado com leitor de código de barras físico.

O **Saiko System** é um sistema projetado para rodar localmente no computador de um estabelecimento comercial, dispensando a necessidade de conexão ativa com a internet para suas operações essenciais (offline-first). O banco de dados e o servidor rodam localmente na máquina, provendo velocidade máxima nas leituras físicas de códigos de barras.

---

## 🚀 Tecnologias

### Backend (`/api`)
* **Core:** Node.js com Fastify (TypeScript)
* **Banco de Dados & ORM:** SQLite com Prisma ORM
* **Validação:** Zod integrado ao Fastify (`fastify-type-provider-zod`)
* **Segurança:** Hashes de senhas com `bcrypt` e autenticação baseada em JWT (`@fastify/jwt`)

### Frontend (`/web`)
* **Core:** Next.js (App Router) com TypeScript
* **Design & UI:** Tailwind CSS, **shadcn/ui** e Geist Sans (fonte padrão da Vercel)
* **Gerenciamento de Estados & Requisições:** **TanStack Query (React Query)** e Axios
* **Tema:** Dark Mode e Light Mode nativos via `next-themes`

---

## 📂 Arquitetura do Monorepo

```
saiko-system/
├── api/                   # API de Serviços (Fastify + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma  # Esquemas e relações (Product, Employee)
│   │   └── dev.db         # Banco SQLite Local
│   └── src/
│       ├── controllers/   # Regras de Negócio e Ações de API
│       ├── routes/        # Rotas da API (/auth, /products, /employees)
│       └── server.ts      # Inicializador do Fastify
└── web/                   # Interface Gráfica (Next.js + Tailwind)
    └── src/
        ├── app/           # Rotas do App Router (Dashboard, Login, Produtos)
        ├── components/    # Componentes Visuais Reutilizáveis (shadcn/ui)
        └── hooks/         # Custom Hooks e Integração com TanStack Query
```

---

## 🛠️ Como Iniciar o Projeto

### Pré-requisitos
* Node.js (v18 ou superior)
* npm ou yarn

### 1. Configurar e rodar o Backend

1. Entre no diretório `/api`:
   ```bash
   cd api
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie o arquivo `.env` na raiz da pasta `api` com o seguinte conteúdo:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="sua_chave_secreta_jwt_para_geracao_de_tokens"
   PORT=3333
   ```
4. Execute as migrações do banco de dados e popule com os dados iniciais (Seed):
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
5. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   *O servidor iniciará em `http://localhost:3333`.*

### 2. Configurar e rodar o Frontend

1. Em outro terminal, entre no diretório `/web`:
   ```bash
   cd web
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   *A interface estará acessível em `http://localhost:3000`.*

---

## 🔑 Acesso Padrão (Seed)

Ao executar o seed do banco de dados, o sistema gera automaticamente um usuário administrador padrão para o primeiro acesso:
* **E-mail:** `admin@saiko.com`
* **Senha:** `admin1234`
* **Cargo:** `ADMIN`

---

## 🔌 Leitor de Código de Barras USB

Implementamos um listener global inteligente de eventos de teclado (`keydown`) na tela de **Produtos**. 

### Como funciona:
* **Detecção de velocidade:** O leitor de código de barras USB físico emula um teclado comum, porém digita em velocidade extrema (menos de 20ms por tecla). O algoritmo detecta essa velocidade e filtra a digitação manual de forma transparente.
* **Abertura Inteligente de Modais:**
  * Se você bipar um código de barras de um produto **cadastrado**, o sistema exibe um alerta e **abre imediatamente o modal de edição** do produto correspondente.
  * Se você bipar um código de barras **inexistente** (e tiver permissão de Admin), o sistema **abre o formulário de cadastro** com o campo do código de barras já preenchido automaticamente, facilitando o recebimento de novas mercadorias.

---

## 🗺️ Roteiro do MVP (Roadmap)

- [x] **Fase 1: Base do Sistema** (CRUD de Produtos com leitor USB + CRUD de Colaboradores + Autenticação)
- [ ] **Fase 2: PDV / Carrinho** (Interface de fechamento rápido de venda, decremento automático do estoque e histórico de vendas locais)
- [ ] **Fase 3: Inteligência e Relatórios** (Gráficos de faturamento diário, produtos mais vendidos e histórico de movimentações)
