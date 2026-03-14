import {
  AdminDeniedState,
  AdminLoadingState,
  adminPageStyle,
} from '../components/admin/AdminTheme';
import { BookingsList } from '../components/admin/BookingsList';
import { useAdminAccess } from '../components/admin/useAdminAccess';

export function AdminBookings() {
  const { isAdmin, loading } = useAdminAccess();

  if (loading) {
    return <AdminLoadingState />;
  }

  if (!isAdmin) {
    return <AdminDeniedState />;
  }

  return (
    <div style={adminPageStyle}>
      <BookingsList />
    </div>
  );
}
