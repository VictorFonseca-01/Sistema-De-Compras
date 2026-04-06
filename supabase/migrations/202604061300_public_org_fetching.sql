-- 202604061300_public_org_fetching.sql
-- FIX: Permitir que usuários anônimos vejam Unidades e Setores para o Cadastro

-- 1. Políticas para Companies
DROP POLICY IF EXISTS "Companies_Public_Select" ON public.companies;
CREATE POLICY "Companies_Public_Select" ON public.companies 
AS PERMISSIVE FOR SELECT TO anon, authenticated 
USING (active = true);

-- 2. Políticas para Departments
DROP POLICY IF EXISTS "Departments_Public_Select" ON public.departments;
CREATE POLICY "Departments_Public_Select" ON public.departments 
AS PERMISSIVE FOR SELECT TO anon, authenticated 
USING (active = true);

-- 3. Garantir Grant para funções públicas se necessário
GRANT SELECT ON public.companies TO anon, authenticated;
GRANT SELECT ON public.departments TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
