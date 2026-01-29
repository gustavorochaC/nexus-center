-- =================================================================
-- Migration 015: Bucket de avatares no Storage + RLS
-- Fotos de perfil: path {user_id}/avatar (ou avatar.{ext})
-- Leitura pública; upload/update/delete apenas no próprio path.
-- =================================================================

-- 1. Criar bucket público (getPublicUrl funciona sem auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. SELECT: leitura pública para exibir avatar no Header/Configurações
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 3. INSERT: usuário autenticado só pode enviar no próprio path (user_id/...)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. UPDATE: usuário só pode atualizar o próprio arquivo (upsert)
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (bucket_id = 'avatars');

-- 5. DELETE: usuário só pode remover o próprio arquivo
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
