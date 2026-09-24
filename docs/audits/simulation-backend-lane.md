# Audit Jalur Koneksi: Simulasi vs Backend API

> Tanggal: 23 Sep 2026 · Repo: `oee-dashboard-aistudio`
> Pertanyaan: *"Saya meminta mematikan simulasi dan integrasi penuh ke backend, tapi simulasi masih tampil dan berjalan — mengapa?"*
> Metode: telusur statis penuh `presentation → application → infrastructure` + `.env` aktual + mekanisme build Vite.
>
> **Status perbaikan (23 Sep 2026):** F1–F5 sudah dieksekusi — mapper FSM (`live-state.dto.ts`), planned-set tunggal (`Telemetry.ts:isPlannedDowntimeCategory`), `LogEventModal` mode backend (pilih event labelable + kategori Six Big Losses, tab defect disembunyikan), alarm per-device (`BackendAlarmRepository`), banner error + Retry (`DashboardPage`, `useOeeDashboard:loadError/retryLoad`), default `.env.example` → `"true"`, use-case mati (`getLiveStateUseCase`/`sendDeviceCommandUseCase`) dihapus dari container. Lolos `tsc --noEmit` + `pnpm build`.
>
> **Migrasi total (23 Sep 2026, lanjutan):** saat `useBackend=true`, simulasi dimatikan total — komponen simulasi disembunyikan (QR Scanner + `BatchQrScannerModal`, Edge I/O + `MqttEdgeInspectorModal`, badge Edge health, `FloorPushButtonsPanel`, toggle simulasi), data fabrikasi dihapus (reject 60/30/10 → kosong, `?? 201` → `0`, angka mock `TimeAccountsPanel`/`MachineTimelineStrip` → turunan data nyata, kursor demo `PasXProgressStrip` → jam dinding murni), `FullscreenHeader.tsx` mati dihapus. Kekurangan endpoint backend dicatat di `docs/specs/backend-gaps.md` (G1–G8).

---

## 1. Jawaban singkat

Simulasi masih tampil karena **arsitektur dual-lane**: jalur simulasi bukan overlay yang bisa dimatikan dari UI, melainkan **satu dari dua komposisi DI yang dipilih sekali saat bundle dimuat**. Tiga fakta yang menjelaskan semuanya:

1. **Sakelar tidak pernah bisa true karena bug baca env (SUDAH DIPERBAIKI).** `src/infrastructure/config/env.ts` lama memakai akses dinamis (`const meta = import.meta; meta.env?.[key]`). Pola itu **tidak pernah diganti Vite** saat transform/build — `import.meta` telanjang di browser tidak punya properti `.env`, sehingga selalu jatuh ke fallback `'false'`. Terbukti di bundle lama: `` `VITE_USE_BACKEND`,`false`)===`true` `` tanpa nilai inline. Perbaikan: tiap variabel diakses statis `import.meta.env.VITE_X` per baris; bundle baru terbukti meng-inline `"true"` (`tsc` + `build` lolos, diverifikasi via grep dist). Pelajaran: `.env=true` + restart server pun **tidak akan pernah cukup** sebelum bug ini diperbaiki. `DiProvider.tsx:9` (`defaultContainer` singleton) tetap berarti flag beku sejak bundle dimuat — setelah perbaikan ini, cukup hard-refresh (dev) / rebuild (prod).
2. **`.env.example` masih `"false"`.** File `.env` aktual sudah `"true"` (`grep .env`), tapi contoh, dokumentasi, dan memori ("lane simulasi tetap default") masih menunjuk simulasi. Siapa pun yang menjalankan `pnpm dev` dari clone baru / tanpa `.env`, atau membuka `dist/` lama / preview lama, otomatis dapat lane simulasi.
3. **Bahkan saat flag `true`, sisa-sisa simulasi tetap ada di bundle dan sebagian UI.** Detail di §3–§4.

Cara memastikan mode yang sedang jalan: badge di header — `Simulation` (hijau) vs `Backend Live` (biru) — `src/presentation/components/fullscreen/FullscreenOeeView.tsx:200`, `src/presentation/components/HeaderZone.tsx:105`.

---

## 2. Peta total jalur koneksi

### 2.1 Seleksi lane (satu pintu)

| Lokasi | Peran |
|---|---|
| `src/infrastructure/config/env.ts:45` | `useBackend = VITE_USE_BACKEND === 'true'` (default false) |
| `src/infrastructure/di/Container.ts:107` | `const useBackend = env.useBackend` |
| `src/infrastructure/di/Container.ts:118-134` | Pilih repository: `BackendMachineRepository` vs `InMemoryMachineRepository`, `BackendAlarmRepository` vs `InMemoryAlarmRepository`, `NoOpMqttGateway` vs `MqttEdgeSimulatorAdapter` |
| `src/presentation/providers/DiProvider.tsx:9` | Singleton `defaultContainer` — flag beku sejak import pertama |
| `src/presentation/pages/DashboardPage.tsx:33-51` | Meneruskan `container.*` + `container.useBackend` ke `useOeeDashboard` |
| `src/application/hooks/useOeeDashboard.ts:166` | `isSimulating` awal = `!useBackend`; sinkronisasi ulang di baris 192-196 |

### 2.2 Jalur SIMULASI (aktif penuh saat `useBackend=false`)

| # | Jalur | Rantai file |
|---|---|---|
| S1 | Data mesin + seed | `InMemoryMachineRepository.ts:6` ← `infrastructure/seeds/seedData.ts:9` (`INITIAL_MACHINES`) |
| S2 | Data alarm seed | `InMemoryAlarmRepository.ts:5` ← `seedData.ts` (`INITIAL_ALARMS`) |
| S3 | Ticker angka berjalan 3,5 dtk | `useOeeDashboard.ts:395-405` (`setInterval` → `SimulateMachinePulseUseCase`) — dijaga `useBackend`, hanya jalan saat simulasi |
| S4 | Tombol START/STOP/RESET/REJECT lantai | `FloorPushButtonsPanel.tsx:38-61` → `onUpdateMachineStatus / onLogReject / onDispatchMqttCommand` → `MqttEdgeCommandUseCase.ts:59-96` → `MqttEdgeSimulatorAdapter.ts:7-20` (selalu `success:true` palsu) + mutasi InMemory |
| S5 | COUNTING (+1) / SPARE | No-op murni di kedua mode (`FloorPushButtonsPanel.tsx:49-59` — `COUNTING` komentar "Simulated edge pulse", `SPARE` kosong) |
| S6 | Modal Log Floor Event | `LogEventModal.tsx:37-53` → `logDowntime`/`logReject` versi InMemory |
| S7 | QR Scanner → apply job | `BatchQrScannerModal.tsx:65-73` (`onApplyJobConfig`) → `dispatchMqttJobConfig` → gateway simulator + repo InMemory; katalog produk/operator/jadwal statis (`domain/entities/BatchQr.ts`: `QR_PRODUCT_CATALOG` dkk) |
| S8 | Edge I/O inspector | `MqttEdgeInspectorModal.tsx:93-116` — draft IP/broker/QoS lokal + opsi "Simulasi internal" (`MqttEdgeInspectorModal.tsx:412`); kirim via `onSendCommand/onSendJobConfig` (simulator) |
| S9 | Toggle simulasi (ikon RefreshCw) | `FullscreenOeeView.tsx:248`, `HeaderZone.tsx:241`, `FullscreenHeader.tsx:216` — dirender hanya saat `!useBackend` |
| S10 | Status selektor RUNNING/IDLE/DOWN/SETUP | `MachineStatusZone.tsx:56` → `UpdateMachineStatusUseCase` → InMemory |

### 2.3 Jalur BACKEND (aktif saat `useBackend=true`)

| # | Jalur | Rantai file | Status audit |
|---|---|---|---|
| B1 | Daftar mesin | `BackendMachineRepository.ts:126-180` = `GET /live-state` + `GET /machines` + `resolve` + `getDowntimes` + `getHourlyTrends` per snapshot | Hidup, tapi N+1 dan rapuh (satu snapshot gagal resolve → jobConfig kosong `buildDefaultJobConfig`) |
| B2 | Alarm | `BackendAlarmRepository.ts:52-60` = `GET /operational-events/:deviceId` | **Rusak parsial**: dipanggil dengan `deviceId=''` → path `/api/v1/operational-events/` tidak cocok dengan route backend `/:deviceId` → 404 → `catch` → `[]`. `AlarmsZone` kosong kecuali event WS masuk (`useOeeDashboard.ts:365-380`) |
| B3 | Downtime + trend suplemen | `GetDowntimeReasonsUseCase.ts:12`, `GetHourlyTrendsUseCase` via `useOeeDashboard.ts:271-318` | Hidup (setelah perbaikan parsing `[CATEGORY]` dan planned-set) |
| B4 | Tick real-time | `useOeeDashboard.ts:321-387` via `SubscribeTelemetryUseCase` → `TelemetryWsClient` | Hidup; `is_buffered:true` diteruskan tapi tidak memicu gauge (kontrak `isLiveTelemetryFrame`) |
| B5 | START/STOP/RESET/RESUME | `updateMachineStatus` → `BackendMachineRepository.ts:187-208,232-238` → `POST /devices/:id/command` (REST nyata, butuh JWT + LAN) | Hidup. Catatan: `MqttEdgeCommandUseCase` memanggil `NoOpMqttGateway` dulu (return `success:false`, tidak throw), lalu repo → REST tetap jalan. `sendDeviceCommandUseCase` di container **tidak dipakai UI mana pun** (mati) |
| B6 | Label downtime | `logDowntime` backend (`useOeeDashboard.ts:441-471`) → `POST /downtime-events/:id/reason` | Hidup **hanya** bila pemanggil menyertakan `backendEventId`; `LogEventModal` tidak pernah menyertakannya → §4 temuan F3 |
| B7 | WO dispatch/complete/cancel, device bind/unbind, registry | `ProductionSetupModal` + `DeviceConfigModal` via `listWorkOrdersUseCase` / `configureDeviceUseCase` | Hidup, dijaga `isBackendMode` + PIN (`runProtected`, `useOeeDashboard.ts:249-268`) |
| B8 | Auth PIN | `AuthPinModal` → `POST /auth/operator-pin`, token di `localStorage oee_api_token` (`httpClient.ts:26-33`) | Hidup |

### 2.4 Jalur MATI / no-op di mode backend (jebakan "kok tidak terjadi apa-apa")

| # | Jalur | Lokasi | Efek saat backend |
|---|---|---|---|
| D1 | `logReject` | `useOeeDashboard.ts:482-490` (`if (useBackend) return`) | Tombol REJECT + tab Defect modal diam-diam tidak melakukan apa-apa |
| D2 | `LogEventModal` tab Downtime | butuh `backendEventId: number` (`useOeeDashboard.ts:441-442`), modal tidak punya field itu | Submit Norden: fungsi return tanpa error |
| D3 | Alarm ack/resolve | `useOeeDashboard.ts:492-500` selalu lokal; `BackendAlarmRepository.ts:68-80` memalsukan objek lokal | Tidak ada endpoint backend yang dipanggil (memang tidak ada endpoint alarm — by design) |
| D4 | `COUNTING`/`SPARE` | `FloorPushButtonsPanel.tsx:49-59` | No-op di kedua mode |
| D5 | `MqttEdgeInspectorModal` kirim command/job | via `mqttEdgeCommandUseCase` → `NoOpMqttGateway.ts:10-16` (`success:false`) | Draft MQTT tidak berarti apa-apa di backend; repo tetap dipanggil setelahnya (B5) |
| D6 | `sendDeviceCommandUseCase`, `getLiveStateUseCase` | `Container.ts:147-149` dibuat tapi tidak ada di `DashboardPage.tsx:33-51` | Kode mati — kandidat hapus saat enforcement |

---

## 3. Mengapa "sudah diubah tapi tetap simulasi" — 5 penyebab konkret

1. **Bundle basi.** Nilai `VITE_*` dibakar saat build. `dist/` yang di-preview/di-deploy sebelum `.env=true` tetap simulasi selamanya. Rebuild + pastikan badge header biru `Backend Live`.
2. **Dev server tidak direstart setelah edit `.env`.** Same-origin proxy dev (`vite.config.ts` → gateway `:80`) juga dibaca saat start.
3. **Clone/fresh env tanpa `.env`.** `.env.example` = `"false"`; siapa pun tanpa `.env` mendapat simulasi. `.env` tidak di-commit (benar untuk secret), jadi tiap mesin harus membuatnya.
4. **Backend tidak terjangkau → halaman terlihat "kosong/loading", lalu dianggap "simulasi tidak mati".** `httpClient.ts:35-45` memakai `apiBaseUrl=""` (relative → proxy dev, atau same-origin prod). Jika gateway `:80`/docker stack mati, `getAllMachines` throw → ditangkap diam-diam (`useOeeDashboard.ts:214-219`, `BackendAlarmRepository.ts:57-59`) → `machines=[]` → `DashboardPage.tsx:55-61` stuck di *"Loading OEE dashboard…"* tanpa pesan error. Tidak ada banner error — ini cacat UX yang harus diperbaiki saat enforcement.
5. **Mutasi butuh JWT + LAN.** Tanpa login PIN (`AuthPinModal`), aksi membuka modal auth (`runProtected`). Di remote tunnel `:8080`, aktuasi diblokir 403 oleh backend. Dari sisi operator ini terlihat seperti "tombol tidak berfungsi".

---

## 4. Cacat backend-lane yang ditemukan saat audit (wajib diperbaiki sebelum enforcement penuh)

| ID | Temuan | Bukti | Dampak |
|---|---|---|---|
| F1 | State FSM backend tidak dikenali mapper: backend mengirim `PLANNED_DOWNTIME`/`UNPLANNED_DOWNTIME`, `normalizeState` hanya kenal `PLANNED_DT`/`UNPLANNED_DT` → jatuh ke `UNCONFIGURED` → status `IDLE` | `dto/live-state.dto.ts:30-35` vs backend `FsmStateEnum`; `BackendMachineRepository.ts:31-52` (default → `IDLE`) | Mesin yang sedang downtime tampil IDLE; gauge availability ikut salah arah |
| F2 | Duplikasi planned-set: `BackendMachineRepository.ts:87-89` masih 3 kategori lama (tanpa `SETUP_AND_ADJUSTMENT`), sedangkan `GetDowntimeReasonsUseCase.ts` sudah 4 | diff kedua file | Changeover PLANNED di supplemental load tapi UNPLANNED di initial load — inkonsisten dalam satu layar |
| F3 | `LogEventModal` mati total di backend (D1+D2) | `LogEventModal.tsx:37-53`, `useOeeDashboard.ts:440-490` | Operator tidak bisa label downtime/reject dari UI audit |
| F4 | `AlarmsZone` kosong di backend saat load awal (B2) | `BackendAlarmRepository.ts:52-60` | Audit terlihat "tidak ada alarm" padahal ada |
| F5 | Tidak ada error surface: semua fetch backend gagal → loading abadi, tanpa pesan | `useOeeDashboard.ts:203-230`, `DashboardPage.tsx:55-61` | Operator tidak tahu backend mati vs data kosong |
| F6 | `unplannedDowntimeMinutes` backend = `downtimeSec/60 − plannedBreakMin` penuh (`BackendMachineRepository.ts:369`) | — | Di tengah shift, unplanned terlihat lebih kecil dari seharusnya (break dikurangkan penuh sejak menit pertama) |
| F7 | Konten simulasi ikut ter-bundle selalu: `seedData`, simulator, katalog QR statis diimpor modul-level | `InMemoryMachineRepository.ts:6`, `BatchQr.ts` | Ukuran bundle + risiko kebocoran data demo ke layar backend (target hourly `0`, reject reason 60/30/10 sintetis di `BackendMachineRepository.ts:167-174` dan `useOeeDashboard.ts:294-301`) |

---

## 5. Cara mematikan simulasi total (checklist enforcement)

Urutan yang disarankan — tanpa ini, "integrasi penuh" belum tercapai:

1. **Sakelar default → backend.** `.env.example`: `VITE_USE_BACKEND="true"`; pertahankan `.env` lokal `"true"`. Restart dev / rebuild + verifikasi badge `Backend Live`.
2. **Perbaiki F1–F4** (mapper FSM, planned-set ganda, `LogEventModal` backend dengan `backendEventId` dari `labelableDowntimes`, `getAllAlarms` per-device dari registry bukan `''`).
3. **Tambahkan error surface** (ganti loading-abadi dengan banner "Backend tidak terjangkau: <pesan> + tombol Retry").
4. **Hapus/batasi kode mati simulasi dari bundle backend**: `sendDeviceCommandUseCase`/`getLiveStateUseCase` yang tak terpakai (D6), opsi "Simulasi internal", katalog QR statis → ganti master backend; atau pisahkan via dynamic import agar `seedData` tidak terbawa saat `useBackend=true`.
5. **Tentukan nasib yang memang tidak ada di backend**: reject manual (D1 — backend hanya kenal `finalRejectCount` saat complete WO), ack alarm lokal (D3), COUNTING/SPARE (D5). Pilih: sembunyikan di backend (seperti `FloorPushButtonsPanel` yang sudah `!useBackend`) atau petakan ke endpoint nyata.
6. **Verifikasi end-to-end**: badge biru → matikan docker gateway → banner error muncul (bukan loading abadi) → nyalakan → data live-state tampil → login PIN → START/STOP/RESET memicu `POST /devices/:id/command` (cek `transaction_id`) → label downtime via daftar labelable (bukan modal lama) → WS tick menggerakkan gauge, frame buffered tidak.

---

## 6. Referensi silang berkas

- Sakelar & komposisi: `src/infrastructure/config/env.ts:37-46`, `src/infrastructure/di/Container.ts:97-191`, `src/presentation/providers/DiProvider.tsx:9`
- Orkestrasi: `src/application/hooks/useOeeDashboard.ts:166,192-196,203-230,271-318,321-387,394-405,440-490,502-550`
- Koordinator UI: `src/presentation/pages/DashboardPage.tsx:33-61`
- Adapter: `BackendMachineRepository.ts:117-180,187-261`, `BackendAlarmRepository.ts:45-81`, `MqttEdgeSimulatorAdapter.ts`, `NoOpMqttGateway.ts`, `InMemoryMachineRepository.ts:6`, `InMemoryAlarmRepository.ts:5`
- HTTP: `infrastructure/api/httpClient.ts:35-58`, `infrastructure/api/oeeApiClient.ts:144-200`, `infrastructure/realtime/telemetryWsClient.ts`
- UI simulasi: `FloorPushButtonsPanel.tsx`, `LogEventModal.tsx`, `MqttEdgeInspectorModal.tsx:93-116,412`, `BatchQrScannerModal.tsx:59-118`, `MachineStatusZone.tsx:56`
- Env: `.env` (`VITE_USE_BACKEND="true"`), `.env.example:39-42` (`"false"`)
