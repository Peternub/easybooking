import { adminPageStyle } from '../components/admin/AdminTheme';
import { ServicesList } from '../components/admin/ServicesList';

export function AdminServices() {
  return (
    <div style={adminPageStyle}>
      <ServicesList />
    </div>
  );
}
