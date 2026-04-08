-- ======================================================================
-- MUDANÇA DE ESCOPO: NOTIFICAÇÕES REGIONAIS E GLOBAIS
-- ======================================================================

-- 1. ADICIONAR COLUNAS DE ESCOPO
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='company_id') THEN
        ALTER TABLE public.notifications ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='department_id') THEN
        ALTER TABLE public.notifications ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
END $$;

-- 2. ATUALIZAR DADOS EXISTENTES (Opcional, mas ajuda)
UPDATE public.notifications n
SET 
  company_id = p.company_id,
  department_id = p.department_id
FROM public.profiles p
WHERE n.user_id = p.id AND n.company_id IS NULL;

-- 3. REFORMULAR POLÍTICAS DE RLS
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;

-- Política de Visualização: Baseada em Escopo e Cargo
CREATE POLICY "Notification Visibility based on Scope" ON public.notifications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master_admin', 'ti', 'compras', 'diretoria') OR
    EXISTS (
        SELECT 1 FROM public.manager_scopes ms
        WHERE ms.user_id = auth.uid()
        AND ms.active = true
        AND (
            (ms.scope_type = 'company' AND ms.company_id = notifications.company_id) OR
            (ms.scope_type = 'department' AND ms.company_id = notifications.company_id AND ms.department_id = notifications.department_id) OR
            (ms.scope_type = 'custom' AND ms.company_id = notifications.company_id AND ms.department_id = notifications.department_id)
        )
    )
);

-- Política de Atualização (Marcar como lido)
-- Somente o dono ou cargos administrativos (para limpeza se necessário)
CREATE POLICY "Notification Update Policy" ON public.notifications
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master_admin', 'ti', 'compras', 'diretoria')
);

-- Recarregar esquema
NOTIFY pgrst, 'reload schema';
