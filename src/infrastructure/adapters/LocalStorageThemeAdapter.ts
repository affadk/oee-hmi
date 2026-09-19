// /src/infrastructure/adapters/LocalStorageThemeAdapter.ts

import { IThemeStoragePort, ThemeMode } from '../../domain/ports/IThemeStorage';

const THEME_STORAGE_KEY = 'oee_dashboard_theme';

export class LocalStorageThemeAdapter implements IThemeStoragePort {
  public getTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'dark';
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // Fallback if localStorage access fails
    }
    return 'dark';
  }

  public setTheme(theme: ThemeMode): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore write errors
    }

    // Apply CSS class to root HTML element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }
}
