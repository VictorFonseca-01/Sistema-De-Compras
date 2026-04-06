-- 202604061000_storage_policies_v1.sql
-- SEGURANÇA: Implementação de RLS para o bucket de anexos ('request-attachments')

-- 1. Garantir que o bucket existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-attachments', 'request-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Habilitar RLS em storage.objects (se ainda não estiver)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Limpar políticas antigas (se houver)
DROP POLICY IF EXISTS "Attachments_Select_Policy" ON storage.objects;
DROP POLICY IF EXISTS "Attachments_Insert_Policy" ON storage.objects;
DROP POLICY IF EXISTS "Attachments_Delete_Policy" ON storage.objects;

-- 4. POLÍTICA DE SELECT (Visualização)
-- Permite visualizar se o usuário tem acesso à solicitação vinculada (Dono, Gestor com Escopo ou Admin)
CREATE POLICY "Attachments_Select_Policy" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'request-attachments' AND
  public.check_user_request_access((storage.foldername(name))[1]::UUID)
);

-- 5. POLÍTICA DE INSERT (Upload)
-- Permite upload apenas se o usuário for o dono da solicitação (identificado pelo ID na pasta)
CREATE POLICY "Attachments_Insert_Policy" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'request-attachments' AND
  EXISTS (
    SELECT 1 FROM public.requests 
    WHERE id = (storage.foldername(name))[1]::UUID 
    AND user_id = auth.uid()
  )
);

-- 6. POLÍTICA DE DELETE (Remoção)
-- Permite deleção apenas para o dono da solicitação ou Master Admin
CREATE POLICY "Attachments_Delete_Policy" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'request-attachments' AND
  (
    EXISTS (
      SELECT 1 FROM public.requests 
      WHERE id = (storage.foldername(name))[1]::UUID 
      AND user_id = auth.uid()
    )
    OR public.check_is_master_admin(auth.uid())
  )
);

-- Notificar recarregamento
NOTIFY pgrst, 'reload schema';
