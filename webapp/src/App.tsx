import { AppRoot } from '@telegram-apps/telegram-ui';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminPanel } from './pages/AdminPanel';
import { BookingFlow } from './pages/BookingFlow';
import { ReviewPage } from './pages/ReviewPage';

export function App() {
  // Принудительно используем темную тему
  const theme = 'dark';

  useEffect(() => {
    // Инициализация Telegram WebApp
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
        </Routes>
      </BrowserRouter>
    </AppRoot>
  );
}
