-- ======================================================================
-- 1. ESTRUTURA ORGANIZACIONAL (EMPRESAS E DEPARTAMENTOS)
-- ======================================================================

-- Tabela de Empresas/Unidades
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    city TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Departamentos
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Escopos de Gestão (A alma da nova regra de visualização)
CREATE TABLE IF NOT EXISTS public.manager_scopes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('company', 'department', 'custom')),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_scopes ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 2. ADAPTAÇÃO DAS TABELAS EXISTENTES
-- ======================================================================

-- Adicionar colunas em profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_id') THEN
        ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='department_id') THEN
        ALTER TABLE public.profiles ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
END $$;

-- Adicionar colunas em requests
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='company_id') THEN
        ALTER TABLE public.requests ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='department_id') THEN
        ALTER TABLE public.requests ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
END $$;

-- ======================================================================
-- 3. CARGA INICIAL DE UNIDADES E DEPARTAMENTOS
-- ======================================================================

-- Inserir Unidades (Empresas)
INSERT INTO public.companies (name, city) VALUES 
('Matriz', 'Goiânia'),
('Oficina', 'Goiânia'),
('Escolinha Hangar de Peças', 'Goiânia'),
('PT6A', 'Goiânia'),
('Hangar de Célula', 'Goiânia'),
('Várzea Grande', 'Várzea Grande'),
('Barreiras', 'Barreiras'),
('Jataí', 'Jataí')
ON CONFLICT (name) DO NOTHING;

-- Inserir Departamentos
INSERT INTO public.departments (name) VALUES 
('Administrativo'),
('Comercial'),
('Compras'),
('Diretoria'),
('Engenharia'),
('Estoque'),
('Financeiro'),
('Logística'),
('Operacional'),
('Recursos Humanos'),
('TI')
ON CONFLICT (name) DO NOTHING;

-- ======================================================================
-- 4. LOGICA DE SEGURANÇA (FUNÇÕES E RLS)
-- ======================================================================

-- Função para verificar se um usuário tem acesso a uma solicitação específica
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
    
    -- Obter role do usuário
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id_auth;
    
    -- Admin Master vê tudo
    IF user_role = 'master_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Obter dados da solicitação
    SELECT user_id, company_id, department_id INTO req_user_id, req_company_id, req_department_id
    FROM public.requests WHERE id = target_request_id;
    
    -- Funcionário vê apenas o próprio
    IF user_id_auth = req_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar escopos de gestão
    IF EXISTS (
        SELECT 1 FROM public.manager_scopes ms
        WHERE ms.user_id = user_id_auth
        AND ms.active = true
        AND (
            (ms.scope_type = 'company' AND ms.company_id = req_company_id) OR
            (ms.scope_type = 'department' AND ms.company_id = req_company_id AND ms.department_id = req_department_id) OR
            (ms.scope_type = 'custom' AND ms.company_id = req_company_id AND ms.department_id = req_department_id)
        )
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies para Requests (SELECT)
DROP POLICY IF EXISTS "Access requests based on ownership and scope" ON public.requests;
CREATE POLICY "Access requests based on ownership and scope" ON public.requests
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master_admin', 'ti', 'compras', 'diretoria') OR
    EXISTS (
        SELECT 1 FROM public.manager_scopes ms
        WHERE ms.user_id = auth.uid()
        AND ms.active = true
        AND (
            (ms.scope_type = 'company' AND ms.company_id = requests.company_id) OR
            (ms.scope_type = 'department' AND ms.company_id = requests.company_id AND ms.department_id = requests.department_id) OR
            (ms.scope_type = 'custom' AND ms.company_id = requests.company_id AND ms.department_id = requests.department_id)
        )
    )
);

-- ======================================================================
-- 5. MIGRAÇÃO DE DADOS LEGADOS (STRINGS -> UUIDS)
-- ======================================================================

-- Vincular Departamentos existentes nos perfis
UPDATE public.profiles p
SET department_id = d.id
FROM public.departments d
WHERE p.department = d.name AND p.department_id IS NULL;

-- Vincular Unidade padrão (Matriz) para perfis existentes se não houver
UPDATE public.profiles
SET company_id = (SELECT id FROM public.companies WHERE name = 'Matriz' LIMIT 1)
WHERE company_id IS NULL;

-- Sincronizar Requests com dados do perfil se colunas estiverem vazias
UPDATE public.requests r
SET 
  company_id = p.company_id,
  department_id = p.department_id
FROM public.profiles p
WHERE r.user_id = p.id AND r.company_id IS NULL;

-- Policies para Requests (INSERT)
DROP POLICY IF EXISTS "Allow authenticated insert requests" ON public.requests;
CREATE POLICY "Allow authenticated insert requests" ON public.requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Trigger para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_manager_scopes_updated_at BEFORE UPDATE ON public.manager_scopes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
