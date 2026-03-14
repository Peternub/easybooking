import {
  AdminDeniedState,
  AdminHero,
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
      <AdminHero
        eyebrow="Каталог"
        title="Управление услугами"
        description="Меняйте цены, описание, категории и доступность услуг без перегруженного интерфейса."
      />
      <ServicesList />
    </div>
  );
}
