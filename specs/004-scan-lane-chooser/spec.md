# Spec 004 — Chooser 2 Jalur Scan: "4 QR Bertahap" vs "Scan WO Existing"

> Kontrak perilaku pemisahan UI scan QR di backend-mode menjadi dua jalur eksplisit.
> Membangun di atas spec 003 (dual-lane) + ADR-0005. **HMI = konfigurasi edge device saja; START logging = tekan tombol fisik di Edge OEE.**

**Lifecycle:** SPECIFIED
**Health:** VALID
**Revision:** 1 (2026-11-23)

## 1. Problem

Modal scan backend-mode (`BatchQrScannerModal`) saat ini membuka langsung ke wizard 4-zona dengan **satu kamera auto-rutekan** (badge zona → draft, QR WO → resolve). Operator tidak diberi pilihan eksplisit: "mau scan 4 QR bertahap, atau scan WO yang sudah ada?". Dua alur ini tercampur dalam satu layar, menimbulkan ambiguitas sebelum konfigurasi edge.

## 2. In Scope

- **Chooser 2 kartu** saat modal scan backend-mode dibuka: **Jalur A — 4 QR Bertahap** (produk → mesin → operator → shift) dan **Jalur B — Scan WO Existing**. Operator memilih jalur sebelum alur dimulai.
- **Pemisahan alur**: Jalur A hanya menerima badge zona (kamera); Jalur B hanya menerima QR WO (kamera/textfield). QR dari jalur salah → pesan arahkan ke jalur yang benar, bukan di-route diam-diam.
- **Navigasi balik** ke chooser untuk ganti jalur tanpa menutup modal.
- **Semantik config-only**: seluruh copy/UI menyatakan HMI hanya mengonfigurasi edge device; START logging adalah aksi fisik di Edge OEE.
- Relabel tombol/aksi yang menyiratkan START oleh HMI → makna konfigurasi.

## 3. Out of Scope

- Mengubah guard/penghapusan tombol START HMI (`FloorPushButtonsPanel`) — lihat OQ-401; perubahan itu CRITICAL (aktuasasi), butuh keputusan pemilik terpisah.
- Backend, kontrak DTO, endpoint, auth, broker, NFR keamanan. Tak tersentuh.
- Lane simulasi (non-backend): wizard 4 identitas lama tidak berubah.
- Perubahan layout live monitor (tetap beku, AC-008 spec 003).

## 4. Actors

- **Operator** (kiosk/Station, HMI): memilih jalur, memindai 4 badge (A) atau QR WO (B), mengonfigurasi edge device. START fisik di Edge OEE.
- **Edge STM32**: penerima config, pengirim ACK, tombol START fisik.
- **Supervisor/Admin**: membuat WO di admin-panel (jalur B input, di luar unit).

## 5. Scenarios

1. Operator buka modal scan (backend-mode) → dua kartu jalur tampil, kamera belum aktif.
2. Pilih **Jalur A** → alur 4 badge zona (kamera) → panel konfirmasi → initiate/konfigurasi edge → tunggu ACK. Perilaku inti = spec 003 FR-002/005.
3. Pilih **Jalur B** → fokus input WO → scan/tempel QR WO → resolve → pratinjau → konfigurasi edge (dispatch). Tanpa klaim START.
4. Di Jalur A, operator tak sengaja scan QR WO → pesan "QR WO — gunakan Jalur B (Scan WO Existing)".
5. Di Jalur B, operator scan badge zona → pesan "Badge zona — gunakan Jalur A (4 QR Bertahap)".
6. Operator ingin ganti jalur → tombol "Kembali ke pilihan jalur" → chooser tampil; draft zona tetap/aman.
7. Setelah konfigurasi, operator menekan START secara fisik di Edge OEE → logging mulai.

## 6. Functional Requirements

- **FR-001** Backend-mode: saat modal dibuka, chooser 2 kartu tampil (Jalur A: "4 QR Bertahap — produk, mesin, operator, shift"; Jalur B: "Scan WO Existing — konfigurasi edge dari WO tersimpan"). Kamera/stepper/input belum aktif sampai jalur dipilih. Kartu dapat difokus keyboard (Enter/Space), ARIA label jelas, konsisten tema gelap/terang.
- **FR-002** Jalur A memakai alur zona existing (spec 003 FR-002/003/004/005) tanpa perubahan perilaku inti: kamera scan 4 badge → draft per zona → panel konfirmasi → `validate-zone` 4× → `initiate-from-zones` → tunggu ACK terbatas. **Kamera Jalur A hanya menerima badge zona**; QR WO ditolak dengan pesan arah ke Jalur B. Textfield manual tidak tersedia di Jalur A (badge = bukti fisik, directive pemilik).
- **FR-003** Jalur B memakai alur WO existing (spec 003 FR-006): QR WO via kamera atau textfield → `submitWoForPreview`/resolve → pratinjau data backend → konfigurasi edge (dispatch via Setup Produksi). **Jalur B hanya menerima QR WO**; badge zona ditolak dengan pesan arah ke Jalur A.
- **FR-004** Semantik **config-only**: tidak ada copy/UI yang menyatakan HMI memulai/menjalankan mesin. Tombol pasca konfirmasi dilabeli makna konfigurasi (mis. "Konfigurasi Edge Device"), bukan "Mulai". Instruksi eksplisit: START logging dilakukan dengan menekan tombol fisik di Edge OEE setelah WO ACTIVE.
- **FR-005** Navigasi: dari layar jalur mana pun tersedia "Kembali ke pilihan jalur" → chooser; pilihan jalur dapat diganti tanpa menutup modal. Reset modal (tutup/buka) selalu mulai dari chooser.
- **FR-006** Lane simulasi (backend-mode off) tidak berubah: wizard 4 identitas lama (produk/mesin/operator/shift) tetap; chooser tidak tampil.
- **FR-007** Diff komponen live monitor beku = nol. Perubahan presentasi hanya di `BatchQrScannerModal` + komponen chooser baru (+ label). Tidak menyentuh guard START / `FloorPushButtonsPanel`.

## 7. Non-Functional

- **NFR-001 A11y**: chooser & tombol jalur fokusabel keyboard, `role`/`aria-label` benar, status toast `aria-live`.
- **NFR-002 Arsitektur**: komponen chooser presentational (tanpa IO); tetap lolos `lint:arch` (domain zero-IO, presentation no-direct-IO backend, no `any`).
- **NFR-003 Konsistensi**: pakai `themeTokens`/`useTheme` yang ada; tanpa dependensi baru.

## 8. Constraints

- Konstitusi + constraint repo (`.sdd/context/constraints.md`): perubahan auth/aktuasasi = HIGH; layout live monitor beku.
- Directive pemilik (2026-11-23): **"Untuk memulai harus menekan tombol dari Edge OEE; UI HMI hanya konfigurasi EDGE DEVICE sebelum logging; START di edge."** Semantik ini mengikat seluruh copy UI scan.
- Backend otoritas validasi akhir; HMI tidak menambah aturan domain backend.

## 9. Acceptance Criteria

- **AC-001** (FR-001) Given backend-mode + modal scan dibuka, Then dua kartu jalur tampil dan kamera belum aktif; memilih kartu dengan keyboard (Enter) masuk jalur terkait.
- **AC-002** (FR-002) Given pilih Jalur A, When scan 4 badge zona, Then draft terisi & alur init/konfigurasi sama spec 003; QR WO yang discan di Jalur A → pesan arah Jalur B, bukan resolve.
- **AC-003** (FR-003) Given pilih Jalur B, When scan/tempel QR WO, Then resolve + pratinjau tampil dan tombol lanjut berlabel konfigurasi edge; badge zona di Jalur B → pesan arah Jalur A.
- **AC-004** (FR-004) Given seluruh copy UI scan, Then tidak ada frasa yang menyiratkan HMI START; instruksi START fisik di Edge OEE tampil.
- **AC-005** (FR-005) Given berada di Jalur A/B, When "Kembali ke pilihan jalur", Then chooser tampil dan jalur lain dapat dipilih.
- **AC-006** (FR-006) Given backend-mode off, Then chooser tidak tampil; wizard 4 identitas lama tetap utuh.
- **AC-007** (FR-007) Given diff perubahan, Then nol file live monitor tersentuh; `pnpm lint` (termasuk `lint:arch`) + `pnpm test` hijau.

## 10. Open Questions

- **OQ-401** Tombol START HMI (`FloorPushButtonsPanel`) — sesuai directive "START di edge", apakah tombol START HMI dihapus/dinonaktifkan, atau tetap sebagai mirror read-only? **Unit ini tidak mengubahnya** (CRITICAL, eskalasi pemilik).
- **OQ-402** Jalur B: tetap membuka `ProductionSetupModal` terpisah untuk dispatch (perilaku kini, relabel), atau inline konfigurasi di dalam scanner? Default: tetap Setup Produksi, tombol dilabeli makna konfigurasi.

## 11. Revision History

- **Rev 1 (2026-11-23):** Spec awal. Chooser 2 kartu + pemisahan jalur + semantik config-only (directive pemilik START di edge).
