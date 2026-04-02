-- 202604021000_security_audit_fix.sql
-- SCRIPT MESTRE: Reconstrução de Estrutura, Segurança e Automação

-- 0. Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Criação de Tipos (Enums)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('master_admin', 'usuario', 'gestor', 'ti', 'compras', 'diretoria');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM (
      'pending_gestor', 
      'pending_ti', 
      'pending_compras', 
      'pending_diretoria', 
      'approved', 
      'rejected', 
      'adjustment_needed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Criação de Tabelas (Ordem de Dependência)

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'usuario',
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Requests
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  estimated_cost DECIMAL(12, 2),
  priority TEXT CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  status request_status DEFAULT 'pending_gestor',
  current_step user_role DEFAULT 'gestor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comments
CREATE TABLE IF NOT EXISTS public.request_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attachments
CREATE TABLE IF NOT EXISTS public.request_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Links
CREATE TABLE IF NOT EXISTS public.request_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Status History
CREATE TABLE IF NOT EXISTS public.request_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  old_status request_status,
  new_status request_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitação de RLS em TODAS as Tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE SEGURANÇA (Refinadas e Hierárquicas)

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admin: Excluir perfis" ON public.profiles;
CREATE POLICY "Admin: Excluir perfis" ON public.profiles FOR DELETE TO authenticated USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'master_admin'
);



-- Requests (Visibilidade Complexa)
DROP POLICY IF EXISTS "Visualização: Prórpio" ON public.requests;
CREATE POLICY "Visualização: Prórpio" ON public.requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Visualização: Admin e TI" ON public.requests;
CREATE POLICY "Visualização: Admin e TI" ON public.requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master_admin', 'ti'))
);

DROP POLICY IF EXISTS "Visualização: Gestor do Departamento" ON public.requests;
CREATE POLICY "Visualização: Gestor do Departamento" ON public.requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p_me
    JOIN public.profiles p_req ON p_req.id = public.requests.user_id
    WHERE p_me.id = auth.uid() AND p_me.role = 'gestor' AND p_req.department = p_me.department
  )
);

DROP POLICY IF EXISTS "Visualização: Compras" ON public.requests;
CREATE POLICY "Visualização: Compras" ON public.requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'compras' AND current_step = 'compras')
);

DROP POLICY IF EXISTS "Visualização: Diretoria Estratégica" ON public.requests;
CREATE POLICY "Visualização: Diretoria Estratégica" ON public.requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p_me
    WHERE p_me.id = auth.uid() AND p_me.role = 'diretoria'
    AND (status != 'pending_gestor' OR EXISTS (SELECT 1 FROM public.profiles p_req WHERE p_req.id = public.requests.user_id AND p_req.role = 'gestor'))
  )
);

-- Status History (Restrito à visibilidade do Pedido)
DROP POLICY IF EXISTS "Visualização: Histórico vinculado" ON public.request_status_history;
CREATE POLICY "Visualização: Histórico vinculado" ON public.request_status_history
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.requests WHERE public.requests.id = public.request_status_history.request_id)
);

-- Notifications (Privacidade Total)
DROP POLICY IF EXISTS "Privado: Próprias notificações" ON public.notifications;
CREATE POLICY "Privado: Próprias notificações" ON public.notifications
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Comments (Compartilhado)
DROP POLICY IF EXISTS "Visualização: Comentários compartilhados" ON public.request_comments;
CREATE POLICY "Visualização: Comentários compartilhados" ON public.request_comments
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.requests WHERE public.requests.id = public.request_comments.request_id)
);

-- Attachments e Links
DROP POLICY IF EXISTS "Todos podem ver anexos" ON public.request_attachments;
CREATE POLICY "Todos podem ver anexos" ON public.request_attachments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Todos podem ver links" ON public.request_links;
CREATE POLICY "Todos podem ver links" ON public.request_links FOR SELECT TO authenticated USING (true);

-- 5. FUNÇÕES E TRIGGERS (Automação)

-- Trigger: Novo Usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF new.email NOT LIKE '%@globalp.com.br' THEN RAISE EXCEPTION 'Domínio não permitido.'; END IF;
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'usuario');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: Notificações de Status
CREATE OR REPLACE FUNCTION public.handle_request_notification()
RETURNS trigger AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      NEW.user_id,
      'Atualização de Status',
      'Sua solicitação "' || NEW.title || '" mudou para: ' || NEW.status,
      '/solicitacao/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_request_status_change ON public.requests;
CREATE TRIGGER on_request_status_change AFTER UPDATE OF status ON public.requests FOR EACH ROW EXECUTE PROCEDURE public.handle_request_notification();

-- 7. CORREÇÃO DE INTEGRIDADE (Exclusão em Cascata)
-- Garante que o banco não bloqueie a exclusão de perfis que possuem histórico
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_user_id_fkey;
ALTER TABLE public.requests ADD CONSTRAINT requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.request_comments DROP CONSTRAINT IF EXISTS request_comments_user_id_fkey;
ALTER TABLE public.request_comments ADD CONSTRAINT request_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.request_status_history DROP CONSTRAINT IF EXISTS request_status_history_changed_by_fkey;
ALTER TABLE public.request_status_history ADD CONSTRAINT request_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 8. FUNÇÃO DE EXCLUSÃO ROBUSTA V2 (RPC)
-- Permite que Admin Master delete perfis ignorando conflitos de RLS
CREATE OR REPLACE FUNCTION public.execute_profile_deletion(profile_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Verifica se o usuário que está chamando a função é um Master Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'master_admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas Master Admins podem realizar esta operação.';
  END IF;

  -- 2. Executa a exclusão definitiva (O CASCADE nas FKs cuidará do histórico)
  DELETE FROM public.profiles WHERE id = profile_uuid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_profile_deletion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_profile_deletion(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.execute_profile_deletion(UUID) TO service_role;

-- Notificação de recarregamento de schema
NOTIFY pgrst, 'reload schema';



