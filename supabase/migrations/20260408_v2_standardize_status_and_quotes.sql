-- 20260408_v3_standardize_status_final.sql
-- PADRONIZAÇÃO ROBUSTA DE STATUS E EXPANSÃO DE CAMPOS

-- 1. CRIAR NOVO TIPO ENUM COM PADRÃO CAIXA ALTA
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status_v2') THEN
        CREATE TYPE public.request_status_v2 AS ENUM (
            'CREATED', 
            'PENDING_GESTOR', 
            'APPROVED_GESTOR', 
            'PENDING_TI', 
            'APPROVED_TI', 
            'PENDING_COMPRAS', 
            'IN_COTATION', 
            'PENDING_DIRETORIA', 
            'APPROVED_DIRETORIA', 
            'REJECTED_DIRETORIA', 
            'PENDING_COMPRAS_FINAL', 
            'COMPLETED', 
            'REJECTED',
            'ADJUSTMENT_NEEDED'
        );
    END IF;
END $$;

-- 2. GARANTIR EXISTÊNCIA DA TABELA request_quotes E CAMPOS DE AFILIADOS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='request_quotes') THEN
        CREATE TABLE public.request_quotes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
            supplier_name TEXT NOT NULL,
            price DECIMAL(12, 2) NOT NULL,
            description TEXT,
            is_selected BOOLEAN DEFAULT false,
            justification TEXT,
            quote_date DATE DEFAULT CURRENT_DATE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id)
        );
        ALTER TABLE public.request_quotes ENABLE ROW LEVEL SECURITY;
        
        -- Políticas básicas
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'request_quotes' AND policyname = 'Users can view quotes for their requests') THEN
            CREATE POLICY "Users can view quotes for their requests" ON public.request_quotes FOR SELECT
                USING (EXISTS (SELECT 1 FROM public.requests WHERE id = request_quotes.request_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master_admin', 'gestor', 'ti', 'diretoria', 'compras')))));
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'request_quotes' AND policyname = 'Purchasings and Admins can manage quotes') THEN
            CREATE POLICY "Purchasings and Admins can manage quotes" ON public.request_quotes FOR ALL
                USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master_admin', 'compras')));
        END IF;
    END IF;
END $$;

-- 3. ADICIONAR COLUNAS EXTRAS (SE NÃO EXISTIREM)
-- Em request_quotes
ALTER TABLE public.request_quotes ADD COLUMN IF NOT EXISTS purchase_link TEXT;
ALTER TABLE public.request_quotes ADD COLUMN IF NOT EXISTS supplier_site TEXT;
ALTER TABLE public.request_quotes ADD COLUMN IF NOT EXISTS observations TEXT;
ALTER TABLE public.request_quotes ADD COLUMN IF NOT EXISTS quoted_value DECIMAL(12, 2);

-- Em requests
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS delivery_prediction DATE;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Em request_attachments
ALTER TABLE public.request_attachments ADD COLUMN IF NOT EXISTS is_quote BOOLEAN DEFAULT FALSE;

-- 4. MIGRAÇÃO DE DADOS PARA O NOVO PADRÃO DE STATUS
-- Primeiro, convertemos para TEXT para facilitar a manipulação
ALTER TABLE public.requests ALTER COLUMN status TYPE TEXT;
ALTER TABLE public.request_status_history ALTER COLUMN new_status TYPE TEXT;
ALTER TABLE public.request_status_history ALTER COLUMN old_status TYPE TEXT;

-- Mapeamento de valores antigos para novos (Uppercase) em requests
UPDATE public.requests SET status = 'PENDING_GESTOR' WHERE status = 'pending_gestor';
UPDATE public.requests SET status = 'PENDING_TI' WHERE status = 'pending_ti';
UPDATE public.requests SET status = 'PENDING_COMPRAS' WHERE status = 'pending_compras';
UPDATE public.requests SET status = 'PENDING_DIRETORIA' WHERE status = 'pending_diretoria';
UPDATE public.requests SET status = 'PENDING_COMPRAS_FINAL' WHERE status = 'pending_compras_final';
UPDATE public.requests SET status = 'COMPLETED' WHERE status = 'approved';
UPDATE public.requests SET status = 'REJECTED' WHERE status = 'rejected';
UPDATE public.requests SET status = 'ADJUSTMENT_NEEDED' WHERE status = 'adjustment_needed';
UPDATE public.requests SET status = 'PENDING_GESTOR' WHERE status IS NULL;

-- Mapeamento no histórico (new_status)
UPDATE public.request_status_history SET new_status = 'PENDING_GESTOR' WHERE new_status = 'pending_gestor';
UPDATE public.request_status_history SET new_status = 'PENDING_TI' WHERE new_status = 'pending_ti';
UPDATE public.request_status_history SET new_status = 'PENDING_COMPRAS' WHERE new_status = 'pending_compras';
UPDATE public.request_status_history SET new_status = 'PENDING_DIRETORIA' WHERE new_status = 'pending_diretoria';
UPDATE public.request_status_history SET new_status = 'PENDING_COMPRAS_FINAL' WHERE new_status = 'pending_compras_final';
UPDATE public.request_status_history SET new_status = 'COMPLETED' WHERE new_status = 'approved';
UPDATE public.request_status_history SET new_status = 'REJECTED' WHERE new_status = 'rejected';
UPDATE public.request_status_history SET new_status = 'ADJUSTMENT_NEEDED' WHERE new_status = 'adjustment_needed';

-- Mapeamento no histórico (old_status)
UPDATE public.request_status_history SET old_status = 'PENDING_GESTOR' WHERE old_status = 'pending_gestor';
UPDATE public.request_status_history SET old_status = 'PENDING_TI' WHERE old_status = 'pending_ti';
UPDATE public.request_status_history SET old_status = 'PENDING_COMPRAS' WHERE old_status = 'pending_compras';
UPDATE public.request_status_history SET old_status = 'PENDING_DIRETORIA' WHERE old_status = 'pending_diretoria';
UPDATE public.request_status_history SET old_status = 'PENDING_COMPRAS_FINAL' WHERE old_status = 'pending_compras_final';
UPDATE public.request_status_history SET old_status = 'COMPLETED' WHERE old_status = 'approved';
UPDATE public.request_status_history SET old_status = 'REJECTED' WHERE old_status = 'rejected';
UPDATE public.request_status_history SET old_status = 'ADJUSTMENT_NEEDED' WHERE old_status = 'adjustment_needed';

-- 5. CONVERTER COLUNAS PARA O NOVO ENUM E LIMPAR
-- REMOVER DEFAULTS ANTIGOS
ALTER TABLE public.requests ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.request_status_history ALTER COLUMN new_status DROP DEFAULT;
ALTER TABLE public.request_status_history ALTER COLUMN old_status DROP DEFAULT;

-- Converte para o novo tipo v2
ALTER TABLE public.requests ALTER COLUMN status TYPE public.request_status_v2 USING status::public.request_status_v2;
ALTER TABLE public.request_status_history ALTER COLUMN new_status TYPE public.request_status_v2 USING new_status::public.request_status_v2;
ALTER TABLE public.request_status_history ALTER COLUMN old_status TYPE public.request_status_v2 USING old_status::public.request_status_v2;

-- REAPLICAR DEFAULTS NO NOVO PADRÃO
ALTER TABLE public.requests ALTER COLUMN status SET DEFAULT 'PENDING_GESTOR'::public.request_status_v2;

-- Remover tipo antigo e renomear o novo para o nome original
-- CASCADE garante que se houver algum índice ou visão oculta, ela seja tratada.
DROP TYPE IF EXISTS public.request_status CASCADE;
ALTER TYPE public.request_status_v2 RENAME TO request_status;

-- Recarregar esquema para PostgREST (Supabase)
NOTIFY pgrst, 'reload schema';
