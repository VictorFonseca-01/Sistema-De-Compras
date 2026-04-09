-- ======================================================================
-- EXPANSÃO DA ETAPA DE FINALIZAÇÃO DE COMPRA
-- ======================================================================

-- 1. Adicionar colunas operacionais na tabela requests
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS invoice_series TEXT,
ADD COLUMN IF NOT EXISTS invoice_key TEXT,
ADD COLUMN IF NOT EXISTS invoice_issue_date DATE,
ADD COLUMN IF NOT EXISTS invoice_supplier TEXT,
ADD COLUMN IF NOT EXISTS tracking_carrier TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'Aguardando Envio',
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES public.profiles(id);

-- 2. Expandir categorias de anexos
ALTER TABLE public.request_attachments 
ADD COLUMN IF NOT EXISTS is_fiscal_invoice BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_fiscal_receipt BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_tracking_doc BOOLEAN DEFAULT FALSE;

-- 3. Garantir que as colunas existentes de NF e Rastreio tenham comentários claros
COMMENT ON COLUMN public.requests.invoice_number IS 'Número oficial da Nota Fiscal de saída/entrada';
COMMENT ON COLUMN public.requests.tracking_code IS 'Código de rastreio logístico alfanumérico';

-- 4. Recarregar esquema para o Supabase
NOTIFY pgrst, 'reload schema';
