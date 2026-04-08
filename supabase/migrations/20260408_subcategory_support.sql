-- ======================================================================
-- SUPORTE A SUBCATEGORIAS DINÂMICAS
-- ======================================================================

-- 1. Adicionar coluna de subcategoria
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS subcategoria_solicitacao TEXT;

-- Recarregar esquema
NOTIFY pgrst, 'reload schema';
