-- ======================================================================
-- GARANTIA DE INTEGRIDADE: ESCOPOS ÚNICOS
-- ======================================================================

-- 1. LIMPEZA DE POSSÍVEIS DUPLICATAS ANTES DE APLICAR CONSTRAINT
DELETE FROM public.manager_scopes a
USING public.manager_scopes b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.company_id = b.company_id
  AND (a.department_id = b.department_id OR (a.department_id IS NULL AND b.department_id IS NULL))
  AND a.scope_type = b.scope_type;

-- 2. CRIAÇÃO DE ÍNDICE ÚNICO TRATANDO NULLS EM DEPARTMENT_ID
-- Nota: Usamos COALESCE para garantir que NULL seja tratado como um valor comparável para unicidade
CREATE UNIQUE INDEX IF NOT EXISTS idx_manager_scopes_unique_entry
ON public.manager_scopes (
    user_id, 
    company_id, 
    (COALESCE(department_id, '00000000-0000-0000-0000-000000000000')), 
    scope_type
);

-- 3. COMENTÁRIO DE AUDITORIA
COMMENT ON INDEX public.idx_manager_scopes_unique_entry IS 'Garante que um gestor não possua regras duplicadas para o mesmo perímetro corporativo.';

NOTIFY pgrst, 'reload schema';
