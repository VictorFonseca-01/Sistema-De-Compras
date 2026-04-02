-- 202604021400_fix_rls_recursion_v2.sql
-- REFINED NUCLEAR FIX: Eliminação final de recursividade infinita.
-- O segredo é garantir que a tabela 'profiles' NUNCA consulte a si mesma em uma política SELECT.

-- 1. Reset total das políticas problemáticas
DO $$
BEGIN
    DROP POLICY IF EXISTS "Profiles: Todos podem ver perfis" ON public.profiles;
    DROP POLICY IF EXISTS "Profiles: Edição própria" ON public.profiles;
    DROP POLICY IF EXISTS "Profiles: Admin pode tudo" ON public.profiles;
    DROP POLICY IF EXISTS "Admin: Excluir perfis" ON public.profiles;
EXCEPTION WHEN undefined_table THEN null; END $$;

-- 2. Função SECURITY DEFINER otimizada (Não dispara RLS)
CREATE OR REPLACE FUNCTION public.check_is_master_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Esta consulta ignora RLS por ser SECURITY DEFINER
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'master_admin'
  );
END;
$$;

-- 3. Políticas para PROFILES (Padrão Não-Recursivo)
-- IMPORTANTE: A política de SELECT deve ser a MAIS SIMPLES possível.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Permite que todos os autenticados vejam perfis (Necessário para o App funcionar)
-- Sem subqueries aqui!
CREATE POLICY "Profiles_Select_Simple" 
ON public.profiles FOR SELECT TO authenticated 
USING (true);

-- Permite que o usuário edite apenas o próprio perfil
CREATE POLICY "Profiles_Update_Self" 
ON public.profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permite que admins façam tudo (Usando a função Security Definer que quebra a recursividade)
CREATE POLICY "Profiles_Admin_All" 
ON public.profiles FOR ALL TO authenticated 
USING (public.check_is_master_admin(auth.uid()));

-- 4. Ajuste na Tabela REQUESTS para evitar join recursivo
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Requests: Hierarquia alta vê tudo" ON public.requests;
CREATE POLICY "Requests_Hierarchy_View" 
ON public.requests FOR SELECT TO authenticated 
USING (
  user_id = auth.uid() OR 
  public.check_is_master_admin(auth.uid()) OR
  EXISTS (
     SELECT 1 FROM public.profiles 
     WHERE id = auth.uid() AND role IN ('ti', 'diretoria', 'compras')
  )
);

-- Notifica recarregamento
NOTIFY pgrst, 'reload schema';
