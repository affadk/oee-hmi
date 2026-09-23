// /src/presentation/utils/fluidType.ts
// Skala tipografi fluid yang responsif terhadap ukuran + rasio layar.
//
// Catatan jujur soal "inch layar": browser TIDAK bisa membaca ukuran fisik
// layar (satuan CSS `in` mengasumsikan 96dpi). Proksi yang benar adalah `vmin`
// = 1% sisi terkecil viewport: menangkap besar layar sekaligus rasio aspek
// (layar ultrawide/letterbox -> vmin kecil -> teks mengecil agar tetap muat;
// layar besar 16:9 -> vmin besar -> teks membesar).
// Untuk canvas ECharts (font harus angka, bukan CSS), skala dihitung dari
// ukuran kontainer terukur via ResizeObserver (lihat containerScale).

/** clamp(MINpx, VMINvmin, MAXpx) — untuk style fontSize inline. */
export function fluid(minPx: number, vmin: number, maxPx: number): string {
  return `clamp(${minPx}px, ${vmin}vmin, ${maxPx}px)`;
}

/**
 * Faktor skala dari ukuran kontainer terukur terhadap ukuran referensi.
 * Dibatasi [min, max] agar tidak terlalu kecil/besar di ekstrem.
 */
export function containerScale(
  w: number,
  h: number,
  refW: number,
  refH: number,
  min = 0.8,
  max = 1.6,
): number {
  if (w <= 0 || h <= 0) return 1;
  const k = Math.min(w / refW, h / refH);
  return Math.min(max, Math.max(min, k));
}

/** Skala font basis (px desain) dengan faktor k, dijepit [min, max]. */
export function scaledFont(base: number, k: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, base * k));
}
