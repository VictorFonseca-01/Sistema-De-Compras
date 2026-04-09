-- ======================================================================
-- REFINAMENTO: VALOR FINAL E AUDITORIA DE ANEXOS
-- ======================================================================

-- 1. Adicionar o campo final_purchase_amount (Valor real da NF)
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS final_purchase_amount DECIMAL(12, 2);

-- 2. Garantir permissões de deleção de anexos para Compras/Admin
-- (Nota: A tabela request_attachments já possui RLS, vamos garantir uma política de exclusão)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'request_attachments' AND policyname = 'Allow delete for procurement/admin'
    ) THEN
        CREATE POLICY "Allow delete for procurement/admin" ON public.request_attachments
        FOR DELETE TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND (role = 'compras' OR role = 'master_admin')
            )
        );
    END IF;
END $$;

-- 3. Recarregar esquema
NOTIFY pgrst, 'reload schema';
