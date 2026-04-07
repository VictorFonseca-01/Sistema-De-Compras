-- Migração: Suporte a E-mails Compartilhados via Identidade Composta (Nome + Email)
-- Descrição: Remove unicidade de email simples e adiciona unicidade (nome, email).

BEGIN;

-- 1. Remover constraint de email único se existir
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;

-- 2. Garantir que não existam nulos em campos críticos
UPDATE public.profiles SET full_name = 'Usuário Sem Nome' WHERE full_name IS NULL;

-- 3. Adicionar constraint única composta (Nome + Email)
-- Isso permite múltiplos "compras@globalp.com.br" desde que tenham nomes diferentes.
ALTER TABLE public.profiles ADD CONSTRAINT profiles_full_name_email_key UNIQUE (full_name, email);

-- 4. Atualizar a função de Gatilho para Novos Usuários
-- Agora ela precisa ser capaz de processar a "identidade sintética" se ela vier no formato nome#email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    real_email text;
    extracted_name text;
BEGIN
    -- Se o email contém '#', assumimos que é uma identidade sintética e extraímos o email real
    IF position('#' in new.email) > 0 THEN
        real_email := split_part(new.email, '#', 2);
    ELSE
        real_email := new.email;
    END IF;

    -- Priorizamos o nome vindo do meta_data, mas se não houver, tentamos extrair da identidade sintética
    extracted_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '#', 1));

    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        role, 
        department, 
        department_id, 
        company_id
    )
    VALUES (
        new.id, 
        real_email, 
        extracted_name,
        COALESCE(new.raw_user_meta_data->>'role', 'usuario')::public.user_role,
        new.raw_user_meta_data->>'department',
        (new.raw_user_meta_data->>'department_id')::uuid,
        (new.raw_user_meta_data->>'company_id')::uuid
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
