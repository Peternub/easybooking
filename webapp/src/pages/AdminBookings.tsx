import { useState } from 'react';
import {
  AdminDeniedState,
  AdminLoadingState,
  adminPageStyle,
} from '../components/admin/AdminTheme';
import { BookingForm } from '../components/admin/BookingForm';
import { BookingsList } from '../components/admin/BookingsList';
import { useAdminAccess } from '../components/admin/useAdminAccess';

export function AdminBookings() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAdmin, loading } = useAdminAccess();

  if (loading) {
    return <AdminLoadingState />;
  }

  if (!isAdmin) {
    return <AdminDeniedState />;
  }

  return (
    <div style={adminPageStyle}>
      {showForm ? (
        <BookingForm
          onClose={() => {
            setShowForm(false);
            setRefreshKey((previousValue) => previousValue + 1);
          }}
        />
      ) : (
        <BookingsList key={refreshKey} onAddBooking={() => setShowForm(true)} />
      )}
    </div>
  );
}
