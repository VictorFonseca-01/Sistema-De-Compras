-- 20260408_fix_attachments_complete.sql
-- CORREÇÃO DEFINITIVA: Bucket Not Found + Permissões TI/Compras/Solicitante
-- Este script garante a existência do bucket e corrige as políticas RLS que estavam bloqueando o fluxo.

-- 1. GARANTE A EXISTÊNCIA DO BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-attachments', 'request-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. CORREÇÃO DE RLS: TABELA public.request_attachments
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inserir anexos da solicitação" ON public.request_attachments;
CREATE POLICY "Inserir anexos da solicitação" ON public.request_attachments 
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND (
      p.role IN ('ti', 'compras', 'master_admin') -- Perfis administrativos podem anexar em qualquer um
      OR EXISTS ( -- O próprio dono pode anexar
        SELECT 1 FROM public.requests r 
        WHERE r.id = request_id 
        AND r.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "Deletar anexos da solicitação" ON public.request_attachments;
CREATE POLICY "Deletar anexos da solicitação" ON public.request_attachments
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND (
      p.role IN ('ti', 'compras', 'master_admin') -- Admins podem limpar
      OR EXISTS ( -- Dono pode limpar
        SELECT 1 FROM public.requests r 
        WHERE r.id = request_id 
        AND r.user_id = auth.uid()
      )
    )
  )
);

-- 3. CORREÇÃO DE RLS: STORAGE.OBJECTS (BUCKET 'request-attachments')
-- Nota: Usamos (storage.foldername(name))[1] para pegar o ID da pasta (ID do Pedido)

DROP POLICY IF EXISTS "Attachments_Insert_Policy" ON storage.objects;
CREATE POLICY "Attachments_Insert_Policy" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'request-attachments' 
  AND (
    -- Caso 1: Usuário tem papel administrativo
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('ti', 'compras', 'master_admin')
    )
    -- Caso 2: Usuário é o dono da pasta (pedido)
    OR EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id::text = (storage.foldername(name))[1]
      AND r.user_id = auth.uid()
    )
    -- Caso 3: Usuário tem acesso via escopo (Gestor de Unidade)
    OR public.check_user_request_access((storage.foldername(name))[1]::UUID)
  )
);

DROP POLICY IF EXISTS "Attachments_Delete_Policy" ON storage.objects;
CREATE POLICY "Attachments_Delete_Policy" ON storage.objects 
FOR DELETE TO authenticated 
USING (
  bucket_id = 'request-attachments' 
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('master_admin', 'ti', 'compras')
    )
    OR EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id::text = (storage.foldername(name))[1]
      AND r.user_id = auth.uid()
    )
  )
);

-- Notificar recarregamento do schema
NOTIFY pgrst, 'reload schema';
