// /src/application/hooks/useTheme.ts

import { useTheme as useThemeFromContext, ThemeMode, ThemePreference } from '../../context/ThemeContext';

export interface UseThemeReturn {
  /** Resolved mode actually applied ('dark' | 'light'). */
  theme: ThemeMode;
  /** Raw user preference, including 'system'. */
  preference: ThemePreference;
  /** Resolved mode (explicit alias of `theme`). */
  resolvedTheme: ThemeMode;
  /** True when the resolved theme is dark. */
  isDark: boolean;
  /** True when following the OS color scheme. */
  isSystem: boolean;
  /** Last observed OS color scheme. */
  systemTheme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
}

export function useTheme(): UseThemeReturn {
  return useThemeFromContext();
}

export type { ThemeMode, ThemePreference };
