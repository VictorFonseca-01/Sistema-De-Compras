-- ======================================================================
-- MUDANÇA DE ESCOPO: PERMISSÕES DE EDIÇÃO E VISIBILIDADE CRUZADA
-- ======================================================================

-- 1. ADICIONAR COLUNA DE PERMISSÃO DE EDIÇÃO
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='manager_scopes' AND column_name='can_edit') THEN
        ALTER TABLE public.manager_scopes ADD COLUMN can_edit BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. REFORMULAR RLS DE REQUESTS (SELECT)
-- Consolidar uma única política clara de visualização
DROP POLICY IF EXISTS "Access requests based on ownership and scope" ON public.requests;
DROP POLICY IF EXISTS "Visualização: Prórpio" ON public.requests;
DROP POLICY IF EXISTS "Visualização: Admin e TI" ON public.requests;
DROP POLICY IF EXISTS "Visualização: Gestor do Departamento" ON public.requests;
DROP POLICY IF EXISTS "Visualização: Compras" ON public.requests;
DROP POLICY IF EXISTS "Visualização: Diretoria Estratégica" ON public.requests;

CREATE POLICY "Requests SELECT Policy" ON public.requests
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
            (ms.scope_type = 'company' AND ms.company_id = requests.company_id) OR
            (ms.scope_type = 'department' AND ms.company_id = requests.company_id AND ms.department_id = requests.department_id) OR
            (ms.scope_type = 'custom' AND ms.company_id = requests.company_id AND ms.department_id = requests.department_id)
        )
    )
);

-- 3. REFORMULAR RLS DE REQUESTS (UPDATE)
DROP POLICY IF EXISTS "Relevant roles can update" ON public.requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.requests; -- INSERT is handled by specific policy
DROP POLICY IF EXISTS "Allow authenticated insert requests" ON public.requests;

CREATE POLICY "Requests UPDATE Policy" ON public.requests
FOR UPDATE
TO authenticated
USING (
    -- 1. Dono do pedido (apenas se estiver em rascunho ou aguardando ajuste)
    (user_id = auth.uid() AND status IN ('CREATED', 'ADJUSTMENT_NEEDED')) OR
    
    -- 2. Cargos Administrativos Totais
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master_admin', 'ti', 'compras', 'diretoria') OR
    
    -- 3. Usuários com Escopo de Edição Habilitado
    EXISTS (
        SELECT 1 FROM public.manager_scopes ms
        WHERE ms.user_id = auth.uid()
        AND ms.active = true
        AND ms.can_edit = true
        AND (
            (ms.scope_type = 'company' AND ms.company_id = requests.company_id) OR
            (ms.scope_type = 'department' AND ms.company_id = requests.company_id AND ms.department_id = requests.department_id) OR
            (ms.scope_type = 'custom' AND ms.company_id = requests.company_id AND ms.department_id = requests.department_id)
        )
    )
);

-- 4. POLÍTICA DE INSERÇÃO (Simples)
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'requests' AND policyname = 'Requests INSERT Policy') THEN
    CREATE POLICY "Requests INSERT Policy" ON public.requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
END IF;

-- Recarregar esquema
NOTIFY pgrst, 'reload schema';
