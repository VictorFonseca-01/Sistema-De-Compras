-- 202604061100_inventory_management_v2.sql
-- ALINHAMENTO: Integração do Inventário ao Escopo Organizacional (Unidades/Filiais)

-- 1. ADICIONAR COLUNA DE UNIDADE EM ATIVOS (SE NÃO EXISTIR)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='company_id') THEN
        ALTER TABLE public.assets ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. BACKFILL: Vincular ativos sem unidade à "Matriz" por padrão
UPDATE public.assets 
SET company_id = (SELECT id FROM public.companies WHERE name = 'Matriz' LIMIT 1)
WHERE company_id IS NULL;

-- 3. NOVA FUNÇÃO DE RESET SEGURO (PROFISSIONAL)
-- Substitui a obsoleta 'empty_asset_inventory'
CREATE OR REPLACE FUNCTION public.inventory_reset_secure(
    confirm_text TEXT, 
    target_company_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
    user_name TEXT;
    result_msg TEXT;
BEGIN
    -- Validação de Role (Apenas Master Admin)
    IF NOT public.check_is_master_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado. Apenas Administradores Master podem resetar o inventário.';
    END IF;

    -- Validação de Segurança (Evitar cliques acidentais)
    IF confirm_text != 'CONFIRMO RESET TOTAL' THEN
        RAISE EXCEPTION 'Código de confirmação incorreto. Digite "CONFIRMO RESET TOTAL".';
    END IF;

    -- Obter nome do usuário para auditoria
    SELECT full_name INTO user_name FROM public.profiles WHERE id = auth.uid();

    -- Executar Resete (Escopado ou Global)
    IF target_company_id IS NOT NULL THEN
        DELETE FROM public.assets WHERE company_id = target_company_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        result_msg := 'Reset da Unidade concluído por ' || user_name || '. ' || deleted_count || ' itens removidos.';
    ELSE
        DELETE FROM public.assets WHERE id IS NOT NULL;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        result_msg := 'Reset GLOBAL concluído por ' || user_name || '. ' || deleted_count || ' itens removidos.';
    END IF;

    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'message', result_msg,
        'count', deleted_count,
        'timestamp', now()
    );
END;
$$;

-- 4. REMOVER FUNÇÃO LEGADA (Insegura)
DROP FUNCTION IF EXISTS public.empty_asset_inventory();

-- Notificar Schema Reload
NOTIFY pgrst, 'reload schema';
