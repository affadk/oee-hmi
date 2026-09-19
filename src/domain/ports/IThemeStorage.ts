// /src/domain/ports/IThemeStorage.ts

export type ThemeMode = 'dark' | 'light';

export interface IThemeStoragePort {
  /**
   * Reads the persisted theme preference.
   */
  getTheme(): ThemeMode;

  /**
   * Persists the theme preference and updates document styling.
   */
  setTheme(theme: ThemeMode): void;
}
