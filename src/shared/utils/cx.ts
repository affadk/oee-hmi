// /src/shared/utils/cx.ts
// Framework-free class-name helper shared across layers (no React, no DOM).

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
