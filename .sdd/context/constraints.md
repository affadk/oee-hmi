# Standing Constraints — oee-dashboard-aistudio

> Constraint repo-wide; tidak perlu diulang tiap spec. Constraint khusus unit tetap di spec.md masing-masing.

## Business constraints

- **Layout OEE live monitor BEKU** (directive produk, 2026-11-20): `OverviewPage`, `FullscreenOeeView`, `DashboardPage`, zona audit, panel, gauge tidak boleh berubah tampilan/layout. Perubahan data hanya di lapisan transfer; presentasi yang diizinkan berubah hanya modal auth (PIN→password, visual parity). Pencabutan beku = directive produk eksplisit + spec baru.
- **Separasi surface** (directive produk 2026-11-20, ADR-0004 Proposed, unit 002): HMI kiosk = live per device + start 4 QR; Station = login + fleet kartu → live; Andon = publik read-only; **historical/master/IAM = admin-panel, bukan HMI**. Kiosk terkunci by deployment (station context), bukan toggle UI. QR = data job, bukan autentikasi.
- Produk keputusan D1/D2/D3 (25 Sep 2026, `docs/specs/backend-gaps.md`) tetap berlaku: reject tanpa alasan (UNCLASSIFIED final); grafik hanya jam produksi + istirahat; badge Edge minimal di Overview.

## Technical constraints

- Kontrak wire otoritatif: `iiot-oee/apps/backend/docs/API_DOCUMENTATION.md` (repo sebelah). Bila docs vs payload hidup beda → probe, catat, jangan menebak.
- Dual-vhost backend: LAN :80 read-write; tunnel :8080 **read-only** (GET/OPTIONS; aktuasi 403). HMI tidak boleh mencoba mutasi via tunnel.
- Aktuasi mesin: JWT + RBAC + subnet RFC1918 + audit fail-closed (backend). Reason perintah ≥ 5 karakter. `COUNT_ADJUST` wajib count 0..999999.
- Auth: username+password (PIN dihapus total); throttle backend otoritatif (5/60s, `Retry-After`); JWT TTL 900s sliding; `station_id` = deviceId terdaftar, bukan kredensial, bukan input manual.
- Station context kiosk (OQ-001 resolved 2026-11-20): env `VITE_STATION_ID` per deployment → override store → query `?station=` (commissioning); validasi ke `GET /devices`; tak ada/invalid → kosong. Tidak pernah `machineId`.
- **Deployment HMI = LOKAL** (directive pemilik 2026-11-20): alamat backend lokal `http://localhost:8080` (vhost LAN; host 8081 = loopback tunnel vhost, bukan target HMI). Tunnel publik `oee.fadik.web.id` bukan alamat data HMI; mode read-only tunnel tetap didukung kode (FR-008) untuk deployment lain.
- WS `/ws/telemetry`: origin divalidasi (close 4403); rate limit 120 koneksi/menit/IP (close 4429); heartbeat dua lapis (teks ping/pong + protocol ping 30s); `is_buffered` di-drop relay; ignore-unknown type wajib.
- FSM kanonis 6 nilai; `STANDBY` dinormalisasi server → READY. `isOnline` = proyeksi TTL `last_seen_at` (default 300s).
- Agregat: `*Pct` nullable (null ≠ 0); availability = run/(run+unplanned); live-state kumulatif lifetime vs agregat SUM delta — tidak langsung sebanding.
- Arsitektur hexagonal + `pnpm lint:arch` (domain zero-IO, application inward-only, presentation no-direct-IO, no explicit any).
- Dual-lane `VITE_USE_BACKEND`: simulasi (dev tanpa stack) vs backend (produksi). Env dibaca hanya via `src/infrastructure/config/env.ts` (statis per-baris).

## Organizational constraints

- Solo developer + AI agents; keputusan arsitektur (ADR) dan spec butuh acceptance pemilik repo sebelum implementasi.
- Bahasa artefak: Indonesia (konsisten repo & ekosistem iiot-oee); identifier kode tetap English.
- Backend dikembangkan tim/repo terpisah (`iiot-oee`) — unit klien tidak mengubah backend; gap kontrak dicatat, bukan di-workaround diam-diam.
