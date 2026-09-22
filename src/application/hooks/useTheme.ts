// /src/application/hooks/useTheme.ts
// DEPRECATED compatibility shim — theme state is owned by presentation.
// New code: import { useTheme } from '../../presentation/providers/ThemeProvider'.
// This shim keeps legacy src/components/* working until the old folder is removed.
// Do NOT add new imports of this file.

export { useTheme } from '../../presentation/providers/ThemeProvider';
export type { ThemeMode, ThemePreference } from '../../domain/ports/IThemeStorage';
export type { UseThemeReturn } from '../../presentation/providers/ThemeProvider';
