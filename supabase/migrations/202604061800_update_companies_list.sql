-- ======================================================================
-- ATUALIZAÇÃO DA LISTA DE EMPRESAS/UNIDADES (FILIAIS)
-- ======================================================================

-- 1. Tratar renomeações para seguir a grafia exata solicitada
UPDATE public.companies SET name = 'Varzea Grande' WHERE name = 'Várzea Grande';
UPDATE public.companies SET name = 'Celula' WHERE name = 'Hangar de Célula';

-- 2. Inserir novas unidades ou ativar existentes com a grafia correta
INSERT INTO public.companies (name, active) VALUES 
('Matriz', true),
('Barreiras', true),
('Escolinha Hangar de Peças', true),
('Oficina', true),
('Varzea Grande', true),
('Leme', true),
('Jataí', true),
('Helice', true),
('PT6A', true),
('Celula', true)
ON CONFLICT (name) DO UPDATE SET active = true;

-- 3. Desativar unidades que NÃO estão na lista oficial solicitada (Opcional, mas recomendado para manter a lista limpa)
-- UPDATE public.companies 
-- SET active = false 
-- WHERE name NOT IN (
--   'Matriz', 'Barreiras', 'Escolinha Hangar de Peças', 'Oficina', 
--   'Varzea Grande', 'Leme', 'Jataí', 'Helice', 'PT6A', 'Celula'
-- );
