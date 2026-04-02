-- 202604021300_fix_rls_recursion_nuclear.sql
-- NUCLEAR FIX: Solução definitiva contra 'Infinite Recursion' no RLS.
-- Desvincula a lógica da política da consulta direta à tabela, removendo loops circulares.

-- 1. LIMPEZA TOTAL DE POLÍTICAS EXISTENTES (Garantia de Reset)
DO $$
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Admin: Excluir perfis" ON profiles;
    DROP POLICY IF EXISTS "Everyone can see profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can edit themselves" ON profiles;
    -- Requests
    DROP POLICY IF EXISTS "Visualização: Prórpio" ON requests;
    DROP POLICY IF EXISTS "Visualização: Admin e TI" ON requests;
    DROP POLICY IF EXISTS "Visualização: Gestor do Departamento" ON requests;
    DROP POLICY IF EXISTS "Visualização: Compras" ON requests;
    DROP POLICY IF EXISTS "Visualização: Diretoria Estratégica" ON requests;
    DROP POLICY IF EXISTS "Users can view own requests" ON requests;
    DROP POLICY IF EXISTS "Admin/Gestor: View all" ON requests;
    -- Assets
    DROP POLICY IF EXISTS "Vision Global" ON assets;
    DROP POLICY IF EXISTS "Gestão: Admin e TI" ON assets;
EXCEPTION WHEN undefined_table THEN null; END $$;

-- 2. FUNÇÕES 'SECURITY DEFINER' PARA DESACOPLAR PERMISSÕES
-- Estas funções rodam com privilégios de sistema (SECURITY DEFINER), ignorando políticas de RLS no SELECT.
-- Isso quebra a recursividade infinita.

CREATE OR REPLACE FUNCTION public.check_user_role(target_id UUID, role_list public.user_role[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = target_id AND role = ANY(role_list)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_dept(target_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT department FROM public.profiles WHERE id = target_id);
END;
$$;

-- 3. POLÍTICAS DA TABELA 'PROFILES' (Nível Hierárquico)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: Todos podem ver perfis" 
ON public.profiles FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Profiles: Edição própria" 
ON public.profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Profiles: Admin pode tudo" 
ON public.profiles FOR ALL TO authenticated 
USING (public.check_user_role(auth.uid(), ARRAY['master_admin']::public.user_role[]));

-- 4. POLÍTICAS DA TABELA 'REQUESTS' (Visibilidade Múltipla)
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requests: Dono vê seu pedido" 
ON public.requests FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Requests: Hierarquia alta vê tudo" 
ON public.requests FOR SELECT TO authenticated 
USING (public.check_user_role(auth.uid(), ARRAY['master_admin', 'ti', 'diretoria', 'compras']::public.user_role[]));

CREATE POLICY "Requests: Gestor vê seu setor" 
ON public.requests FOR SELECT TO authenticated 
USING (
  public.check_user_role(auth.uid(), ARRAY['gestor']::public.user_role[])
  AND public.get_user_dept(auth.uid()) = public.get_user_dept(user_id)
);

CREATE POLICY "Requests: INSERT" 
ON public.requests FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Requests: UPDATE" 
ON public.requests FOR UPDATE TO authenticated 
USING (
  auth.uid() = user_id 
  OR public.check_user_role(auth.uid(), ARRAY['master_admin', 'ti', 'diretoria', 'compras', 'gestor']::public.user_role[])
);

-- 5. POLÍTICAS DA TABELA 'ASSETS' (Inventário)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assets: Logado vê inventário" 
ON public.assets FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Assets: Gestão administrativa" 
ON public.assets FOR ALL TO authenticated 
USING (public.check_user_role(auth.uid(), ARRAY['master_admin', 'ti']::public.user_role[]));

-- 6. POLÍTICAS ADICIONAIS DE APOIO (Notificações e Comentários)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notif: Acesso próprio" ON public.notifications FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comm: Visibilidade auditada" ON public.request_comments FOR SELECT USING (true);
CREATE POLICY "Comm: Criar" ON public.request_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Recarrega schema
NOTIFY pgrst, 'reload schema';
