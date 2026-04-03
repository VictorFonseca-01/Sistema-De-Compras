-- 202604030000_audit_hardening_v4.sql
-- Auditoria Sênior: Correção de Integridade de Cadastro e Hardening de Segurança

-- 1. Melhora a função de captura de novos usuários (Fix Data Loss no Cadastro)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    input_role user_role;
    input_dept TEXT;
BEGIN
    -- Captura metadados vindos do Register.tsx
    input_role := (new.raw_user_meta_data->>'role')::user_role;
    input_dept := new.raw_user_meta_data->>'department';

    -- Fallback de segurança
    IF input_role IS NULL THEN input_role := 'usuario'; END IF;

    INSERT INTO public.profiles (id, email, full_name, role, department)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name', 
        input_role,
        input_dept
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Refatoração de RLS para Profiles (Privilégio Mínimo e Performance)
-- Removemos o "Nuclear Fix" excessivamente permissivo
DROP POLICY IF EXISTS "Profiles_Select_Simple" ON public.profiles;
DROP POLICY IF EXISTS "Profiles_Update_Self" ON public.profiles;
DROP POLICY IF EXISTS "Profiles_Admin_All" ON public.profiles;

-- SELECT: Aberto para autenticados (necessário para busca de gestores no fluxo de compra)
CREATE POLICY "Profiles_Select_Authenticated" 
ON public.profiles FOR SELECT TO authenticated 
USING (true);

-- UPDATE: Apenas o próprio usuário ou Master Admin
CREATE POLICY "Profiles_Update_Policy" 
ON public.profiles FOR UPDATE TO authenticated 
USING (
    auth.uid() = id OR 
    public.check_is_master_admin(auth.uid())
)
WITH CHECK (
    auth.uid() = id OR 
    public.check_is_master_admin(auth.uid())
);

-- DELETE: Apenas Master Admin
CREATE POLICY "Profiles_Delete_Admin" 
ON public.profiles FOR DELETE TO authenticated 
USING (public.check_is_master_admin(auth.uid()));

-- 3. Notificar recarregamento de esquema
NOTIFY pgrst, 'reload schema';
