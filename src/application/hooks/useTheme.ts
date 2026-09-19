// /src/application/hooks/useTheme.ts

import { useTheme as useThemeFromContext, ThemeMode } from '../../context/ThemeContext';

export interface UseThemeReturn {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export function useTheme(): UseThemeReturn {
  return useThemeFromContext();
}

export type { ThemeMode };
