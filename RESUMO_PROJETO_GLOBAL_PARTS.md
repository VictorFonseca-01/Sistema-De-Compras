# 🚀 Global Parts — Sistema de Compras & Inventário
**Relatório Técnico de Arquitetura e Implementação — Atualizado v4.0**

## 1. Visão Geral
O sistema de compras e inventário da **Global Parts** foi projetado como uma "Single Source of Truth" para a gestão de ativos de TI e aquisições corporativas. Ele suporta múltiplas unidades de negócio (como Goiânia, Barreiras, Jataí) com isolamento total de dados e um fluxo de aprovação hierárquico complexo.

## 2. 🛠️ Stack de Desenvolvimento (Engenharia de Software)
O projeto foi construído utilizando as tecnologias mais modernas e robustas do ecossistema Web:

### **Frontend: Core em TypeScript & React**
*   **Linguagem**: **TypeScript** (Estrito) garantindo segurança de tipos em toda a aplicação, desde as chamadas de API até os componentes de UI.
*   **Framework**: **React 19** aproveitando a performance máxima com renderização eficiente e hooks personalizados (`useProfile`, `useRequests`).
*   **Build Tool**: **Vite 8** para uma experiência de desenvolvimento instantânea e bundle de produção otimizado.
*   **Estilização**: **Tailwind CSS v4** (Arquitetura CSS-First). Implementamos um Design System customizado via variáveis CSS nativas, permitindo alternância instantânea entre **Dark Mode Premium** e Light Mode.

### **Backend: Supabase & PostgreSQL (SQL Nativo)**
*   **Banco de Dados**: **PostgreSQL** com uso intensivo de **PL/pgSQL**.
*   **Segurança (RLS)**: Implementamos políticas de **Row Level Security** que garantem que um usuário só veja dados permitidos pelo seu cargo (`master_admin`, `gestor`, `ti`, `usuario`).
*   **Lógica no Banco**: Triggers e Funções SQL automatizam a criação de perfis, auditoria de mudanças de status e cálculos de dashboard diretamente no servidor.

## 3. 🛡️ Inovações Técnicas em Destaque
### **Arquitetura de Identidade Sintética (Email Bypass)**
Para resolver a restrição do Supabase de um e-mail único por conta, implementamos um sistema de **E-mails Sintéticos** (formato: `slug-do-nome#email-original@globalp.com.br`). Isso permite que múltiplos colaboradores utilizem o mesmo e-mail corporativo compartilhado enquanto mantêm perfis, permissões e históricos individuais e isolados.

### **Design System "Global Parts Identity"**
Desenvolvemos uma interface baseada em **Glassmorphism**, com foco em acessibilidade e estética corporativa de alto escalão. O sistema é **Mobile-First**, com navegação adaptativa via `BottomNavigation` para smarpthones e `Sidebar` inteligente para desktop.

## 4. 🔀 Fluxo de Trabalho (Pipeline)
A lógica de aprovação segue uma cadeia de confiança programática:
1.  **Requisição**: Criada por qualquer `usuario` (TypeScript define os campos obrigatórios).
2.  **Gestor**: Aprovação de setor baseada no `manager_scopes`.
3.  **TI**: Validação de hardware/software.
4.  **Diretoria**: Liberação orçamentária.
5.  **Compras**: Execução da aquisição.

## 5. 🚢 Infraestrutura e Deploy
*   **Controle de Versão**: Git com commits semânticos.
*   **Migrações**: O esquema do banco é versionado em scripts `.sql` na pasta `/supabase/migrations`.
*   **Hospedagem**: Otimizado para **Vercel** no frontend e **Supabase Cloud** no backend.

---
*Relatório gerado em 07 de Abril de 2026 pela inteligência Antigravity.*
