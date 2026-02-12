import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { useTelegramTheme } from './hooks/useTelegramTheme';
import { BookingFlow } from './pages/BookingFlow';
import { ReviewPage } from './pages/ReviewPage';
import { AdminPanel } from './pages/AdminPanel';

export function App() {
  const theme = useTelegramTheme();

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
