-- Limpar políticas antigas de visualização (SELECT)
DROP POLICY IF EXISTS "Users can view own requests" ON requests;
DROP POLICY IF EXISTS "Admins can view all" ON requests;
DROP POLICY IF EXISTS "Gestores view relevant" ON requests;
DROP POLICY IF EXISTS "TI view relevant" ON requests;
DROP POLICY IF EXISTS "Compras view relevant" ON requests;
DROP POLICY IF EXISTS "Diretoria view relevant" ON requests;

-- 1. Qualquer um vê a própria solicitação
CREATE POLICY "Visualização: Prórpio" ON requests FOR SELECT USING (
  auth.uid() = user_id
);

-- 2. Master Admin e TI veem TUDO
CREATE POLICY "Visualização: Admin e TI" ON requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('master_admin', 'ti')
  )
);

-- 3. Gestores veem tudo do seu DEPARTAMENTO
CREATE POLICY "Visualização: Gestor do Departamento" ON requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p_me
    JOIN profiles p_req ON p_req.id = requests.user_id
    WHERE p_me.id = auth.uid() 
    AND p_me.role = 'gestor'
    AND p_req.department = p_me.department
  )
);

-- 4. Diretoria vê pedidos maduros (pós-gestor) ou feitos por Gestores
CREATE POLICY "Visualização: Diretoria Estratégica" ON requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p_me
    WHERE p_me.id = auth.uid() 
    AND p_me.role = 'diretoria'
    AND (
      status != 'pending_gestor' -- Já passou pelo gestor
      OR EXISTS (SELECT 1 FROM profiles p_req WHERE p_req.id = requests.user_id AND p_req.role = 'gestor') -- Pedido do próprio gestor
    )
  )
);

-- 5. Compras vê o que está na sua etapa
CREATE POLICY "Visualização: Compras" ON requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'compras' AND current_step = 'compras'
  )
);
