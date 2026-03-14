import {
  AdminDeniedState,
  AdminLoadingState,
  adminPageStyle,
} from '../components/admin/AdminTheme';
import { ServicesList } from '../components/admin/ServicesList';
import { useAdminAccess } from '../components/admin/useAdminAccess';

export function AdminServices() {
  const { isAdmin, loading } = useAdminAccess();

  if (loading) {
    return <AdminLoadingState />;
  }

  if (!isAdmin) {
    return <AdminDeniedState />;
  }

  return (
    <div style={adminPageStyle}>
      <ServicesList />
    </div>
  );
}
