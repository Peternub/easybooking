import {
  AdminDeniedState,
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
      <ReviewsView />
    </div>
  );
}
