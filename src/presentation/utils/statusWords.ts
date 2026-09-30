// /src/presentation/utils/statusWords.ts
// Kata Bahasa Indonesia untuk nilai biner/teknis di UI.
// Jangan render "true"/"false"/"0"/"1"/"ONLINE"/"OFFLINE" mentah ke operator.

/** Status koneksi mesin/perangkat: 'ONLINE' → 'Terhubung', selain itu 'Terputus'. */
export function connectionWord(status: string | null | undefined): 'Terhubung' | 'Terputus' {
  return status === 'ONLINE' ? 'Terhubung' : 'Terputus';
}

/** Boolean generik ke kata: true → 'Ya', false → 'Tidak'. */
export function yesNoWord(value: boolean | null | undefined): 'Ya' | 'Tidak' {
  return value === true ? 'Ya' : 'Tidak';
}

/** Flag buffer telemetri: true → 'Tertunda', false → 'Langsung'. */
export function streamWord(isBuffered: boolean | null | undefined): 'Tertunda' | 'Langsung' {
  return isBuffered === true ? 'Tertunda' : 'Langsung';
}
