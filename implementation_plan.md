# Plano de Implementação - Saiko System (Sincronização de Estilos & UI)

Este plano detalha as alterações para alinhar a interface do **Saiko System** com os padrões estéticos do repositório de referência (`saas-booking`), focando em bordas, sombras, espaçamentos e no layout da tela de login.

---

## User Review Required

> [!IMPORTANT]
> As alterações a seguir visam uniformizar o layout para usar os estilos padrão do framework/shadcn de forma consistente, removendo cores de borda e fundos hardcoded nas páginas de dashboard, produtos e funcionários, garantindo conformidade com o tema Dark/Light.

---

## Proposed Changes

### Componente Card
#### [MODIFY] [card.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/components/ui/card.tsx)
- Remover a borda customizada (`border-zinc-200/80 dark:border-zinc-800/85`) e utilizar a classe padrão `border`, delegando a definição de cores para o `globals.css` (`var(--border)`).
- Manter o padrão de sombras (`shadow-sm`) e padding interno (`py-6`, `px-6`).

---

### Tela de Login
#### [MODIFY] [page.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/app/login/page.tsx)
- Ajustar o container externo para usar a estrutura da referência (`flex min-h-svh w-full items-center justify-center p-6 md:p-10`).
- Atualizar a largura máxima do container do login para `w-full max-w-sm`.
- Reorganizar a tag `<form>` para encapsular os campos e botões *dentro* do `<CardContent>` em vez de encapsular o `<Card>` inteiro, removendo o `<CardFooter>` para evitar problemas de posicionamento flexbox e sobreposição de inputs.
- Remover estilos hardcoded de bordas e sombras do Card de login, deixando-o usar o estilo nativo e limpo do componente `<Card>`.

---

### Telas do Dashboard (Estilo Geral dos Cards)
#### [MODIFY] [page.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/app/dashboard/page.tsx)
- Limpar as classes customizadas de borda, sombra e background dos Cards do dashboard para usar a estilização nativa do `<Card>` (ex: remover `border-zinc-200/50 dark:border-zinc-800/50`, `bg-white dark:bg-zinc-900`).
- Preservar apenas classes de layout estruturais (como `flex flex-col justify-between` e a borda amarela de alerta crítico).

#### [MODIFY] [products/page.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/app/dashboard/products/page.tsx)
- Ajustar o container da tabela de produtos para utilizar o padrão sem bordas/backgrounds fixos (`border rounded-xl bg-card text-card-foreground shadow-sm`).

#### [MODIFY] [employees/page.tsx](file:///C:/Users/Administrator/.gemini/antigravity/scratch/saiko-system/web/src/app/dashboard/employees/page.tsx)
- Ajustar o container da tabela de funcionários para utilizar o mesmo padrão (`border rounded-xl bg-card text-card-foreground shadow-sm`).

---

## Verification Plan

### Automated Verification
- Rodar o build de produção no frontend (`npm run build`) para verificar a integridade dos tipos e imports do Next.js.

### Manual Verification
- Acessar a tela de login (`/login`) e verificar se os inputs não sofrem mais sobreposição com o botão de submissão.
- Verificar se a tela de login segue o tamanho `max-w-sm` e está devidamente centralizada.
- Verificar a transição Dark/Light Mode em todos os cartões do dashboard e tabelas, garantindo que as bordas usem o padrão de opacidade correto configurado nas variáveis CSS.
