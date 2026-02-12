import { useState, useEffect } from 'react';

export function useTelegramTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const colorScheme = window.Telegram.WebApp.colorScheme;
      setTheme(colorScheme === 'dark' ? 'dark' : 'light');

      // Слушаем изменения темы
      const handleThemeChange = () => {
        const newColorScheme = window.Telegram.WebApp.colorScheme;
        setTheme(newColorScheme === 'dark' ? 'dark' : 'light');
      };

      window.Telegram.WebApp.onEvent('themeChanged', handleThemeChange);

      return () => {
        window.Telegram.WebApp.offEvent('themeChanged', handleThemeChange);
      };
    }
  }, []);

  return theme;
}
