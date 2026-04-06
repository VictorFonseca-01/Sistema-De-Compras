-- 202604060000_fix_auth_trigger_v5.sql
-- NUCLEAR FIX: Garantia de Colunas e Trigger Resiliente para Cadastro

-- 1. Garantir que as colunas organizacionais existam em profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='profiles' AND column_name='company_id') THEN
        ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='profiles' AND column_name='department_id') THEN
        ALTER TABLE public.profiles ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao tentar adicionar colunas em profiles: %', SQLERRM;
END $$;

-- 2. Função de trigger ultra-segura
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    input_role user_role;
    target_company_id UUID;
    target_department_id UUID;
    dept_name TEXT;
    full_name_val TEXT;
BEGIN
    -- Captura role do metadado
    BEGIN
        input_role := (new.raw_user_meta_data->>'role')::user_role;
    EXCEPTION WHEN OTHERS THEN
        input_role := 'usuario';
    END;

    -- Captura IDs com Safe UUID parsing
    BEGIN
        target_company_id := NULLIF(new.raw_user_meta_data->>'company_id', '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        target_company_id := NULL;
    END;

    BEGIN
        target_department_id := NULLIF(new.raw_user_meta_data->>'department_id', '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        target_department_id := NULL;
    END;
    
    dept_name := new.raw_user_meta_data->>'department';
    full_name_val := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

    -- Prioridade 2: Fallback para IDs se nulos
    IF target_company_id IS NULL THEN
        SELECT id INTO target_company_id FROM public.companies WHERE name = 'Matriz' LIMIT 1;
    END IF;

    IF target_department_id IS NULL AND dept_name IS NOT NULL THEN
        SELECT id INTO target_department_id FROM public.departments WHERE name = dept_name LIMIT 1;
    END IF;

    -- Inserção segura com tratamento de exceção global
    BEGIN
        INSERT INTO public.profiles (
            id, 
            email, 
            full_name, 
            role, 
            department,
            company_id, 
            department_id
        )
        VALUES (
            new.id, 
            new.email, 
            full_name_val, 
            COALESCE(input_role, 'usuario'),
            dept_name,
            target_company_id,
            target_department_id
        );
    EXCEPTION WHEN OTHERS THEN
        -- Se falhar o insert completo, tenta um insert minimalista para não bloquear o Auth
        INSERT INTO public.profiles (id, email, role)
        VALUES (new.id, new.email, 'usuario')
        ON CONFLICT (id) DO NOTHING;
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-aplicar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Notificar recarregamento
NOTIFY pgrst, 'reload schema';
