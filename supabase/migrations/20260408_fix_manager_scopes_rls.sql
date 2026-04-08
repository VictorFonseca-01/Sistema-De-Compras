-- ======================================================================
-- CORREÇÃO DE RLS PARA MANAGER_SCOPES
-- ======================================================================

-- 1. DROPPAR POLÍTICAS EXISTENTES (PARA EVITAR DUPLICIDADE)
DROP POLICY IF EXISTS "Users can view their own scopes" ON public.manager_scopes;
DROP POLICY IF EXISTS "Admins can view all scopes" ON public.manager_scopes;
DROP POLICY IF EXISTS "Admins can manage all scopes" ON public.manager_scopes;
DROP POLICY IF EXISTS "Admins can insert scopes" ON public.manager_scopes;
DROP POLICY IF EXISTS "Admins can delete scopes" ON public.manager_scopes;
DROP POLICY IF EXISTS "Admins can update scopes" ON public.manager_scopes;

-- 2. POLÍTICA DE VISUALIZAÇÃO (SELECT)
CREATE POLICY "Admins can view all scopes" 
ON public.manager_scopes 
FOR SELECT 
TO authenticated 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'master_admin' OR 
    user_id = auth.uid()
);

-- 3. POLÍTICA DE INSERÇÃO (INSERT)
CREATE POLICY "Admins can insert scopes" 
ON public.manager_scopes 
FOR INSERT 
TO authenticated 
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'master_admin'
);

-- 4. POLÍTICA DE EXCLUSÃO (DELETE)
CREATE POLICY "Admins can delete scopes" 
ON public.manager_scopes 
FOR DELETE 
TO authenticated 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'master_admin'
);

-- 5. POLÍTICA DE ATUALIZAÇÃO (UPDATE)
CREATE POLICY "Admins can update scopes" 
ON public.manager_scopes 
FOR UPDATE 
TO authenticated 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'master_admin'
)
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'master_admin'
);

-- Recarregar esquema para garantir que o PostgREST pegue as novas permissões
NOTIFY pgrst, 'reload schema';
