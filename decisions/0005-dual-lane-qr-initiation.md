# ADR-0005 — Dual-Lane Inisiasi QR: Parser Zona Cermin Backend + Draft Fail-Closed + Tunggu ACK Terbatas

**Status:** Accepted
**Acceptance:** pemilik repo, 2026-11-20 (jawaban OQ-201..204 menyetujui keputusan 1–4; directive tambahan: textfield manual hanya jalur WO, badge zona wajib scan kamera, panel konfirmasi konfigurasi sebelum tulisan ke edge)
**Tanggal:** 2026-11-20
**Unit terkait:** `specs/003-qr-dual-lane-initiation`
**Acuan:** API_DOCUMENTATION §C.7/§C.8; backend `qr-zone-parser.ts`, `multi-zone-work-order.ts`, `dispatch.ts:459-520` (ACK SUCCESS→ACTIVE, ACK error→ABORTED, watchdog 15s); ADR-0004 (QR = data job, kiosk start 4 QR); analisis gap sinkronisasi 2026-11-20 (GAP-F21..F26).

## Konteks

Backend mendefinisikan penuh alur fisik: scan 4 badge zona (`PID/MID/OID/SID`) → validate-zone → initiate-from-zones (buat WO PENDING + dispatch MQTT QoS1) → ACK edge ≤15s → WO ACTIVE → START. HMI (unit 002) memiliki pipa initiate yang benar, tetapi:

1. Parser HMI (`parseQrString`) tidak mengenal format badge backend — cabang key-value hanya `WO/PRD/PRODUCT` (`BatchQr.ts:177`); badge `PID=..;CT=..` ditolak.
2. Backend-mode merutekan **semua** scan (kamera + paste) ke `submitWoForPreview` (resolve WO existing); `applyParsedQr` tidak dipanggil → draft 4 zona disintesis dari jobConfig mesin, bukan dari badge (`QrScanInput.tsx:23`, `BatchQrScannerModal.tsx:337-340`).
3. `draftFromMachine` fallback katalog demo (`PRD-FLANGE-B20` dll) → initiate bisa mengirim ID fiktif → 400 `MASTER_NOT_FOUND` (`BatchQrScannerModal.tsx:104-121`).
4. LINE/DATE/TARGET disintesis dari mesin + tanggal lokal, bukan badge shift → risiko `SHIFT_WINDOW_MISMATCH` (`qrZones.ts:34-41`).
5. Pasca initiate, modal langsung mengklaim "WO aktif — produksi berjalan" padahal WO masih PENDING menunggu ACK; tanpa UX timeout/ABORTED (`BatchQrScannerModal.tsx:603`).

Dua jalur inisiasi sah dan harus didukung: **A** = WO dibuat on-the-fly dari 4 badge; **B** = WO pra-dibuat admin, di-resolve dari QR ber-WO. Keduanya berujung pada konfigurasi edge ter-ACK sebelum START fisik.

## Keputusan

1. **Parser zona cermin backend di domain HMI** (`QrZoneBadge.ts`, pure): kunci wajib + alias + validasi persis `qr-zone-parser.ts`; terpisah dari `parseQrString` katalog (jalur simulasi + jalur B tetap). Vektor uji dari test backend. Backend tetap otoritas validasi akhir (validate-zone); parser klien = umpan balik dini, bukan pengganti.
2. **Routing scan tunggal auto-deteksi** di backend-mode: badge zona dari **kamera** → draft per zona (jalur A); QR ber-WO (kamera atau textfield) → resolve existing (jalur B); tak dikenal → error jujur. **TextField manual hanya jalur WO** — badge zona ditempel ke textfield ditolak dengan pesan arah kamera (badge = bukti fisik; directive pemilik OQ-201). Tanpa toggle lane manual.
3. **Draft backend-mode fail-closed**: mulai kosong, hanya dari scan kamera badge atau pilih master nyata; initiate disabled sampai 4 zona lengkap. Katalog demo tidak pernah menjadi payload initiate. Nilai zona (LINE/DATE/window/BREAK/TARGET/CT) dikirim apa adanya dari badge; MID ≠ mesin terikat → error klien dini. **Panel konfirmasi konfigurasi** menampilkan 4 zona hasil scan; tulisan ke edge (validate+initiate) hanya setelah konfirmasi eksplisit operator (directive pemilik).
4. **Tunggu ACK terbatas bersama** untuk kedua jalur: poll detail WO bounded (interval 2s, cap 20s > watchdog 15s; berhenti saat ACTIVE/ABORTED/timeout) memakai port detail existing; bukan fetch-loop permanen. ACTIVE → sukses + START siap; ABORTED → error ACK; timeout → pesan `TIMEOUT_UNACKNOWLEDGED` + retry idempoten. Klaim sukses pra-ACK dihapus.
5. **Guard START + layout beku tidak disentuh**: `jobConfig.workOrder` sudah hanya terisi dari WO ACTIVE (`BackendMachineRepository.ts:371`) → START efektif ter-gate ACK via lapisan data. Perubahan presentasi hanya modal QR + Setup Produksi.

## Alternatif yang Dipertimbangkan

- **Perluas `parseQrString` dengan kunci zona** — ditolak: mencampur kontrak katalog demo/simulasi dengan kontrak wire backend; dua parser dengan otoritas berbeda lebih jujur dan teruji terpisah.
- **Toggle lane eksplisit di modal** — ditolak (OQ-201 rekomendasi): kunci zona deterministik; toggle menambah langkah operator tanpa nilai.
- **Prefill draft dari jobConfig nyata** — ditolak (OQ-202 rekomendasi): jobConfig ada berarti WO ACTIVE sudah ada → initiate pasti 409; prefill menyesatkan operator.
- **Tunggu ACK via WS saja** — ditolak (OQ-203 rekomendasi): ACK mengubah DB backend, bukan broadcast WS langsung; deteksi bergantung telemetri edge pasca-ACK yang tidak dijamin tepat waktu. Poll bounded deterministik dan murah (≤10 request).
- **Import parser backend langsung (shared package)** — ditolak: lintas repo, backend tidak diubah dari repo ini; cermin pure + vektor uji backend = drift terdeteksi dini.

## Konsekuensi

- Positif: alur fisik 4 badge → configure → ACK → START tersambung penuh; dua jalur sah tanpa ambiguitas; tidak ada payload fiktif ke backend; operator melihat status ACK jujur (PENDING/ACTIVE/ABORTED/timeout).
- Negatif/biaya: duplikasi aturan parser (HMI cermin backend) — drift dimitigasi vektor uji; poll bounded menambah ≤10 request per initiate; draft kosong menambah langkah scan wajib (memang alur fisik yang benar).
- Netral: backend tidak diubah; jalur simulasi tetap; guard START & layout beku tak tersentuh; kamera secure-context dipenuhi deployment kiosk via localhost (OQ-204 resolved); textfield paste hanya jalur WO.
