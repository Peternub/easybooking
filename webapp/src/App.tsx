import { AppRoot } from '@telegram-apps/telegram-ui';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminBookings } from './pages/AdminBookings';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminMasters } from './pages/AdminMasters';
import { AdminPanel } from './pages/AdminPanel';
import { AdminReviews } from './pages/AdminReviews';
import { AdminServices } from './pages/AdminServices';
import { BookingFlow } from './pages/BookingFlow';
import { ReviewPage } from './pages/ReviewPage';

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BookingFlow />} />
          <Route path="/review/:bookingId" element={<ReviewPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-masters" element={<AdminMasters />} />
          <Route path="/admin-services" element={<AdminServices />} />
          <Route path="/admin-bookings" element={<AdminBookings />} />
          <Route path="/admin-reviews" element={<AdminReviews />} />
        </Routes>
      </BrowserRouter>
    </AppRoot>
  );
}
