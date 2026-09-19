// /src/context/ThemeContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { defaultContainer } from '../infrastructure/di/Container';
import { ThemeMode } from '../domain/ports/IThemeStorage';

export type { ThemeMode };

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeAdapter = defaultContainer.themeStorage;
  const [theme, setThemeState] = useState<ThemeMode>(() => themeAdapter.getTheme());

  const setTheme = (newTheme: ThemeMode) => {
    themeAdapter.setTheme(newTheme);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    themeAdapter.setTheme(theme);
  }, [theme, themeAdapter]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
