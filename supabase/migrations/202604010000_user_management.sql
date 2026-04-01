-- 1. Permitir que Administradores Master atualizem os dados (Cargo e Departamento) de qualquer perfil
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Admins can update profiles" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master_admin')
);

-- 2. Atualizar a função de criação de usuários para puxar o "Departamento" da tela de Cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Strict domain check
  IF new.email NOT LIKE '%@globalp.com.br' THEN
    RAISE EXCEPTION 'Apenas e-mails do domínio @globalp.com.br são permitidos.';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, department)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'usuario',
    new.raw_user_meta_data->>'department'
  );
  
  RETURN new;
END;
$$;
