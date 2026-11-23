# ADR-0006 — Chooser 2 Jalur Scan Eksplisit + Semantik Config-Only (START di Edge)

**Status:** Accepted
**Acceptance:** pemilik repo, 2026-11-23 (jawaban atas tiga pertanyaan desain unit 004)
**Tanggal:** 2026-11-23
**Unit terkait:** `specs/004-scan-lane-chooser`
**Acuan:** ADR-0005 (dual-lane routing auto-deteksi); directive pemilik 2026-11-23 ("untuk memulai harus menekan tombol dari Edge OEE; UI HMI hanya konfigurasi EDGE DEVICE sebelum logging; START di edge").

## Konteks

Unit 003 menyatukan dua mekanisme inisiasi (Jalur A: 4 badge zona; Jalur B: QR WO existing) dalam **satu kamera auto-rutekan**. Operator tidak diberi pilihan eksplisit; dua alur tercampur di satu layar sebelum konfigurasi edge. Directive pemilik menegaskan: HMI tidak memulai mesin — START logging adalah aksi fisik di Edge OEE; HMI hanya mengonfigurasi edge device.

## Keputusan

1. **Chooser 2 kartu besar** saat modal scan backend-mode dibuka: "Jalur A — 4 QR Bertahap" vs "Jalur B — Scan WO Existing". Operator memilih jalur sebelum kamera/input aktif. Paling jelas untuk operator shopfloor; memaksa pilihan eksplisit, menghilangkan ambiguitas auto-route.
2. **Gating input per jalur**: Jalur A hanya terima badge zona (QR WO → pesan arah B); Jalur B hanya terima QR WO (badge zona → pesan arah A). `routeBackendQr` tetap mesin deteksi; lane menentukan pesan + aksi. Textfield hanya Jalur B (paritas FR-002 unit 003).
3. **Semantik config-only mengikat copy**: HMI tidak menampilkan frasa yang menyiratkan START/menjalankan mesin. Tombol Jalur B = "Konfigurasi Edge Device"; instruksi eksplisit: **START logging = tekan tombol fisik di Edge OEE** setelah WO ACTIVE. Tak menyentuh guard `FloorPushButtonsPanel` (OQ-401, CRITICAL, eskalasi pemilik terpisah).
4. **Tak sentuh backend/broker/auth/layout live monitor**. Chooser presentational (nol IO), reuse `themeTokens`, kamera single-shot di-re-arm via `cameraKey` (tanpa ubah `QrCameraScanner`).

## Alternatif yang Dipertimbangkan

- **Auto-route tanpa chooser** (status quo unit 003): ditolak — ambigu, operator tak diberi pilihan.
- **Tab header 2 jalur**: ditolak pemilik — kartu besar lebih jelas untuk kiosk.
- **Ubah `QrCameraScanner` jadi continuous**: ditolak (lazy) — re-arm via key cukup, nol risiko regresi Jalur B.

## Konsekuensi

Positif: dua jalur eksplisit, arah lintas-jalur jelas, copy jujur (HMI config, bukan start). Biaya: satu langkah pilih jalur tambahan sebelum scan (memang alur yang benar); tombol START HMI tetap (OQ-401 belum diputuskan).