-- ======================================================================
-- RASTREABILIDADE DE CUSTOS: ORÇAMENTO BASE VS GASTO REAL
-- ======================================================================

-- 1. Adicionar colunas de controle financeiro
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12, 2);

-- 2. Migrar dados iniciais para consistência
-- Inicialmente, o 'Custo Real' é nulo para pedidos novos, 
-- mas para registros históricos onde a cotação já foi feita, 
-- podemos espelhar o estimated_cost momentaneamente.
UPDATE public.requests 
SET actual_cost = estimated_cost 
WHERE status = 'COMPLETED' AND actual_cost IS NULL;

-- 3. Recarregar esquema para o Supabase
NOTIFY pgrst, 'reload schema';
