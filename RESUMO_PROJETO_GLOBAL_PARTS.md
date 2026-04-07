# 🚀 Global Parts — Sistema de Compras & Inventário
**Relatório Técnico de Arquitetura e Implementação**

## 1. Visão Geral
O sistema foi desenvolvido para ser a central única de controle de compras e inventário de TI da Global Parts, suportando múltiplas unidades (Matriz, Barreiras, etc.) com isolamento total de dados e fluxo de aprovação multinível.

## 2. Stack Tecnológica
*   **Frontend**: React 19 (Vite), Tailwind CSS v4, Lucide Icons.
*   **Backend**: Supabase (PostgreSQL as a Service).
*   **Segurança**: Row Level Security (RLS) e Políticas de Acesso Granulares.

## 3. Arquitetura de Software
### 💻 Frontend (Ux/UI Premium)
*   **Design**: Interface "Dark-First" com efeitos de glassmorphism e transparências.
*   **Responsividade**: Layout adaptável para Mobile (Bottom Navigation) e Desktop (Sidebar).
*   **Navegação**: Sistema de rotas protegidas baseado em cargos (RBAC).

### 🗄️ Backend & Banco de Dados
*   **Isolamento Organizacional**: Cada registro no banco (Solicitações/Ativos) possui `company_id` e `department_id`.
*   **Autenticação**: Integrada com controle de acesso corporativo via e-mail `@globalp.com.br`.
*   **Auditoria**: Tabela de histórico dedicada que registra cada mudança de status, autor e comentário.

## 4. Fluxo de Processo (Workflow)
O sistema implementa o seguinte pipeline de decisão:
1.  **Solicitante**: Abertura do pedido com anexos e links.
2.  **Gestor**: Validação inicial da necessidade.
3.  **TI**: Verificação de viabilidade técnica.
4.  **Diretoria**: Aprovação orçamentária final.
5.  **Compras**: Processamento da aquisição e fechamento.

## 5. Manutenção e Escalabilidade
*   **Migrações**: O banco é controlado via scripts SQL versionados, facilitando deploys e backups.
*   **SaaS Ready**: A estrutura está pronta para receber novas filiais ou departamentos apenas via configuração de banco, sem necessidade de novas linhas de código.
*   **Ambientes**: Separação clara entre Desenvolvimento (Localhost) e Produção.

---
*Gerado automaticamente pelo Antigravity AI em 06 de Abril de 2026.*
