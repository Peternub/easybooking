-- Создание bucket для фото мастеров

-- 1. Создаем bucket (если еще не создан)
INSERT INTO storage.buckets (id, name, public)
VALUES ('master-photos', 'master-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Политики доступа для bucket

-- Разрешаем всем читать фото (публичный доступ)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'master-photos');

-- Разрешаем загружать фото только аутентифицированным пользователям
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'master-photos' AND auth.role() = 'authenticated');

-- Разрешаем удалять фото только аутентифицированным пользователям
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'master-photos' AND auth.role() = 'authenticated');

-- Разрешаем обновлять фото только аутентифицированным пользователям
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'master-photos' AND auth.role() = 'authenticated');
