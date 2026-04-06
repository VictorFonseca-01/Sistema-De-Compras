-- 202604061001_storage_policies_v2_hotfix.sql
-- HOTFIX: Versão compatível com restrições de permissão do Supabase Cloud

-- 1. Criação do bucket (se necessário)
-- Nota: O Supabase pode restringir INSERT direto em storage.buckets via SQL Editor.
-- Se este bloco falhar, crie o bucket 'request-attachments' manualmente no Dashboard.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'request-attachments') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('request-attachments', 'request-attachments', false);
    END IF;
END $$;

-- 2. POLÍTICAS DE ACESSO (O foco principal)
-- Removido 'ALTER TABLE ENABLE RLS' pois geralmente já está ativo ou requer permissão de owner.
-- Se as políticas abaixo não funcionarem, ative o RLS via Dashboard: Storage > Policies.

DROP POLICY IF EXISTS "Attachments_Select_Policy" ON storage.objects;
DROP POLICY IF EXISTS "Attachments_Insert_Policy" ON storage.objects;
DROP POLICY IF EXISTS "Attachments_Delete_Policy" ON storage.objects;

-- ACESSO: SELECT
CREATE POLICY "Attachments_Select_Policy" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'request-attachments' AND
  public.check_user_request_access((storage.foldername(name))[1]::UUID)
);

-- ACESSO: INSERT
CREATE POLICY "Attachments_Insert_Policy" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'request-attachments' AND
  EXISTS (
    SELECT 1 FROM public.requests 
    WHERE id = (storage.foldername(name))[1]::UUID 
    AND user_id = auth.uid()
  )
);

-- ACESSO: DELETE
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
