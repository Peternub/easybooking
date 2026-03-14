import { AdminActionLink } from './AdminTheme';

export function SettingsView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
