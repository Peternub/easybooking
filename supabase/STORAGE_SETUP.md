# Настройка Supabase Storage для фото мастеров

## Вариант 1: Через SQL Editor (рекомендуется)

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Скопируйте и выполните содержимое файла `create-storage-bucket.sql`

## Вариант 2: Через UI

1. Откройте Supabase Dashboard
2. Перейдите в раздел **Storage**
3. Нажмите **New bucket**
4. Заполните:
   - Name: `master-photos`
   - Public bucket: ✅ (включено)
5. Нажмите **Create bucket**

### Настройка политик доступа (если создавали через UI)

После создания bucket нужно настроить политики:

1. Откройте созданный bucket `master-photos`
2. Перейдите на вкладку **Policies**
3. Добавьте следующие политики:

#### Policy 1: Public Access (SELECT)
- Policy name: `Public Access`
- Allowed operation: `SELECT`
- Target roles: `public`
- USING expression: `true`

#### Policy 2: Authenticated Upload (INSERT)
- Policy name: `Authenticated users can upload`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression: `true`

#### Policy 3: Authenticated Delete (DELETE)
- Policy name: `Authenticated users can delete`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression: `true`

#### Policy 4: Authenticated Update (UPDATE)
- Policy name: `Authenticated users can update`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- USING expression: `true`

## Проверка

После настройки:
1. Откройте админ панель в боте
2. Перейдите в раздел "Мастера"
3. Создайте или отредактируйте мастера
4. Попробуйте загрузить фото
5. Фото должно успешно загрузиться и отобразиться

## Примечания

- Максимальный размер файла: 5MB
- Поддерживаемые форматы: JPG, PNG, GIF
- Фото хранятся в папке `masters/` внутри bucket
- Публичный доступ позволяет отображать фото без авторизации
