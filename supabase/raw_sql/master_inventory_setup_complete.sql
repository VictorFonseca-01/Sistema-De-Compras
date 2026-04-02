-- ========================================================
-- SISTEMA DE COMPRAS & INVENTÁRIO — SETUP MESTRE CONSOLIDADO
-- Versão 2.1 (Padrão SaaS Premium) 🚀✨
-- Projeto ID: vhponwmvwregdxrxjgel
-- ========================================================

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

-- 2. TABELAS — NÚCLEO DE PERFIS E SOLICITAÇÕES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role public.user_role DEFAULT 'usuario',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

CREATE TABLE IF NOT EXISTS public.request_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.request_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.request_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.request_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  old_status public.request_status,
  new_status public.request_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELAS — INVENTÁRIO E PATRIMÔNIO (CONSOLIDADO 2.1)
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_item TEXT NOT NULL,
    descricao TEXT,
    numero_patrimonio TEXT UNIQUE,
    codigo_barras TEXT UNIQUE,
    codigo_gps TEXT,
    tipo_ativo TEXT, -- 'Proprio', 'Locado'
    categoria TEXT,
    marca TEXT,
    modelo TEXT,
    numero_serie TEXT,
    status TEXT NOT NULL DEFAULT 'em_estoque' CHECK (status IN ('em_estoque', 'em_uso', 'manutencao', 'baixado')),
    valor DECIMAL(12,2),
    fornecedor TEXT,
    data_compra DATE,
    request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Colunas da Versão 2.1
    local TEXT,
    empresa TEXT,
    departamento TEXT,
    usuario_nome_importado TEXT,
    esta_ativo_planilha TEXT
);

CREATE TABLE IF NOT EXISTS public.asset_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'entrega', 'devolucao', 'manutencao', 'baixa', 'importacao')),
    user_id UUID REFERENCES auth.users(id),
    destino_user_id UUID REFERENCES auth.users(id),
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    data_entrega TIMESTAMPTZ DEFAULT now(),
    data_devolucao TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'devolvido')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asset_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    imported_by UUID REFERENCES auth.users(id),
    total_rows INTEGER DEFAULT 0,
    success_rows INTEGER DEFAULT 0,
    error_rows INTEGER DEFAULT 0,
    mode TEXT CHECK (mode IN ('inserir', 'atualizar', 'ignorar_duplicados')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asset_import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.asset_import_batches(id) ON DELETE CASCADE,
    row_number INTEGER,
    numero_patrimonio TEXT,
    codigo_barras TEXT,
    error_message TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_import_errors ENABLE ROW LEVEL SECURITY;

-- Exemplo de Política de Admin Global (Mestre)
CREATE POLICY "Admins can do anything" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master_admin')
);

CREATE POLICY "Assets are viewable for users with access" ON public.assets FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('master_admin', 'ti'))
    OR id IN (SELECT asset_id FROM public.asset_assignments WHERE user_id = auth.uid() AND status = 'ativo')
);

CREATE POLICY "Admins can manage assets" ON public.assets FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('master_admin', 'ti'))
);

-- 5. FUNÇÕES E TRIGGERS (RPCs) - CONSOLIDADO 🚀✨

-- RPC: Excluir Usuário (Auth Admin)
CREATE OR REPLACE FUNCTION public.execute_profile_deletion(profile_uuid UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master_admin') THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;
  DELETE FROM public.profiles WHERE id = profile_uuid;
END; $$;

-- NEW RPC: Esvaziar Inventário (Bulk Clear)
CREATE OR REPLACE FUNCTION public.empty_asset_inventory()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master_admin') THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;
  DELETE FROM public.assets;
END; $$;

GRANT EXECUTE ON FUNCTION public.execute_profile_deletion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.empty_asset_inventory() TO authenticated;

-- Handler: Novo Usuário do Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'usuario');
  RETURN new;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

NOTIFY pgrst, 'reload schema';
