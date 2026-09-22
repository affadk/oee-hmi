// /src/domain/ports/IThemeStorage.ts

/** Resolved theme actually applied to the DOM. */
export type ThemeMode = 'dark' | 'light';

/** User preference — 'system' follows the OS color scheme. */
export type ThemePreference = ThemeMode | 'system';

export interface IThemeStoragePort {
  /**
   * Reads the persisted theme preference ('dark' | 'light' | 'system').
   * Falls back to 'system' when nothing is stored.
   */
  getPreference(): ThemePreference;

  /**
   * Reads the resolved theme ('dark' | 'light') after applying
   * the 'system' preference against the OS color scheme.
   * Kept under the legacy name so existing callers keep working.
   */
  getTheme(): ThemeMode;

  /** Returns the current OS color scheme without touching storage. */
  getSystemTheme(): ThemeMode;

  /**
   * Persists the preference and updates document styling
   * (`.dark` class, `data-theme` attribute, `color-scheme`).
   */
  setTheme(preference: ThemePreference): void;

  /**
   * Resolves a preference to a concrete mode given the OS theme.
   * Pure helper — no storage or DOM side effects.
   */
  resolveTheme(preference: ThemePreference, systemTheme: ThemeMode): ThemeMode;

  /**
   * Subscribes to OS color-scheme changes.
   * Returns an unsubscribe function.
   */
  subscribeToSystemChanges(listener: (systemTheme: ThemeMode) => void): () => void;
}
