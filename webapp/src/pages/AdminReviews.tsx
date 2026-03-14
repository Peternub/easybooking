import {
  AdminDeniedState,
  AdminHero,
  AdminLoadingState,
  adminPageStyle,
} from '../components/admin/AdminTheme';
import { ReviewsView } from '../components/admin/ReviewsView';
import { useAdminAccess } from '../components/admin/useAdminAccess';

export function AdminReviews() {
  const { isAdmin, loading } = useAdminAccess();

  if (loading) {
    return <AdminLoadingState />;
  }

  if (!isAdmin) {
    return <AdminDeniedState />;
  }

  return (
    <div style={adminPageStyle}>
      <AdminHero
        eyebrow="Отзывы"
        title="Оценки клиентов"
        description="Смотрите рейтинг по мастерам и быстро находите сильные и проблемные точки сервиса."
      />
      <ReviewsView />
    </div>
  );
}
