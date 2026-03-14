import {
  AdminDeniedState,
  AdminHero,
  AdminLoadingState,
  adminPageStyle,
} from '../components/admin/AdminTheme';
import { MastersList } from '../components/admin/MastersList';
import { useAdminAccess } from '../components/admin/useAdminAccess';

export function AdminMasters() {
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
        eyebrow="Команда"
        title="Управление мастерами"
        description="Следите за активностью специалистов, редактируйте профили и контролируйте состав команды."
      />
      <MastersList />
    </div>
  );
}
