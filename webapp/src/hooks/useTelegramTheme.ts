import { useEffect, useState } from 'react';

export function useTelegramTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      const colorScheme = webApp.colorScheme;
      setTheme(colorScheme === 'dark' ? 'dark' : 'light');

      // Слушаем изменения темы
      const handleThemeChange = () => {
        const newColorScheme = webApp.colorScheme;
        setTheme(newColorScheme === 'dark' ? 'dark' : 'light');
      };

      webApp.onEvent('themeChanged', handleThemeChange);

      return () => {
        webApp.offEvent('themeChanged', handleThemeChange);
      };
    }
  }, []);

  return theme;
}
