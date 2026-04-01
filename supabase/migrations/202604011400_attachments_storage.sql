-- REPARAÇÃO E CONFIGURAÇÃO DE ANEXOS E LINKS
-- Esta migration garante que as tabelas existam e as políticas de segurança estejam corretas.

-- 0. Garantir extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Criação da Tabela de Anexos (se não existir)
CREATE TABLE IF NOT EXISTS public.request_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criação da Tabela de Links (se não existir)
CREATE TABLE IF NOT EXISTS public.request_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitação de RLS
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_links ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS PARA ANEXOS
DROP POLICY IF EXISTS "Todos podem ver anexos" ON public.request_attachments;
CREATE POLICY "Todos podem ver anexos" ON public.request_attachments
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Inserir anexos da solicitação" ON public.request_attachments;
CREATE POLICY "Inserir anexos da solicitação" ON public.request_attachments 
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ti', 'compras', 'master_admin'))
);

DROP POLICY IF EXISTS "Deletar anexos da solicitação" ON public.request_attachments;
CREATE POLICY "Deletar anexos da solicitação" ON public.request_attachments
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ti', 'compras', 'master_admin'))
);

-- 5. POLÍTICAS PARA LINKS (TI e Compras podem gerenciar)
DROP POLICY IF EXISTS "Todos podem ver links" ON public.request_links;
CREATE POLICY "Todos podem ver links" ON public.request_links
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "TI e Compras podem gerenciar links" ON public.request_links;
CREATE POLICY "TI e Compras podem gerenciar links" ON public.request_links
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ti', 'compras', 'master_admin'))
);
