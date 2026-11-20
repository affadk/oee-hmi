# ADR-0003 — Batas Kontrak DTO: Skema Kanonis, Null ≠ 0, Agregat Server Otoritatif

**Status:** Accepted
**Tanggal:** 2026-11-20
**Acceptance:** pemilik repo, directive "mulai implementasikan" (2026-11-20)
**Unit terkait:** `specs/001-hmi-data-transfer-refresh`
**Acuan kontrak:** API_DOCUMENTATION §7B/7J (019), §K (016/ADR-019 backend), §C (ADR-0021), §6A/6C

## Konteks

DTO klien membaca skema legacy hourly/aggregate (`avg*`, `oee`, `estHourlyOutput`) sedangkan kontrak kanonis backend kini `availabilityPct/performancePct/qualityPct/oeePct` (string-numeric **nullable**) + `totalCount/goodCount/rejectCount` + `operatingSec/runSec` + `sampleCount` + `provisional`; `hourlyDowntimeSec` dihapus. `toFiniteNumber(null)` memaksa 0 — padahal `null` berarti "bucket belum punya sampel ber-`udt`/penyebut nol", bukan nol produksi. Semantik availability berubah (016/ADR-019): `run/(run+unplanned)` — planned downtime tidak lagi menurunkan Availability; fallback komposisi klien masih memakai semantik lama. Live-state = kumulatif lifetime; agregat = SUM delta per bucket — keduanya hanya sebanding pada jam produksi aktif. Status WO backend menambah `PENDING_CLOSE` (ADR-0021) yang tidak dikenal union klien.

## Keputusan

1. **DTO boundary (`src/infrastructure/backend/dto/*`) satu-satunya penerjemah kontrak.** Domain/application/presentation tidak pernah melihat key wire.
2. **Skema kanonis menang**: DTO membaca `*Pct` + counter kanonis; alias legacy (`avg*`, `estHourlyOutput`, `oee`) dipertahankan hanya sebagai fallback transisi dan dicatat untuk dihapus setelah backend terverifikasi kanonis penuh.
3. **Null dipertahankan sampai domain** untuk field nullable kontrak (`*Pct`, `targetPerHour`, health cache-miss). Presentation yang ada menampilkan `—`/menyembunyikan. Dilarang coerce null → 0.
4. **`provisional` dipetakan** (bucket CAgg belum final) dan tersedia untuk tooltip/penanda eksisting.
5. **Agregat server otoritatif untuk OEE shift**: `shift-summary` menang atas komposisi klien; fallback klien wajib memakai semantik sama (`availability = run/(run+unplanned)`; performance basis `operatingSec`; quality `good/total`). Selisih live-state vs agregat tidak "dikoreksi" — keduanya beda basis by design (§7B D1).
6. **Union status WO mengikuti kontrak**: `PENDING|ACTIVE|PENDING_CLOSE|COMPLETED|ABORTED`; `complete` menerima `ACTIVE|PENDING_CLOSE`; guard klien `finalRejectCount ≤ totalCount`.
7. **FSM kanonis 6 nilai** (`UNCONFIGURED|READY|RUNNING|PLANNED_DOWNTIME|UNPLANNED_DOWNTIME|BATCH_FINISHED`) dinormalisasi di DTO; state tak dikenal → `UNCONFIGURED` (perilaku eksisting dipertahankan).

## Alternatif yang Dipertimbangkan

- **Coerce null → 0 (perilaku kini)** — ditolak: fabrikasi; bucket tanpa sampel tampil sebagai produksi nol, menyesatkan keputusan lantai.
- **OEE komposisi klien sebagai primer** — ditolak: divergen dari CAgg SUM-based backend (025); dua sumber kebenaran.
- **Hapus alias legacy sekaligus** — ditolak dulu: backend hidup mungkin masih mengirim `avg*` (audit G17); transisi bertahap lebih aman, alias ditandai sunset.
- **Normalisasi FSM di presentation** — ditolak: melanggar batas layer; DTO sudah tempatnya (G6).

## Konsekuensi

- Positif: grafik tidak nol saat backend kanonis; angka jujur (null/`—`); satu semantik OEE lintas layar; WO batch-finished bisa dikonfirmasi operator.
- Negatif/biaya: tipe domain melebar (`number | null`) → penyisiran pemakai di presentation yang sudah ada (tanpa ubah layout); alias ganda sementara menambah cabang DTO (dibatasi, ada kriteria sunset).
- Verifikasi: uji DTO dua skema + uji null; E2E bandingkan `shift-summary` vs live-state hanya pada jam produksi aktif (toleransi ±0.1).
