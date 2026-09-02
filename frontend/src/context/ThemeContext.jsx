import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const getInitialTheme = () => {
  // 1. Explicitly saved user manual selection
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch (e) {}

  // 2. Telegram WebApp environment
  const tg = window.Telegram?.WebApp;
  if (tg?.colorScheme === 'dark') return 'dark';
  if (tg?.colorScheme === 'light') return 'light';

  if (tg?.themeParams?.bg_color) {
    const hex = tg.themeParams.bg_color.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128 ? 'dark' : 'light';
    }
  }

  // 3. System preference fallback
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }

  return 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);
  const isDark = theme === 'dark';

  const applyThemeToDOM = useCallback((currentTheme) => {
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setTheme = useCallback((newTheme, isManual = true) => {
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
    if (isManual) {
      try {
        localStorage.setItem('theme', newTheme);
      } catch (e) {}
    }
  }, [applyThemeToDOM]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme, true);
  }, [theme, setTheme]);

  // Sync with Telegram theme changes and system preferences
  useEffect(() => {
    applyThemeToDOM(theme);

    const tg = window.Telegram?.WebApp;
    const handleTgThemeChange = () => {
      // Only auto-switch if user hasn't chosen manually
      const manual = localStorage.getItem('theme');
      if (!manual) {
        const detected = getInitialTheme();
        setTheme(detected, false);
      }
    };

    if (tg?.onEvent) {
      tg.onEvent('themeChanged', handleTgThemeChange);
    }

    let mediaQuery;
    const handleSystemChange = (e) => {
      const manual = localStorage.getItem('theme');
      if (!manual && !tg?.colorScheme) {
        setTheme(e.matches ? 'dark' : 'light', false);
      }
    };

    if (typeof window !== 'undefined' && window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleSystemChange);
    }

    return () => {
      if (tg?.offEvent) {
        tg.offEvent('themeChanged', handleTgThemeChange);
      }
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      }
    };
  }, [theme, applyThemeToDOM, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
