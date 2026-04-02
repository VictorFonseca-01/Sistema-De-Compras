-- MIGRATION: ADICIONAR COLUNAS FALTANTES PARA O INVENTÁRIO
-- Rodar este script no SQL Editor do Supabase para corrigir os erros de importação.

-- 1. Adicionar colunas na tabela de ativos (Assets)
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS local TEXT,
ADD COLUMN IF NOT EXISTS empresa TEXT,
ADD COLUMN IF NOT EXISTS departamento TEXT,
ADD COLUMN IF NOT EXISTS usuario_nome_importado TEXT,
ADD COLUMN IF NOT EXISTS esta_ativo_planilha TEXT;

-- 2. Garantir que o numero_patrimonio vazio seja tratado como NULL para não violar UNIQUE
UPDATE public.assets 
SET numero_patrimonio = NULL 
WHERE numero_patrimonio = '' OR numero_patrimonio = 'N/A';

-- 3. Atualizar índices para performance
CREATE INDEX IF NOT EXISTS idx_assets_local ON public.assets(local);
CREATE INDEX IF NOT EXISTS idx_assets_empresa ON public.assets(empresa);
CREATE INDEX IF NOT EXISTS idx_assets_usuario ON public.assets(usuario_nome_importado);

-- Logs de confirmação
COMMENT ON COLUMN public.assets.local IS 'Unidade física onde o ativo está localizado';
COMMENT ON COLUMN public.assets.empresa IS 'Empresa proprietária do ativo';
COMMENT ON COLUMN public.assets.departamento IS 'Departamento responsável';
COMMENT ON COLUMN public.assets.usuario_nome_importado IS 'Nome do usuário capturado na importação de planilha';
COMMENT ON COLUMN public.assets.esta_ativo_planilha IS 'Status Ativo (Sim/Não) capturado da primeira coluna da planilha';
