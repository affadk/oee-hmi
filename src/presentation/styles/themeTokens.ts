// /src/presentation/styles/themeTokens.ts
// Canonical theme tokens (moved from src/utils/theme.ts).
// Presentation-owned styling contract — no business logic here.

export type ResolvedTheme = 'dark' | 'light';

export const themeTokens = {
  shell: {
    dark: 'bg-[#080e1a] text-slate-100',
    light: 'bg-[#e9edf4] text-slate-900',
  },
  card: {
    dark: 'bg-[#0f1b2e] border-slate-800',
    light: 'bg-white border-[#c9d3df]',
  },
  cardInset: {
    dark: 'bg-slate-900 border-slate-800',
    light: 'bg-slate-50 border-slate-200',
  },
  cardHover: {
    dark: 'hover:border-slate-600',
    light: 'hover:border-slate-300',
  },
  textPrimary: { dark: 'text-slate-100', light: 'text-slate-900' },
  textStrong: { dark: 'text-white', light: 'text-slate-900' },
  textBody: { dark: 'text-slate-200', light: 'text-slate-800' },
  textSecondary: { dark: 'text-slate-300', light: 'text-slate-600' },
  textMuted: { dark: 'text-slate-400', light: 'text-slate-500' },
  textFaint: { dark: 'text-slate-500', light: 'text-slate-400' },
  borderSoft: { dark: 'border-slate-800', light: 'border-slate-200' },
  divider: { dark: 'border-slate-700/50', light: 'border-slate-200' },
  overlay: { dark: 'bg-slate-800/70 border-slate-700/60', light: 'bg-slate-100 border-slate-200' },
  input: {
    dark: 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500',
    light: 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400',
  },
  tabIdle: {
    dark: 'border-transparent text-slate-400 hover:text-slate-200',
    light: 'border-transparent text-slate-500 hover:text-slate-900',
  },
  closeButton: {
    dark: 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200',
    light: 'hover:bg-slate-100 text-slate-500 hover:text-slate-900',
  },
  footerButton: {
    dark: 'bg-slate-700 hover:bg-slate-600 text-white',
    light: 'bg-slate-200 hover:bg-slate-300 text-slate-800',
  },
  selectedCard: 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500',
} as const;

type TokenGroup = { dark: string; light: string };

/** Picks the dark/light branch of a token group. */
export function tx(group: TokenGroup, isDark: boolean): string {
  return isDark ? group.dark : group.light;
}

/** Conditional class helper — keeps modal code readable. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
