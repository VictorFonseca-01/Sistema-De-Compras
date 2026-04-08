-- ======================================================================
-- CAMPOS DE ROTEAMENTO INTELIGENTE E GOVERNANÇA SETORIAL
-- ======================================================================

-- 1. Adicionar colunas de controle e organização
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS responsible_area TEXT,
ADD COLUMN IF NOT EXISTS needs_ti_analysis BOOLEAN DEFAULT false;

-- 2. Migrar dados históricos para manter o fluxo de TI funcionando
-- Todas as solicitações que são da categoria 'TI / Tecnologia' devem ter a flag marcada como true.
UPDATE public.requests 
SET needs_ti_analysis = true 
WHERE category = 'TI / Tecnologia';

-- 3. Definir 'TI / Tecnologia' como valor padrão para área responsável nos registros antigos se apropriado
UPDATE public.requests
SET responsible_area = 'TI / Tecnologia'
WHERE category = 'TI / Tecnologia' AND responsible_area IS NULL;

-- Recarregar esquema
NOTIFY pgrst, 'reload schema';
