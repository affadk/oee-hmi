# ADR-0007 — HMI non-aktuatif (aktuasi hanya di Edge OEE)

- Status: Accepted
- Tanggal: 2026-11-23
- Menyempurnakan: ADR-0005 (initiation QR), ADR-0006 (config-only), OQ-401 spec 004

## Konteks

Directive pemilik: tombol START/STOP/RESET hanya dari tombol fisik Edge OEE. HMI semula punya jalur aktuasi sendiri:

- `FloorPushButtonsPanel` (lane simulasi): START/STOP/REJECT/RESET + `onDispatchMachineCommand('RESET_COUNTER')`.
- `FullscreenSubHeader` dan `HeaderZone`: kartu status bisa diklik → toggle RUNNING↔DOWN.
- `MachineStatusZone`: tombol set RUNNING/IDLE/DOWN/SETUP + RESET counter.
- `MqttEdgeInspectorModal`: tab Kontrol (RESUME/PAUSE/RESET) dan "Aksi cepat" di tab Ringkasan.
- `LogEventModal`: tab DEFECT → `onAddReject` (hitungan reject manual).

Jalur itu tidak sesuai aturan operasi: satu-satunya aktuasi mesin adalah tombol fisik di Edge OEE.

## Keputusan

1. HMI **non-aktuatif**. HMI hanya menampilkan state, mengonfigurasi (job config, registrasi perangkat), melabeli downtime, export bukti, scan/validasi WO.
2. Dihapus dari presentasi: `FloorPushButtonsPanel` (file + barrel), tombol set status di `FullscreenSubHeader`/`HeaderZone`/`MachineStatusZone`, tab DEFECT `LogEventModal`, tombol RESUME/PAUSE/RESET `MqttEdgeInspectorModal` (tab Kontrol read-only, "Aksi cepat" hanya navigasi tab).
3. Kartu status mesin tetap tampil sebagai indikator read-only (warna/label dari `isRunning`), bukan kontrol.
4. Use case `UpdateMachineStatusUseCase`/`MachineCommandUseCase` tetap ada di lapisan aplikasi (tidak dihapus) tetapi tanpa pemanggil di presentasi; test `tests/noHmiActuation.test.ts` menjaga agar elemen presentasi tidak memanggil `dispatchMachineCommand`/`sendCmd`.
5. Job config / registrasi perangkat tetap (konfigurasi, bukan aktuasi) — sesuai ADR-0006.

## Konsekuensi

- Tombol fisik Edge OEE satu-satunya sumber START/STOP/RESET; nol jalur HMI yang mengubah status mesin.
- Koreksi status salah tidak bisa dilakukan dari HMI; harus lewat edge/fisik.
- Lane simulasi kehilangan cara memicu siklus dari UI; simulasi hanya menampilkan data dari edge-sim.
- Diff terbatas presentasi (5 file) + 1 file dihapus + 1 test baru; nol perubahan backend/broker/tunnel.

## Verifikasi

- `pnpm lint` (tsc + lint:arch) OK.
- `pnpm test` OK (204 test / 30 file) termasuk guard non-aktuatif.
- Grep presentasi: nol `dispatchMachineCommand|sendCmd(`.
