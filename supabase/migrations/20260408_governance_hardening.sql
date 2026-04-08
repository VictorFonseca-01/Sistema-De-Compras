-- ======================================================================
-- ENDURECIMENTO DE GOVERNANÇA E POLÍTICAS DE SEGURANÇA (RBAC)
-- ======================================================================

-- 1. HARDENING DE SOLICITAÇÕES (REQUESTS)
DROP POLICY IF EXISTS "Access requests based on ownership and scope" ON public.requests;
CREATE POLICY "Access requests based on ownership and scope" ON public.requests
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master_admin', 'ti', 'compras', 'diretoria') OR
    EXISTS (
        SELECT 1 FROM public.manager_scopes ms
        WHERE ms.user_id = auth.uid()
        AND ms.active = true
        AND (
            (ms.scope_type = 'company' AND ms.company_id = requests.company_id) OR
            (ms.scope_type = 'department' AND ms.company_id = requests.company_id AND ms.department_id = requests.department_id) OR
            (ms.scope_type = 'custom' AND ms.company_id = requests.company_id AND ms.department_id = requests.department_id)
        )
    )
);

-- BUGFIX: Garantir que Diretoria NÃO possa deletar solicitações
DROP POLICY IF EXISTS "Enable delete for admin/ti and block board" ON public.requests;
CREATE POLICY "Enable delete for admin/ti and block board" ON public.requests
FOR DELETE
TO authenticated
USING (
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master_admin', 'ti')) AND
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) != 'diretoria')
);

-- 2. HARDENING DE PERFIS (PROFILES)
-- Garantir que Diretoria NÃO possa deletar usuários
DROP POLICY IF EXISTS "Allow delete for admins only" ON public.profiles;
CREATE POLICY "Allow delete for admins only" ON public.profiles
FOR DELETE
TO authenticated
USING (
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master_admin', 'ti')) AND
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) != 'diretoria')
);

-- 3. HARDENING DE ESCOPOS (MANAGER_SCOPES)
-- Permitir que TI e Diretoria vejam todos os escopos para auditoria
DROP POLICY IF EXISTS "Extended view for manager_scopes" ON public.manager_scopes;
CREATE POLICY "Extended view for manager_scopes" 
ON public.manager_scopes 
FOR SELECT 
TO authenticated 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master_admin', 'ti', 'diretoria') OR 
    user_id = auth.uid()
);

-- 4. HARDENING DE INVENTÁRIO (ASSETS)
-- Somente perfis autorizados podem ver o estoque
DROP POLICY IF EXISTS "Restrict assets view to authorized roles" ON public.assets;
CREATE POLICY "Restrict assets view to authorized roles" ON public.assets
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master_admin', 'ti', 'compras', 'diretoria')
);

-- Bloquear baixa definitiva para Diretoria
DROP POLICY IF EXISTS "Restrict asset deletion" ON public.assets;
CREATE POLICY "Restrict asset deletion" ON public.assets
FOR DELETE
TO authenticated
USING (
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master_admin', 'ti')) AND
    ((SELECT role FROM public.profiles WHERE id = auth.uid()) != 'diretoria')
);

-- Recarregar esquema
NOTIFY pgrst, 'reload schema';
