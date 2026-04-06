-- 202604061200_assets_rls_alignment.sql
-- ALINHAMENTO: Visibilidade do Inventário por Escopo Organizacional

-- 1. Remover políticas antigas
DROP POLICY IF EXISTS "Admins e TI podem ver todos os ativos" ON public.assets;
DROP POLICY IF EXISTS "Usuários podem ver apenas ativos vinculados a eles" ON public.assets;
DROP POLICY IF EXISTS "Somente TI e Admin podem modificar ativos" ON public.assets;

-- 2. NOVA POLÍTICA: Visibilidade por Escopo (Unidade)
-- Admite: Master Admin, TI, Compras, Diretoria (Global)
-- Admite: Gestores que possuam escopo na empresa (company_id) do ativo.
CREATE POLICY "Assets_Select_Scope_Policy" ON public.assets
FOR SELECT TO authenticated
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master_admin', 'ti', 'compras', 'diretoria') OR
    EXISTS (
        SELECT 1 FROM public.manager_scopes ms
        WHERE ms.user_id = auth.uid()
        AND ms.active = true
        AND ms.scope_type = 'company'
        AND ms.company_id = assets.company_id
    ) OR
    id IN (
        SELECT asset_id FROM public.asset_assignments 
        WHERE user_id = auth.uid() AND status = 'ativo'
    )
);

-- 3. NOVA POLÍTICA: Gestão Centralizada
-- Apenas TI e Admin Master podem inserir/alterar/excluir ativos do patrimônio.
CREATE POLICY "Assets_Manage_Admin_Policy" ON public.assets
FOR ALL TO authenticated
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master_admin', 'ti')
);

-- Notificar recarregamento
NOTIFY pgrst, 'reload schema';
