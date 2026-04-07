# 📦 Global Parts — Sistema de Compras & Inventário

Este é o sistema centralizado de gestão de ativos e solicitações de compras da **Global Parts**. Uma aplicação robusta, segura e moderna desenvolvida com foco em performance e escalabilidade.

---

## 🛠️ Tecnologias e Ferramentas (Stack)

O projeto foi desenvolvido utilizando o que há de mais moderno no ecossistema de desenvolvimento web:

- **Linguagem Principal**: [TypeScript](https://www.typescriptlang.org/) — Garantindo tipagem estrita e segurança em todo o fluxo de dados.
- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) — Interface rápida, reativa e otimizada.
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) — Design System customizado com foco em UX corporativa e modo escuro nativo.
- **Backend / Database**: [Supabase](https://supabase.com/) & [PostgreSQL](https://www.postgresql.org/) — Persistência de dados com Row Level Security (RLS).
- **Lógica de Banco**: [PL/pgSQL](https://www.postgresql.org/docs/current/plpgsql.html) — Triggers e funções automatizadas para auditoria e workflow.
- **Ícones**: [Lucide React](https://lucide.dev/) — Conjunto de ícones consistentes e leves.

---

## 🏗️ Arquitetura e Inovações

### **Identidade Sintética (Email Bypass)**
Diferente de sistemas comuns, o Global Parts utiliza uma arquitetura de **E-mails Sintéticos** (`slug#email@globalp.com.br`) para permitir que múltiplos usuários compartilhem o mesmo e-mail corporativo sem conflitos de autenticação no Supabase.

### **Segurança de Dados (RLS)**
Toda a segurança é aplicada diretamente na camada do banco de dados (PostgreSQL), garantindo que cada cargo (`master_admin`, `gestor`, `ti`, `usuario`) acesse apenas as informações permitidas pelo seu escopo organizacional.

### **Design System Premium**
Interface visualmente rica baseada em **Glassmorphism**, com suporte total a **Dark Mode** e layout responsivo adaptativo para Mobile (Bottom Nav) e Desktop (Sidebar).

---

## 🚀 Como Iniciar

1.  **Instalação**:
    ```bash
    npm install
    ```

2.  **Desenvolvimento**:
    ```bash
    npm run dev
    ```

3.  **Build**:
    ```bash
    npm run build
    ```

---

## 📂 Estrutura de Pastas

- `/src/components`: Componentes reutilizáveis de UI.
- `/src/pages`: Páginas principais da aplicação.
- `/src/context`: Gerenciamento de estado (Auth, Theme).
- `/src/hooks`: Lógica de negócio e hooks personalizados.
- `/supabase/migrations`: Scripts SQL versionados para o banco de dados.

---
*Desenvolvido e Auditado com Antigravity AI.*
