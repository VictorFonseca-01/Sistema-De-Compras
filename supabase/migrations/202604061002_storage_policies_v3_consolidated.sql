-- 202604061002_storage_policies_v3_consolidated.sql
-- ======================================================================
-- MASTER BOOTSTRAP: ESTRUTURA BASE + SEGURANÇA CONSOLIDADA
-- ======================================================================

-- 1. TABELAS ORGANIZACIONAIS (Se não existirem)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    city TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.manager_scopes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('company', 'department', 'custom')),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_scopes ENABLE ROW LEVEL SECURITY;

-- 2. ADAPTAÇÃO DE COLUNAS EM TABELAS EXISTENTES
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_id') THEN
        ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='company_id') THEN
        ALTER TABLE public.requests ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
END $$;

-- 3. CARGA INICIAL DE DADOS
INSERT INTO public.companies (name, city) VALUES 
('Matriz', 'Goiânia'), ('Oficina', 'Goiânia'), ('Escolinha Hangar de Peças', 'Goiânia'),
('Jataí', 'Jataí'), ('Barreiras', 'Barreiras')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.departments (name) VALUES 
('Administrativo'), ('Comercial'), ('Compras'), ('Diretoria'), ('Estoque'), ('TI')
ON CONFLICT (name) DO NOTHING;

-- 4. FUNÇÃO DE VALIDAÇÃO DE ACESSO (Dependency)
CREATE OR REPLACE FUNCTION public.check_user_request_access(target_request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_id_auth UUID;
    req_user_id UUID;
    req_company_id UUID;
    req_department_id UUID;
BEGIN
    user_id_auth := auth.uid();
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id_auth;
    IF user_role = 'master_admin' THEN RETURN TRUE; END IF;
    
    SELECT user_id, company_id, department_id INTO req_user_id, req_company_id, req_department_id
    FROM public.requests WHERE id = target_request_id;
    
    IF user_id_auth = req_user_id THEN RETURN TRUE; END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM public.manager_scopes ms
        WHERE ms.user_id = user_id_auth
        AND ms.active = true
        AND (
            (ms.scope_type = 'company' AND ms.company_id = req_company_id) OR
            (ms.scope_type = 'department' AND ms.company_id = req_company_id AND ms.department_id = req_department_id)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER DE AUTH (v5 FINAL)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, company_id, department_id)
  VALUES (
    new.id, new.email, new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'usuario'),
    (new.raw_user_meta_data->>'company_id')::UUID, (new.raw_user_meta_data->>'department_id')::UUID
  );
  RETURN new;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. POLÍTICAS DE STORAGE (RLS)
DROP POLICY IF EXISTS "Attachments_Select_Policy" ON storage.objects;
DROP POLICY IF EXISTS "Attachments_Insert_Policy" ON storage.objects;

CREATE POLICY "Attachments_Select_Policy" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'request-attachments' AND
  public.check_user_request_access((storage.foldername(name))[1]::UUID)
);

CREATE POLICY "Attachments_Insert_Policy" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'request-attachments' AND
  EXISTS (SELECT 1 FROM public.requests WHERE id = (storage.foldername(name))[1]::UUID AND user_id = auth.uid())
);

-- 7. MIGRAÇÃO DE DADOS LEGADOS
UPDATE public.profiles SET company_id = (SELECT id FROM public.companies WHERE name = 'Matriz' LIMIT 1) WHERE company_id IS NULL;
UPDATE public.requests SET company_id = (SELECT id FROM public.companies WHERE name = 'Matriz' LIMIT 1) WHERE company_id IS NULL;

NOTIFY pgrst, 'reload schema';
