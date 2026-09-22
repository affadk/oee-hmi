// /src/context/ThemeContext.tsx

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultContainer } from '../infrastructure/di/Container';
import type { LocalStorageThemeAdapter } from '../infrastructure/adapters/LocalStorageThemeAdapter';
import type { ThemeMode, ThemePreference } from '../domain/ports/IThemeStorage';

export type { ThemeMode, ThemePreference };

interface ThemeContextType {
  /** Resolved mode actually applied to the DOM ('dark' | 'light'). Kept for backward compat. */
  theme: ThemeMode;
  /** Raw user preference, including 'system'. */
  preference: ThemePreference;
  /** Resolved mode (same as `theme`, explicit alias). */
  resolvedTheme: ThemeMode;
  /** Convenience flag — true when the resolved theme is dark. */
  isDark: boolean;
  /** True when the user follows the OS color scheme. */
  isSystem: boolean;
  /** Last observed OS color scheme. */
  systemTheme: ThemeMode;
  /** Persist a preference ('dark' | 'light' | 'system'). */
  setTheme: (preference: ThemePreference) => void;
  /** Toggle between resolved dark/light (drops 'system' to an explicit mode). */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  preference: 'system',
  resolvedTheme: 'dark',
  isDark: true,
  isSystem: true,
  systemTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

function readSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeAdapter = defaultContainer.themeStorage as LocalStorageThemeAdapter;

  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    try {
      return themeAdapter.getPreference();
    } catch {
      return 'system';
    }
  });
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(() => {
    try {
      return themeAdapter.getSystemTheme();
    } catch {
      return readSystemTheme();
    }
  });

  const resolvedTheme: ThemeMode = useMemo(() => {
    try {
      return themeAdapter.resolveTheme(preference, systemTheme);
    } catch {
      return preference === 'light' ? 'light' : preference === 'dark' ? 'dark' : systemTheme;
    }
  }, [preference, systemTheme, themeAdapter]);

  // Apply to <html> whenever the resolved mode changes.
  useEffect(() => {
    try {
      if (typeof themeAdapter.applyResolvedTheme === 'function') {
        themeAdapter.applyResolvedTheme(resolvedTheme);
      } else {
        themeAdapter.setTheme(resolvedTheme);
      }
    } catch {
      // Never break rendering on theme errors.
    }
  }, [resolvedTheme, themeAdapter]);

  // Follow OS changes while the preference is 'system'.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = themeAdapter.subscribeToSystemChanges((next) => setSystemTheme(next));
    } catch {
      // matchMedia unavailable — keep the initial snapshot.
    }
    return () => {
      try {
        unsubscribe?.();
      } catch {
        // Ignore cleanup errors.
      }
    };
  }, [themeAdapter]);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      const safe: ThemePreference = next === 'dark' || next === 'light' || next === 'system' ? next : 'system';
      setPreferenceState(safe);
      try {
        themeAdapter.setTheme(safe);
      } catch {
        // State already updated; storage failure is non-fatal.
      }
    },
    [themeAdapter],
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: resolvedTheme,
      preference,
      resolvedTheme,
      isDark: resolvedTheme === 'dark',
      isSystem: preference === 'system',
      systemTheme,
      setTheme,
      toggleTheme,
    }),
    [resolvedTheme, preference, systemTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
