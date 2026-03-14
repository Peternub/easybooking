import { AdminActionLink, AdminCard, AdminChip, AdminSectionTitle } from './AdminTheme';

export function SettingsView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <AdminCard style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <AdminSectionTitle
          title="Быстрые действия"
          subtitle="Из дашборда можно сразу перейти в ключевые операционные разделы."
        />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <AdminChip label="Мастера" tone="blue" />
          <AdminChip label="Услуги" tone="green" />
          <AdminChip label="Записи" tone="orange" />
          <AdminChip label="Отзывы" tone="neutral" />
        </div>
      </AdminCard>

      <AdminActionLink
        to="/admin-masters"
        label="Открыть мастеров"
        description="Редактирование профилей, активности и состава команды."
      />
      <AdminActionLink
        to="/admin-services"
        label="Открыть услуги"
        description="Каталог, цены, категории и отключение ненужных позиций."
      />
      <AdminActionLink
        to="/admin-bookings"
        label="Открыть записи"
        description="Ближайшие визиты, ручное создание и контроль потока клиентов."
      />
      <AdminActionLink
        to="/admin-reviews"
        label="Открыть отзывы"
        description="Рейтинг мастеров, комментарии клиентов и качество сервиса."
      />
    </div>
  );
}
