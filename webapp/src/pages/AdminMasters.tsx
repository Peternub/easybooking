import { adminPageStyle } from '../components/admin/AdminTheme';
import { MastersList } from '../components/admin/MastersList';

export function AdminMasters() {
  return (
    <div style={adminPageStyle}>
      <MastersList />
    </div>
  );
}
