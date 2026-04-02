-- REFORÇO DE SEGURANÇA E ATUALIZAÇÃO DE SCHEMA PARA IMPORTAÇÃO

-- 1. ADICIONAR COLUNAS AO SCHEMA DE ATIVOS
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS local TEXT,
ADD COLUMN IF NOT EXISTS usuario_nome_importado TEXT;

-- 2. PROTEÇÃO DA COLUNA 'ROLE' (IMPEDIR AUTO-ELEVAÇÃO)
-- Criar trigger para garantir que pessoas sem role 'master_admin' não alterem o próprio cargo
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS trigger AS $$
BEGIN
  -- Se o usuário tentar mudar o próprio role e não for um master_admin anterior
  IF NEW.role <> OLD.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'master_admin'
    ) THEN
      NEW.role := OLD.role; -- Reverte a alteração de cargo
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_user_role ON public.profiles;
CREATE TRIGGER tr_protect_user_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.protect_user_role();

-- 3. REORGANIZAÇÃO DE POLÍTICAS RLS PARA PERFIS
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Usuários podem atualizar apenas os próprios dados (exceto role, que o trigger protege)
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Admins podem atualizar qualquer perfil
CREATE POLICY "Admins can update profiles" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master_admin')
);
