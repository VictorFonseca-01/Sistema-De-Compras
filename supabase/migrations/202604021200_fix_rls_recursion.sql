-- 202604021200_fix_rls_recursion.sql
-- FIX: Proteção contra Recursividade Infinita em Políticas de RLS
-- Utiliza funções SECURITY DEFINER para quebrar o loop de consulta na tabela profiles.

-- 1. Função para capturar o Role de forma segura (ignora RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- 2. Função para capturar o Departamento de forma segura
CREATE OR REPLACE FUNCTION public.get_my_department()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT department FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- 3. Recriar Políticas da Tabela PROFILES (Eliminando Subqueries)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY; -- Reset temporário
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin: Excluir perfis" ON public.profiles;
CREATE POLICY "Admin: Excluir perfis" ON public.profiles FOR DELETE TO authenticated USING (
  public.get_my_role() = 'master_admin'
);

-- 4. Recriar Políticas da Tabela REQUESTS (Eliminando Subqueries recursivas)
ALTER TABLE public.requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visualização: Prórpio" ON public.requests;
CREATE POLICY "Visualização: Prórpio" ON public.requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Visualização: Admin e TI" ON public.requests;
CREATE POLICY "Visualização: Admin e TI" ON public.requests FOR SELECT TO authenticated USING (
  public.get_my_role() IN ('master_admin', 'ti')
);

DROP POLICY IF EXISTS "Visualização: Compras" ON public.requests;
CREATE POLICY "Visualização: Compras" ON public.requests FOR SELECT TO authenticated USING (
  public.get_my_role() = 'compras' AND current_step = 'compras'
);

DROP POLICY IF EXISTS "Visualização: Diretoria Estratégica" ON public.requests;
CREATE POLICY "Visualização: Diretoria Estratégica" ON public.requests FOR SELECT TO authenticated USING (
  public.get_my_role() = 'diretoria'
);

-- Política de Gestor (Simplificada para evitar join recursivo)
DROP POLICY IF EXISTS "Visualização: Gestor do Departamento" ON public.requests;
CREATE POLICY "Visualização: Gestor do Departamento" ON public.requests FOR SELECT TO authenticated USING (
  public.get_my_role() = 'gestor' 
  AND (SELECT department FROM public.profiles WHERE id = public.requests.user_id) = public.get_my_department()
);

-- 5. Novas Políticas para a Tabela ASSETS (Inventário)
ALTER TABLE public.assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vision Global" ON public.assets;
CREATE POLICY "Vision Global" ON public.assets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Gestão: Admin e TI" ON public.assets;
CREATE POLICY "Gestão: Admin e TI" ON public.assets FOR ALL TO authenticated USING (
  public.get_my_role() IN ('master_admin', 'ti')
);

-- 6. RPC: Zerar Estoque (Garantia de Role no Servidor)
CREATE OR REPLACE FUNCTION public.empty_asset_inventory()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_my_role() != 'master_admin' THEN
    RAISE EXCEPTION 'Acesso negado. Apenas o Administrador Master pode zerar o estoque.';
  END IF;

  DELETE FROM public.assets;
END;
$$;

-- Notifica o recarregamento
NOTIFY pgrst, 'reload schema';
