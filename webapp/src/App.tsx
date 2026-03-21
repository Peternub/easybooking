import { AppRoot } from '@telegram-apps/telegram-ui';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
  AdminDeniedState,
  AdminLoadingState,
} from './components/admin/AdminTheme';
import { AdminAccessProvider, useAdminAccess } from './components/admin/useAdminAccess';
import { AdminBookings } from './pages/AdminBookings';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminMasters } from './pages/AdminMasters';
import { AdminPanel } from './pages/AdminPanel';
import { AdminReviews } from './pages/AdminReviews';
import { AdminServices } from './pages/AdminServices';
import { BookingFlow } from './pages/BookingFlow';
import { ReviewPage } from './pages/ReviewPage';

function ProtectedAdminRoute({ children }: { children: JSX.Element }) {
  const { isAdmin, loading } = useAdminAccess();

  if (loading) {
    return <AdminLoadingState />;
  }

  if (!isAdmin) {
    return <AdminDeniedState />;
  }

  return children;
}

export function App() {
  const theme = 'light';

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  return (
    <AppRoot appearance={theme}>
      <AdminAccessProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<BookingFlow />} />
            <Route path="/review/:bookingId" element={<ReviewPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminPanel />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin-masters"
              element={
                <ProtectedAdminRoute>
                  <AdminMasters />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin-services"
              element={
                <ProtectedAdminRoute>
                  <AdminServices />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin-bookings"
              element={
                <ProtectedAdminRoute>
                  <AdminBookings />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin-reviews"
              element={
                <ProtectedAdminRoute>
                  <AdminReviews />
                </ProtectedAdminRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AdminAccessProvider>
    </AppRoot>
  );
}
