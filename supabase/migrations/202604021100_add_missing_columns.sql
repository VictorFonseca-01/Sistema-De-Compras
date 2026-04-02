-- MIGRATION: ADICIONAR COLUNAS FALTANTES PARA O INVENTÁRIO
-- Rodar este script no SQL Editor do Supabase para corrigir os erros de importação.

-- 1. Adicionar colunas na tabela de ativos (Assets)
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS local TEXT,
ADD COLUMN IF NOT EXISTS empresa TEXT,
ADD COLUMN IF NOT EXISTS departamento TEXT;

-- 2. Garantir que o numero_patrimonio vazio seja tratado como NULL para não violar UNIQUE
-- (Isso permite que múltiplos itens tenham "NULL" no banco sem erro)
-- Se houver strings 'N/A' ou vazias no banco, convém converter para NULL.
UPDATE public.assets 
SET numero_patrimonio = NULL 
WHERE numero_patrimonio = '' OR numero_patrimonio = 'N/A';

-- 3. Atualizar índices para performance (opcional, recomendado)
CREATE INDEX IF NOT EXISTS idx_assets_local ON public.assets(local);
CREATE INDEX IF NOT EXISTS idx_assets_empresa ON public.assets(empresa);

-- Logs de confirmação
COMMENT ON COLUMN public.assets.local IS 'Unidade física onde o ativo está localizado';
COMMENT ON COLUMN public.assets.empresa IS 'Empresa proprietária do ativo (ex: GlobalP, Master)';
COMMENT ON COLUMN public.assets.departamento IS 'Departamento responsável (ex: Operacional, RH)';
