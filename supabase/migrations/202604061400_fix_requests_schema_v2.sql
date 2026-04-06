-- 202604061400_fix_requests_schema_v2.sql
-- Correção de Esquema: Garantia de Colunas Organizacionais na Tabela Requests

DO $$ 
BEGIN 
    -- 1. Garantir coluna company_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='requests' AND column_name='company_id') THEN
        ALTER TABLE public.requests ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;

    -- 2. Garantir coluna department_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='requests' AND column_name='department_id') THEN
        ALTER TABLE public.requests ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao tentar ajustar colunas em requests: %', SQLERRM;
END $$;

-- Recarregar esquema para PostgREST
NOTIFY pgrst, 'reload schema';
