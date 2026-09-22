// /src/infrastructure/adapters/LocalStorageThemeAdapter.ts

import {
  IThemeStoragePort,
  ThemeMode,
  ThemePreference,
} from '../../domain/ports/IThemeStorage';

const THEME_STORAGE_KEY = 'oee_dashboard_theme';
const LEGACY_DARK = 'dark';
const LEGACY_LIGHT = 'light';

function isPreference(value: unknown): value is ThemePreference {
  return value === 'dark' || value === 'light' || value === 'system';
}

export class LocalStorageThemeAdapter implements IThemeStoragePort {
  public getPreference(): ThemePreference {
    if (typeof window === 'undefined') return 'system';
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (isPreference(saved)) return saved;
      // Migrate legacy values that were stored as plain modes.
      if (saved === LEGACY_DARK || saved === LEGACY_LIGHT) return saved;
    } catch {
      // localStorage unavailable (SSR / private mode) — fall through.
    }
    return 'system';
  }

  public getSystemTheme(): ThemeMode {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  public resolveTheme(preference: ThemePreference, systemTheme: ThemeMode): ThemeMode {
    if (preference === 'system') return systemTheme;
    return preference;
  }

  public getTheme(): ThemeMode {
    return this.resolveTheme(this.getPreference(), this.getSystemTheme());
  }

  public setTheme(preference: ThemePreference): void {
    if (typeof window === 'undefined') return;
    const safe: ThemePreference = isPreference(preference) ? preference : 'system';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, safe);
    } catch {
      // Ignore write errors (private mode / quota).
    }
    this.applyTheme(this.resolveTheme(safe, this.getSystemTheme()));
  }

  /** Applies the resolved mode to <html> without touching storage. */
  public applyResolvedTheme(resolved: ThemeMode): void {
    if (typeof document === 'undefined') return;
    this.applyTheme(resolved);
  }

  public subscribeToSystemChanges(listener: (systemTheme: ThemeMode) => void): () => void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return () => {};
    }
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e: MediaQueryListEvent) => listener(e.matches ? 'light' : 'dark');
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    // Safari < 14 fallback.
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }

  private applyTheme(resolved: ThemeMode): void {
    const root = document.documentElement;
    const isDark = resolved === 'dark';
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
  }
}
