-- ======================================================================
-- FERRAMENTA DE GOVERNANÇA: RESET TOTAL DE SOLICITAÇÕES E WORKFLOW
-- ======================================================================

CREATE OR REPLACE FUNCTION public.empty_requests_workflow()
RETURNS void AS $$
BEGIN
    -- 1. Deletar todas as solicitações (Isso acionará ON DELETE CASCADE em todas as tabelas filhas)
    -- Tabelas afetadas pelo cascade: request_quotes, request_attachments, request_links, request_comments, request_status_history
    DELETE FROM public.requests;

    -- 2. Limpar notificações vinculadas a fluxo de trabalho
    -- Como decidimos zerar tudo relativo a solicitações, limpamos a tabela total de notificações para garantir silêncio absoluto
    DELETE FROM public.notifications;

    -- 3. Opcional: Logs de auditoria poderiam ser inseridos aqui se houvesse uma tabela específica para esse tipo de reset
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário para expor a função ao PostgREST
COMMENT ON FUNCTION public.empty_requests_workflow() IS 'Liquida todas as solicitações de compra e notificações do sistema permanentemente.';
