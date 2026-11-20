// /src/application/stationContext.ts
// Pure station-context picker (spec 044 / OQ-001 resolved): query commissioning
// → store override → env deployment. Hanya deviceId terdaftar yang boleh dikirim;
// daftar registry kosong (belum termuat/gagal) = konteks tak tervalidasi → ''.
// LAYER RULES: pure domain logic — no IO, no DOM, no infrastructure imports.

/**
 * @param candidates urutan prioritas: [query, stored, env]
 * @param registeredDeviceIds deviceId dari GET /devices; [] = registry unknown
 */
export function pickStationId(
  candidates: ReadonlyArray<string | null | undefined>,
  registeredDeviceIds: ReadonlyArray<string>,
): string {
  if (registeredDeviceIds.length === 0) return '';
  for (const candidate of candidates) {
    const id = (candidate ?? '').trim();
    if (id && registeredDeviceIds.includes(id)) return id;
  }
  return '';
}
