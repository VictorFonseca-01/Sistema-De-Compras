-- ====================================================================
-- GLOBAL PARTS — Calibração Final Nível 4 (Enterprise Integrity)
-- Migration: 20260412_final_calibration.sql
-- ====================================================================

-- 1. REPARO E INTEGRIDADE: NOTIFICATIONS (Multi-Tenant)
DO $$
BEGIN
    -- Adicionar colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.notifications ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE public.notifications ADD COLUMN type TEXT DEFAULT 'INFO';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'related_request_id') THEN
        ALTER TABLE public.notifications ADD COLUMN related_request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Backfill: Preencher tenant_id com base no perfil do usuário destinatário
UPDATE public.notifications n
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE n.user_id = p.id AND n.tenant_id IS NULL;

-- Criar Índice de Performance
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user ON public.notifications (tenant_id, user_id);

-- Ajustar RLS para Notificações (Padrão Enterprise)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own tenant notifications" ON public.notifications;
CREATE POLICY "Users view own tenant notifications" ON public.notifications
    FOR SELECT TO authenticated
    USING (
        tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND user_id = auth.uid()
    );

-- 2. REPARO DE AUDITORIA (Erro 400 - Integridade de FK)
DELETE FROM public.audit_logs 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Adicionar FK para garantir que o Erro 400 de Join não ocorra
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_audit_logs_user_profile') THEN
        ALTER TABLE public.audit_logs 
        ADD CONSTRAINT fk_audit_logs_user_profile 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    END IF;
END $$;

-- 3. ALINHAMENTO DE STATUS BI (Dashboard KPIs)
DROP VIEW IF EXISTS public.vw_bi_summary CASCADE;
CREATE OR REPLACE VIEW public.vw_bi_summary AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  count(r.id) as total_requests,
  sum(CASE WHEN r.status::text IN ('COMPLETED', 'CONCLUIDO', 'Aprovado') THEN 1 ELSE 0 END) as completed_requests,
  sum(CASE WHEN r.status::text IN ('REJECTED', 'CANCELADO', 'Recusado') THEN 1 ELSE 0 END) as rejected_requests,
  sum(CASE WHEN r.status::text NOT IN ('COMPLETED', 'CONCLUIDO', 'Aprovado', 'REJECTED', 'CANCELADO', 'Recusado') THEN 1 ELSE 0 END) as pending_requests,
  COALESCE(sum(r.estimated_cost), 0) as total_estimated_value,
  COALESCE(sum(CASE WHEN r.status::text IN ('COMPLETED', 'CONCLUIDO', 'Aprovado') THEN r.estimated_cost ELSE 0 END), 0) as total_executed_value,
  avg(extract(epoch from (now() - r.created_at)) / 3600) FILTER (WHERE r.status::text IN ('COMPLETED', 'CONCLUIDO', 'Aprovado')) as avg_completion_time_hours
FROM public.tenants t
LEFT JOIN public.requests r ON r.tenant_id = t.id
GROUP BY t.id, t.name;

GRANT SELECT ON public.vw_bi_summary TO authenticated;

-- Forçar recarregamento do PostgREST
NOTIFY pgrst, 'reload schema';
