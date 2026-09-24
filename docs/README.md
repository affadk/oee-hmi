# Status Dokumen `docs/` — OEE Dashboard

> Diperbarui: 24 Sep 2026. Acuan verifikasi: kode `src/` pasca-refactor strict + 31 test hijau.
> Legenda: ✅ SELESAI (closed, historis) · 🟡 BUTUH TINDAKAN (ada aksi terbuka) · 📌 SPEC AKTIF (acuan berjalan)

| File | Jenis | Status | Keterangan & aksi tersisa |
|---|---|---|---|
| `AUDIT_LAYERED_ARCHITECTURE_DAN_KUALITAS_KODE.md` | Audit + log eksekusi | ✅ SELESAI | Seluruh temuan P0/P1/P2 dieksekusi (§7–§12). Deferral tercatat jujur: ubah signature repository alarm, E2E lawan backend live. Tidak ada aksi kode tersisa dari dokumen ini. |
| `AUDIT_JALUR_SIMULASI_VS_BACKEND.md` | Audit dual-lane | ✅ SELESAI (sisi frontend) | F1–F5 + migrasi total dieksekusi. Tersisa §5 item 6: verifikasi E2E (badge biru → matikan gateway → banner → PIN → command → label → WS) — butuh docker stack, tidak bisa dari repo ini. |
| `plan/Rencana Penyesuaian Integrasi Frontend ↔ Backend IIoT OEE.md` | Rencana integrasi | ✅ SELESAI | Semua Key Changes + Test Plan terpenuhi (mapper DTO, deviceId, skala WS, auth PIN, LogEventModal backend, 31 test). Arsip historis — jangan diedit. |
| `BACKEND_GAP_REPORT.md` | Tuntutan ke backend | 🟡 BUTUH TINDAKAN (tim `iiot-oee`) | G1–G16 terbuka; G12–G16 + kriteria selesai sudah diperjelas. Pemilik aksi: tim backend. Frontend hanya adaptor bila kontrak berubah. |
| `OEE_SHIFT_OVERVIEW_AND_AUDIT_API_SPEC.md` | Spec `PROPOSED v1.0` | 📌 SPEC AKTIF, sebagian basi | Fase 0 (reuse) jalan di frontend. Fase 1 (`shift-summary`, `shift-timeline`) belum ada di backend maupun frontend (`GetShiftSummaryUseCase`/`IShiftOeeRepository` belum dibuat). Referensi basi pasca-hapus panel mati: `MachineTimelineStrip`, `RecentEventsPanel` (§0 tabel, §2.2, §3.2, §7) — baca sebagai "panel audit generik". `FloorPushButtonsPanel`, `EChartsOeeTrend`, `PasXProgressStrip` masih ada. |

## Urutan baca yang disarankan

1. `OEE_SHIFT_OVERVIEW_AND_AUDIT_API_SPEC.md` — kontrak yang dituju (reuse §2 kini, aditif §3 nanti).
2. `BACKEND_GAP_REPORT.md` — apa yang harus dibangun/diputuskan backend (G1–G16 + kriteria selesai).
3. `AUDIT_JALUR_SIMULASI_VS_BACKEND.md` — konteks dual-lane + checklist E2E manual.
4. `AUDIT_LAYERED_ARCHITECTURE_DAN_KUALITAS_KODE.md` — riwayat refactor frontend (§7–§12).
5. `plan/` — arsip rencana yang sudah selesai (referensi saja).
