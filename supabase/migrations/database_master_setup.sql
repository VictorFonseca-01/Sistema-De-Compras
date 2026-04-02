-- ==========================================
-- SCRIPT DE SETUP MESTRE: SISTEMA DE COMPRAS
-- Versão: 2.0 (Consolidada)
-- Projeto ID: vhponwmvwregdxrxjgel
-- ==========================================

-- 1. EXTENSÕES E TIPOS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('master_admin', 'usuario', 'gestor', 'ti', 'compras', 'diretoria');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.request_status AS ENUM (
      'pending_gestor', 
      'pending_ti', 
      'pending_compras', 
      'pending_diretoria', 
      'approved', 
      'rejected', 
      'adjustment_needed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABELAS (Estrutura com ON DELETE CASCADE)

-- Perfis
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role public.user_role DEFAULT 'usuario',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Solicitações
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  estimated_cost DECIMAL(12, 2),
  priority TEXT CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  status public.request_status DEFAULT 'pending_gestor',
  current_step public.user_role DEFAULT 'gestor',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentários
CREATE TABLE IF NOT EXISTS public.request_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Anexos
CREATE TABLE IF NOT EXISTS public.request_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Links
CREATE TABLE IF NOT EXISTS public.request_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Histórico de Status
CREATE TABLE IF NOT EXISTS public.request_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  old_status public.request_status,
  new_status public.request_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. POLÍTICAS DE SEGURANÇA (RLS)

-- Perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Solicitações
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own requests" ON public.requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin/Gestor: View all" ON public.requests FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master_admin', 'diretoria', 'compras'))
  OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'gestor' AND current_step = 'gestor'))
  OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ti' AND current_step = 'ti'))
);
CREATE POLICY "Users can create requests" ON public.requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Relevant roles can update" ON public.requests FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master_admin', 'diretoria', 'compras', 'ti', 'gestor'))
);

-- Notificações
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Comentários e Histórico
ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access to comments based on request visibility" ON public.request_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id)
);
CREATE POLICY "Add comments" ON public.request_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access to history based on request visibility" ON public.request_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id)
);

-- 4. FUNÇÕES E TRIGGERS

-- Handler: Novos Usuários do Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'usuario');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Handler: Notificações
CREATE OR REPLACE FUNCTION public.handle_request_notification()
RETURNS trigger AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (NEW.user_id, 'Status Atualizado', 'Sua solicitação "' || NEW.title || '" mudou para ' || NEW.status, '/solicitacao/' || NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_request_status_change ON public.requests;
CREATE TRIGGER on_request_status_change
  AFTER UPDATE OF status ON public.requests
  FOR EACH ROW EXECUTE PROCEDURE public.handle_request_notification();

-- 5. FUNÇÃO DE EXCLUSÃO MESTRE (RPC)
CREATE OR REPLACE FUNCTION public.execute_profile_deletion(profile_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master_admin') THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;
  DELETE FROM public.profiles WHERE id = profile_uuid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_profile_deletion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_profile_deletion(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.execute_profile_deletion(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
