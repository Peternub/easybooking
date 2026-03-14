import {
  AdminActionLink,
  AdminDeniedState,
  AdminLoadingState,
  adminPageStyle,
} from '../components/admin/AdminTheme';
import { useAdminAccess } from '../components/admin/useAdminAccess';

export function AdminPanel() {
  const { isAdmin, loading } = useAdminAccess();

  if (loading) {
    return <AdminLoadingState />;
  }

  if (!isAdmin) {
    return <AdminDeniedState />;
  }

  return (
    <div style={adminPageStyle}>
      <AdminActionLink
        to="/admin-bookings"
        label="Записи"
        description="Ближайшие записи, ручное добавление и контроль загрузки."
      />
      <AdminActionLink
        to="/admin-masters"
        label="Мастера"
        description="Список мастеров, статусы работы и редактирование профилей."
      />
      <AdminActionLink
        to="/admin-services"
        label="Услуги"
        description="Цены, категории, активность и управление каталогом."
      />
      <AdminActionLink
        to="/admin-dashboard"
        label="Дашборд"
        description="Календарь, клиенты, отзывы и общая рабочая картина."
      />
      <AdminActionLink
        to="/admin-reviews"
        label="Отзывы"
        description="Оценки клиентов по мастерам и история комментариев."
      />
    </div>
  );
}
