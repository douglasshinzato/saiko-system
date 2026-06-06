# Walkthrough - Saiko System (Fase 1 Concluída & Estilos Sincronizados)

A primeira fase do desenvolvimento do **Saiko System** foi estruturada e implementada com sucesso. Criamos um sistema offline-first com monorepo, contendo uma API REST robusta no backend e uma aplicação web dinâmica e responsiva no frontend com suporte a Dark/Light Mode.

Adicionalmente, na **Fase 1.1**, realizamos a sincronização de estilos da interface com o projeto de referência (`saas-booking`), garantindo coerência em bordas, sombras e espaçamentos.

---

## Modificações de Estilo e UI (Fase 1.1)

Para seguir com precisão os padrões estéticos definidos pelo repositório de referência:

1. **Componente Card Padronizado:**
   - Modificamos [card.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/components/ui/card.tsx) to remove custom border colors and backgrounds, using default borders and standard rounded shadow properties. The borders adapt dynamically between Light and Dark mode using the Tailwind standard.

2. **Refatoração da Tela de Login:**
   - Ajustamos o layout de [login/page.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/app/login/page.tsx) to a centralized container of size `w-full max-w-sm` and clean padding (`p-6 md:p-10`).
   - Movemos a tag `<form>` e o botão de submissão para dentro de `<CardContent>`. With no `<CardFooter>` layout separation, we resolved the flexbox overlap issues.

3. **Limpeza de Classes Hardcoded no Dashboard:**
   - Atualizamos [dashboard/page.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/app/dashboard/page.tsx) to let cards inherit default themed backgrounds, borders, and shadows from the native `<Card>` element.

4. **Padronização das Tabelas e Modais:**
   - Uniformizamos as tabelas de produtos e funcionários em [products/page.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/app/dashboard/products/page.tsx) and [employees/page.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/app/dashboard/employees/page.tsx) to use standard `<Card>` styled wrappers.

---

## Estrutura do Monorepo

O projeto está localizado na pasta de rascunho:
`C:\Users\Administrator\.gemini\antigravity\scratch\saiko-system`

### Diretórios Principais
*   [api/](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/api): Servidor Fastify (Node.js/TypeScript).
    *   [prisma/schema.prisma](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/api/prisma/schema.prisma): Modelos de dados para Produtos (`Product`) e Funcionários (`Employee`).
*   [web/](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web): Cliente web Next.js (TypeScript/Tailwind CSS).
    *   [web/src/app/login/page.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/app/login/page.tsx): Tela de autenticação sincronizada.
    *   [web/src/app/dashboard/products/page.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/app/dashboard/products/page.tsx): Tela de estoque de produtos (com leitor USB).
    *   [web/src/app/dashboard/employees/page.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/app/dashboard/employees/page.tsx): Gestão de funcionários (exclusiva para administradores).

---

## Como Rodar o Sistema Localmente

Abra dois terminais na pasta do projeto:

### Terminal 1: Rodar o Backend (Porta 3333)
```powershell
cd C:\Users\Administrator\.gemini\antigravity\scratch\saiko-system\api
npm.cmd run dev
```

### Terminal 2: Rodar o Frontend (Porta 3000)
```powershell
cd C:\Users\Administrator\.gemini\antigravity\scratch\saiko-system\web
npm.cmd run dev
```
Acesse o sistema no navegador através de: `http://localhost:3000`

---

## Credenciais de Acesso Padrão (Seed)

*   **E-mail:** `admin@saiko.com`
*   **Senha:** `admin1234`
*   **Cargo:** `ADMIN`
