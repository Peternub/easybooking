import { adminPageStyle } from '../components/admin/AdminTheme';
import { BookingsList } from '../components/admin/BookingsList';

export function AdminBookings() {
  return (
    <div style={adminPageStyle}>
      <BookingsList />
    </div>
  );
}
