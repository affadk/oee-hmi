# Design — Spec 004 Chooser 2 Jalur Scan

> Kontrak solusi teknis. Turunan spec 004 rev 1.
> Prasyarat: unit 003 (`routeBackendQr`, `QrZoneBadge`, pipa initiate) ada.

**Lifecycle:** DESIGNED
**Health:** VALID
**Traces to:** `spec.md` rev 1 · ADR-0005
**Reviewed against:** spec revision 1

## Architecture

Satu modal, satu state lane. Chooser memilih jalur → gating input per jalur:

```
modal buka (backend) ─→ scanLane = CHOOSER ─→ ScanLaneChooser (2 kartu)
                            ├─ pilih A ─→ scanLane = ZONE ─→ stepper 4 zona + kamera(zona-saja)
                            │              QR WO discan ─→ "pakai Jalur B"  (tetap di A)
                            │              4 badge discan ─→ draft ─→ panel konfirmasi ─→ configure edge
                            └─ pilih B ─→ scanLane = WO ─→ kamera/textfield (WO-saja)
                                           badge zona discan ─→ "pakai Jalur A" (tetap di B)
                                           QR WO ─→ resolve → preview → Konfigurasi Edge (Setup Produksi)
START logging = tombol FÍSÍK di Edge OEE (di luar HMI).
```

## State

`scanLane: 'CHOOSER' | 'ZONE' | 'WO'` (backend-mode saja). Reset ke `CHOOSER` setiap modal dibuka. Jalur simulasi (`backendMode=false`) tak punya chooser (FR-006) — tetap wizard 4 identitas.

## Components

| Komponen | Tanggung jawab | Trace |
|---|---|---|
| `steps/ScanLaneChooser.tsx` (baru, presentational) | 2 kartu besar fokusabel keyboard (Enter/Space), ARIA `aria-label` per jalur; ikon + judul + subjudul; reuse `themeTokens`; tema gelap/terang | FR-001, NFR-001/002 |
| `BatchQrScannerModal.tsx` | state `scanLane`; reset ke CHOOSER saat buka; render chooser → gating kamera/textfield/stepper per jalur; "Kembali ke pilihan jalur" (reset draft/scannedWo + cameraKey++); relabel footer config-only; instruksi START fisik | FR-001..005 |
| `handleCameraScan` (modal) | baca `routeBackendQr`; jika jenis salah jalur → pesan arah + re-arm kamera (`cameraKey++`); ZONE: badge→applyZoneBadge; WO: WO→resolveWo | FR-002/003 |
| `application/qrRouting.ts` | `WO_LANE_WRONG_MESSAGE`, `ZONE_LANE_WRONG_MESSAGE` (pesan arah lintas jalur) | FR-002/003 |
| `QrScanInput.tsx` | hanya render di jalur WO; placeholder WO; submit → `submitWoForPreview` (tolak badge zona via `isZonePaste`) | FR-003 |

### Perilaku kamera (deliberate, lazy)

`QrCameraScanner` single-shot (stop after first read, tak diubah). **Jalur A** memakai ulang komponen apa adanya dan **re-arm** via `cameraKey++` setelah tiap badge (scan → apply → kamera restart untuk badge berikutnya). **Jalur B** juga re-arm saat QR salah/unknown agar operator bisa coba lagi; sukses (WO) tak perlu re-arm (lanjut setup). Tak ada edit komponen kamera bersama.

### Peta render per jalur

| Elemen | CHOOSER | ZONE | WO |
|---|---|---|---|
| Stepper | – | ✔ | – |
| QrDraftSummary | – | ✔ | – |
| Kamera | – | ✔ (zona) | ✔ (WO) |
| QrScanInput | – | – | ✔ |
| Body | chooser | BackendZoneStep / Review(zona) | Review(WO) |
| Footer aksi | – | Konfirmasi & Konfigurasi | Konfigurasi Edge (Setup) |

## Copy config-only (FR-004)

- Jalur B tombol lanjut: **"Konfigurasi Edge Device"** (bukan "Mulai Setup Produksi").
- Chooser subjudul A/B + footer: **"HMI hanya mengonfigurasi edge device. Mulai logging = tekan tombol START di Edge OEE."** Satu konstanta `START_EDGE_HINT` dipakai di chooser & footer.

## Navigation

"Kembali ke pilihan jalur" (tombol kecil di header tiap jalur): `setScanLane('CHOOSER')` + reset draft zona (ZONE) / `scannedWo=null` (WO) + `cameraKey++`. Ganti jalur tanpa tutup modal.

## Error Handling

- QR WO di Jalur A → `WO_LANE_WRONG_MESSAGE` ("QR WO terdeteksi — gunakan Jalur B: Scan WO Existing"), draft A tak berubah.
- Badge zona di Jalur B → `ZONE_LANE_WRONG_MESSAGE` ("Badge zona terdeteksi — gunakan Jalur A: 4 QR Bertahap").
- Parse gagal / tak dikenal → pesan route existing; jalur tetap, kamera re-arm.

## Security / Scope

Tak menyentuh `capabilityGate` (FAT-252), guard START `FloorPushButtonsPanel`, `ProductionSetupModal`, backend, broker, layout live monitor. Tak ada IO baru; chooser presentational.

## Alternatives Considered

- Tab header (ditolak user: pilih chooser kartu besar).
- Auto-route tanpa chooser (ditolak: ambigu, tak eksplisit).
- Ubah `QrCameraScanner` jadi continuous (ditolak lazy: re-arm via key cukup, nol risiko regresi jalur B).