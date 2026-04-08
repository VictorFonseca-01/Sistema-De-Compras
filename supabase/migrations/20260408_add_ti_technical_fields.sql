-- 20260408_add_ti_technical_fields.sql
-- Expansão da Etapa de TI: Adição de campos técnicos de referência e auditoria

DO $$ 
BEGIN 
    -- 1. Campos na tabela requests
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='ti_estimated_cost') THEN
        ALTER TABLE public.requests ADD COLUMN ti_estimated_cost DECIMAL(12, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='ti_technical_opinion') THEN
        ALTER TABLE public.requests ADD COLUMN ti_technical_opinion TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='ti_reference_link') THEN
        ALTER TABLE public.requests ADD COLUMN ti_reference_link TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='ti_reference_site') THEN
        ALTER TABLE public.requests ADD COLUMN ti_reference_site TEXT;
    END IF;

    -- 2. Identificador de mídia técnica nas tabelas de apoio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='request_attachments' AND column_name='is_technical') THEN
        ALTER TABLE public.request_attachments ADD COLUMN is_technical BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='request_links' AND column_name='is_technical') THEN
        ALTER TABLE public.request_links ADD COLUMN is_technical BOOLEAN DEFAULT FALSE;
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao tentar ajustar colunas técnicas em requests: %', SQLERRM;
END $$;

-- Recarregar esquema para PostgREST
NOTIFY pgrst, 'reload schema';
