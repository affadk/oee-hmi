# Audit Layered Architecture & Kualitas Kode — OEE Dashboard

> Tanggal: 23 Sep 2026 · Repo: `oee-dashboard-aistudio`
> Metode: audit ulang penuh 4 jalur paralel (domain+application, infrastructure, presentation, kualitas lintas-lapis) + verifikasi shell (`grep`/`wc`/`find`).
> Referensi: `ARCHITECTURE.md`, Context7 `/reactjs/react.dev` (pola `useContext` DI + `useEffect` cleanup `ignore`/`AbortController`).
> Status: temuan lama diperkuat + temuan baru. Tidak ada file sumber diubah saat audit.

## 0. Metrik terverifikasi (shell, bukan estimasi)

| Lapisan | File TS/TSX |
|---|---|
| `src/domain` | 17 |
| `src/application` (1 barrel + 2 hooks + 3 dto + 17 use-case) | 23 |
| `src/infrastructure` (termasuk 2 shim) | 17 |
| `src/presentation` (13 components + 5 echarts + 17 fullscreen + page/providers/hooks/styles/utils) | 42 |
| `src/shared` (`cx.ts`) | 1 |
| **Total `src`** | **103** |
| `tests/` | **0 file (direktori kosong)** |

God files (>300 baris, `wc -l`): `BatchQrScannerModal.tsx:819`, `useOeeDashboard.ts:814`, `FullscreenOeeView.tsx:727`, `MqttEdgeInspectorModal.tsx:723`, `DeviceConfigModal.tsx:411`, `BackendMachineRepository.ts:375`, `EChartsOeeTrend.tsx:369`, `LogEventModal.tsx:367`, `HeaderZone.tsx:363`, `seedData.ts:341`, `DashboardPage.tsx:327`, `EChartsProdVsTarget.tsx:301`.

Kualitas tipe (terverifikasi): `any` = **12 di 8 file (semua presentation)**; `@ts-ignore/@ts-nocheck` = 0; `console.*` = 2 (`console.error` saja, `useOeeDashboard.ts:223,311`); `eslint-disable` = 4 komentar tanpa eslint terinstal; dead deps (`express`, `@google/genai`, `dotenv`, `motion`) = **0 import di `src/`**.

## 1. Kepatuhan layered architecture

Aturan acuan (`ARCHITECTURE.md`): `presentation → application → domain`, `infrastructure implements ports`, dependency menunjuk ke dalam.

| Lapisan | Verdict | Bukti |
|---|---|---|
| `domain/` | BERSIH | Grep `fetch\|new WebSocket\|localStorage\|import.meta` di `src/domain/` = 0 hit. Hanya komentar. Semua entity/port `import type` antar-domain. |
| `application/` use-case (17) | BERSIH arah | Grep `from.*infrastructure` di `src/application/` = 0 hit. Semua use-case import hanya `domain/ports|entities|services`. |
| `application/` barrel+shim | 1 PELANGGARAN ARAH | `application/hooks/useTheme.ts:7,9` re-export dari `presentation/providers/ThemeProvider` (application→presentation). 0 importer — hapus aman. |
| `infrastructure/` IO ownership | BENAR + 1 sebaran | `fetch` hanya `api/httpClient.ts:37`; `WebSocket` hanya `realtime/telemetryWsClient.ts:26`; `import.meta.env` hanya `config/env.ts:20-23`. **Tapi** token `oee_api_token` di 3 file tanpa konstanta bersama: `api/httpClient.ts:29`, `api/oeeApiClient.ts:220,237,244`; tema key terpisah `storage/LocalStorageThemeAdapter.ts:21,51` (pakai `localStorage` global vs `window.localStorage` di API — inkonsisten). |
| `infrastructure/` ↔ `presentation` | SIKLUS via barrel | `infrastructure/di/DiContext.tsx:5-6` re-export dari `presentation/providers/DiProvider`, diekspor ulang `infrastructure/index.ts:18`. Sementara `presentation/providers/DiProvider.tsx:7` + `ThemeProvider.tsx:7-8` import dari `infrastructure/di/Container`. Selamat hari ini karena semua import pakai deep-path, tapi siapa pun yang import kedua barrel dapat inisialisasi melingkar. Hapus `DiContext.tsx` + baris 18 barrel infra. |
| `presentation/` | 1 PELANGGARAN KERAS | `presentation/providers/ThemeProvider.tsx:7-8,49`: import `defaultContainer` + `LocalStorageThemeAdapter` konkret + cast `as`. Seharusnya `useDiContainer().themeStorage: IThemeStoragePort`. `DiProvider.tsx:7,9,16` import `Container` wajar (composition surface). Grep lain: 0 `fetch`/repository di presentation. Import `domain/*` di 30+ komponen = legal. |

Inversi terdokumentasi tapi rapuh: `infrastructure/api/oeeApiClient.ts:22-30` + `realtime/telemetryWsClient.ts:8` import `application/dto/*` (diizinkan `ARCHITECTURE.md:19`, tapi DTO boundary seharusnya di `infrastructure/`/`shared/` agar infra tidak depend app).

## 2. Penguatan temuan lama (terverifikasi ulang)

1. **God Hook** — `application/hooks/useOeeDashboard.ts:139-814` (814 baris, ~30 `useState`, ~69 field return `:60-137 → :743-813`, 5 `useEffect`, ~30 `useCallback`). Campur boot-fetch + supplemental + WS + ticker simulasi + auth + registry + WO + 6 modal state. Pola `isMounted` + `AbortController` sudah benar per Context7, tapi sinyal tidak diteruskan (lihat §3 temuan baru N1).
2. **N+1 backend** — `BackendMachineRepository.ts:137-150` `await` sequential per snapshot (resolve + downtimes + trends serial antar mesin); `getMachineById:181-184` = `getAllMachines()` penuh, dipakai ulang oleh `updateMachineStatus:204`, `resetCounters:233`, `setJobConfig:257`. Operasi single-machine = O(fleet).
3. **Token storage tercerai** — §1 di atas. Tambahan: `OeeHttpWorkOrderRepository.statusFilter:55-58` mutable state + contract `IOeeBackend.ts:35` `updateStatusFilter` menaruh state UI di port repository; 0 callsite.
4. **`as any`** — tepat 12 (bukan estimasi): `HeaderZone.tsx:90`, `LogEventModal.tsx:251`, `MqttEdgeInspectorModal.tsx:230`, 8x formatter echarts (`EChartsProdVsTarget:92,100`, `EChartsOeeTrend:161,165`, `EChartsComponentBreakdown:37`, `EChartsLossWaterfall:79,162,175`, `QualityRejectAnalysisPanel:41`).
5. **Test/lint gap** — `tests/` 0 file; `package.json` scripts: `lint = tsc --noEmit` saja, `build = vite build` tanpa `tsc -b` (tipe rusak tidak gagalkan build); 4 `eslint-disable` yatim; `tsconfig.json` **tanpa** `strict`, `noUnusedLocals`, `noUncheckedIndexedAccess` (isi penuh terverifikasi §3).
6. **Shim deprecated** — `src/types.ts`, `application/hooks/useTheme.ts`, `infrastructure/adapters/LocalStorageThemeAdapter.ts` = 0 importer (aman hapus); `infrastructure/di/DiContext.tsx` = 1 importer via barrel (`infrastructure/index.ts:18`).
7. **Default env kontradiktif** — `.env` + `.env.example` keduanya `VITE_USE_BACKEND="true"`, tapi `env.ts:55` fallback `'false'` + `ARCHITECTURE.md:36` klaim "simulasi default". Selaraskan docs vs example.

## 3. Temuan baru (belum ada di audit sebelumnya)

### P0 — salah skala & field hilang (numerik OEE ikut salah)

- **N1 — faktor `cyc` 10x kekecilan.** Kontrak `domain/entities/MqttContracts.ts:9` = 10ms units (`1080 = 10.80s`) → faktor encode benar ×100. Decoder `OeeCalculator.ts:25` (`cyc/100`) dan DTO `telemetry.dto.ts:122` (`raw.cyc/100`) mengasumsikan ×100. Tapi encoder backend memakai ×10: `BackendMachineRepository.ts:65` (`Math.round(lastCycleTimeSec * 10)`), `useOeeDashboard.ts:345` (sama). Perbaiki kedua encoder ke ×100.
- **N2 — field `a` (availability wire) hilang di WS mapping.** `useOeeDashboard.ts:348-350` menulis `oee/p/q` dari `frame.oee.*` tapi tidak pernah menulis `a`. Setelah frame WS pertama, `telemetry.a` basi (nilai snapshot awal) sementara `OeeCalculator.calculate:60` membaca `telemetry.a` → Availability stagnan. Tambahkan `a: Math.round(frame.oee.availability * 100)`.
- **N3 — `telemetri kosong → A/P/Q/OEE = 0` + falsy-trap.** `OeeCalculator.ts:60-63` (`?.a ? … : 0`): mesin `UNCONFIGURED`/snapshot awal selalu 0 walau counts tersedia; nilai wire `0` valid (down penuh) tak dibedakan dari "data hilang". Pakai `!= null` + fallback hitung ISO-22400 dari runTime/counts. `teepPct:84-85` selalu 0 (`calendarUtilizationPct = 0` hardcode) → toggle TEEP fitur mati numerik.
- **N4 — WS tanpa reconnect.** `telemetryWsClient.ts`: tidak ada `onclose`/`onerror`/backoff/health-timeout (grep = none). Socket ditutup server → `heartbeat:41-43` terus `send('ping')` ke socket mati, UI basi diam-diam. `disconnect:46-55` tidak melepas `onmessage`. Tambahkan `onclose` → cleanup + reconnect terjadwal + status koneksi.

### P1 — divergensi & robustness

- **N5 — `isLiveTelemetryFrame` tidak pernah dipanggil.** Definisi `Telemetry.ts:89`, disebut di komentar `SubscribeTelemetryUseCase.ts:3` + `telemetryWsClient.ts:5`, 0 callsite. Frame `is_buffered:true` diteruskan mentah ke `setMachines` (`useOeeDashboard.ts:328-366`). Panggil filter atau hapus komentar.
- **N6 — AbortController mati.** `useOeeDashboard.ts:205,209,235-236` buat + abort controller tapi `getMachinesUseCase.executeAll()` / `getAllAlarms()` dipanggil tanpa signal (`:211-212`); port `IMachineRepository` memang tanpa param signal (inkonsisten vs `IOeeBackend` yang punya). Efek supplemental `:279-320` tanpa controller. Teruskan `signal` ke repo backend-lane.
- **N7 — `toFiniteNumber` 4x identik.** `LiveState.ts:33-36` (kanonis, di-export) vs salinan lokal `telemetry.dto.ts:85-88`, `work-order.dto.ts:75-78`, `BackendMachineRepository.ts:27-30` (terakhir bahkan tak dipanggil di file itu = dead). Satukan ke kanonis.
- **N8 — daftar kategori downtime ganda.** `Telemetry.ts:18-28` union vs `telemetry.dto.ts:211-222` `KNOWN_DOWNTIME_CATEGORIES` duplikat; tambah kategori = edit 2 file. Derive tunggal. Terkait: `ShiftTimeline.ts:116` (`category === 'Planned'`) tak cocok upper-snake backend → pakai `isPlannedDowntimeCategory`; `useOeeDashboard.ts:465` append optimistik hardcode `type:'UNPLANNED'`.
- **N9 — skala `totalOee` vs `a/p/q` inkonsisten + `good` tanpa fallback.** `telemetry.dto.ts:129-134`: `a/p/q` dibagi `/100` tapi `totalOee` tanpa pembagi (`oee_x100=8240` tersimpan 8240); `counters.good:120` tanpa fallback `tot - rej` (frame MQTT murni selalu `good=0`). Frame inti `:119-139` tanpa coerce string numerik; `work-order.dto.ts:59,91,95-96` numerik tanpa coerce; `live-state.dto.ts:55,59-60` (`|| null`) menelan `0` valid.
- **N10 — 15 file mati.** 0 importer di luar definisi: 11 panel fullscreen (`TopDowntimeReasonsPanel`, `TimeAccountsPanel`, `RecentEventsPanel`, `QualityRejectAnalysisPanel`, `ProductionSummaryPanel`, `ProductionProgressPanel`, `PhysicalButtonRibbon`, `PasXShiftview`, `MachineTimelineStrip`, `AvailabilityLossPanel`, `MachineStatusPanel`) + 4 echarts (`EChartsKpiGauge`, `EChartsProdVsTarget`, `EChartsLossWaterfall`, `EChartsComponentBreakdown`). Satu-satunya echarts hidup: `EChartsOeeTrend` via `FullscreenOeeView.tsx:23,609-617`. Hapus/arsip. Terkait: `GetLiveStateUseCase` + `SendDeviceCommandUseCase` di-export tapi 0 konstruksi/pemanggilan (grep di luar definisi+barrel = kosong).
- **N11 — `BackendAlarmRepository` fabrikasi + redam error.** `addAlarm:86-90` no-op return input; `updateAlarmStatus:92-104` fabrikasi (`machineId:'unknown'`, `durationMinutes:1`); `TYPE_MAP:12-25` 11 tipe → `Warning`; `getAllAlarms:61-67` fan-out N device + `catch→[]` per device & global (`:65,71-73,81-83`) → gagal total tampil "nol alarm". `BackendMachineRepository:141,148-149,248-253,266-268` pola sama (`catch→null/[]`).
- **N12 — casing body + envelope inkonsisten.** `oeeApiClient.ts:83,136,217` snake (`device_id`, `operator_id`) vs `complete:86-89` camel (`finalRejectCount`) — risiko 400; `list:69` hardcode `envelope:true` sementara downtimes/trends default `false` + meta sintetis. `resolve:79-80` (`raw.work_order ?? {}`) tanpa assert bentuk. `httpClient.ts:39-40` selalu `Content-Type: json` (termasuk GET → preflight tak perlu); `:47` 204 → `undefined as T` meracuni `Promise<MachineRecord>`; `:50` parse-error → `null as T`.
- **N13 — auth 401 bolong 4 titik.** Desain `runProtected:257-276` + replay PIN benar, tapi bypass: `acknowledgeAlarm/resolveAlarm:494-502` tanpa `runProtected`; boot load `:211-212` tanpa `runProtected` (401 = `loadError` generik bukan modal PIN); `logReject:484-492` (`if (useBackend) return` diam); token tanpa refresh/expiry pre-check.
- **N14 — backend mock leakage.** `BackendMachineRepository:334-349,65,75-76`: `health` 0-an, `targetOee/*` 0, `cyc` fallback 90, `di:0`, `is_buffered:false` tampil seolah data nyata. Kosongkan (`null`) atau tandai unavailable. `resolveDeviceId:271-276` (`startsWith('STM32-')` + `listMachines()` per command) rapuh + boros.
- **N15 — `GetHourlyTrendsUseCase:9-26,36,43` dead + salah semantik.** Mapper status tak dipanggil, `status:'RUNNING'` hardcode, `actual` = total/jumlah-bucket (bukan rate), semantik status divergen dari `BackendMachineRepository:32-53`.

### P2 — smell, testability, a11y

- **N16 — clock/ID/random impure di application:** `MqttEdgeCommandUseCase.ts:28` (`tx-${Date.now()}`), `:69,72` (`toLocaleTimeString`), `UpdateMachineStatusUseCase.ts:18,26`, `LogDowntimeUseCase.ts:18,36`, `LogRejectUseCase.ts:15-16` (fallback `2520/41/945` = angka seed bocor), `SimulateMachinePulseUseCase.ts:15,21` (`Math.random`). Inject `Clock/Id/Rng`. Magic numbers: siklus 9.0, shift 06:00-14:00, break 60, `0.5075`, `plannedOperatingSec 25200`.
- **N17 — `useFullscreen.ts:27-34` hijack tombol `f` global** (tanpa modifier, skip hanya input/textarea; `select`/`contenteditable` tetap kena). Ganti `Ctrl/Cmd+F` atau tombol eksplisit.
- **N18 — a11y/HTML:** ~30 `<button>` tanpa `type` (`MqttEdgeInspectorModal` 17x, `FormulaHelpModal:35,213`, `LogEventModal:119`, `MachineStatusZone:57,126`, `LossAnalysisZone:65,71`, `TrendZone:76,77`, `AlarmsZone:105,112`, …); tombol icon-only hanya `title` tanpa `aria-label`; `PasXDonutGauge:56-62` + `HeaderZone:349` `div onClick` tanpa `role/tabIndex/onKeyDown`; `index.css:103-105` (`.audit-micro` 10px) langgar baseline sendiri `>=12px` (`:7`).
- **N19 — dead props & render:** `HeaderZone.tsx:19-41` terima 21 props, 3 tak dipakai (`selectedPlant`, `selectedDate`, `metrics`); `FullscreenOeeView.tsx:64-67` default `async ()=>{}` menutupi wiring hilang; `EChartsOeeTrend.tsx:312` re-init chart tiap pixel resize (`box.w/h` di deps) — pisah effect init vs resize; `DashboardPage.tsx:90,145` label enum vs label tombol beda (`FULLSCREEN_IMAGE` vs "OEE Shift Overview").
- **N20 — guard `!useBackend` konsisten (positif) + 1 label menyesatkan:** MQTT/QR/sim UI benar disembunyikan backend (`DashboardPage:278`, `HeaderZone:177,241,265`, `FullscreenOeeView:176,217,231,244,291,679,712`, `MqttEdgeInspectorModal:412`). Tapi `PasXProgressStrip.tsx:122-128` loop demo simulasi tetap label `LIVE` saat jam di luar shift.
- **N21 — `BatchQr.ts:42-59` katalog seed di domain** (data mock, bukan aturan bisnis). Pindah ke `infrastructure/seeds`/fixtures; domain sisakan tipe + parser. `IThemeStorage.ts:26-30` doc DOM (`.dark`/`data-theme`) bocor ke port — pindah ke adapter.
- **N22 — validasi longgar:** `ListWorkOrdersUseCase.ts:29-31` (`NaN < 0 === false` lolos); `SendDeviceCommandUseCase.ts:11-14` tanpa validasi deviceId/enum; `useOeeDashboard.ts:444` silent `return` bila `backendEventId` bukan number; branching `if (useBackend)` di ~15 titik — split strategi backend vs simulasi.

## 4. Rencana remediasi (prioritas)

**P0 (akurasi data + ketahanan koneksi):**
1. N1+N2+N3: betulkan faktor `cyc` ×100 (2 encoder), tambah field `a` di WS mapping, fallback OEE non-telemetri + `!= null`, implementasi/hapus TEEP mati.
2. God Hook: pecah `useOeeDashboard` → `useMachinesQuery`, `useTelemetrySubscription`, `useWorkOrders`, `useDeviceRegistry`, `useAuthSession`.
3. N4+N5: reconnect WS + panggil `isLiveTelemetryFrame` (atau hapus janji filter).
4. N+1: batched `Promise.allSettled` per halaman + cache registry; `getMachineById` tanpa `getAllMachines()`.

**P1 (divergensi, error surface, layering):**
5. Token: satu `TokenStorage` port+adapter; hapus `statusFilter` mutable; betulkan casing `finalRejectCount`; assert envelope.
6. Error UX: badge "data parsial" untuk supplemental/alarms fallback; `runProtected` untuk ack/resolve + boot-401; bedakan "kosong" vs "error".
7. Layering: `ThemeProvider` via `useDiContainer()`; hapus `DiContext.tsx` + `infrastructure/index.ts:18` + `useTheme.ts` shim + `src/types.ts`; DTO keluar dari barrel application (atau pindah ke infra); satukan `toFiniteNumber` + kategori downtime.
8. Hapus/arsip 15 file mati + 2 use-case mati; perbaiki 12 `any`; ketatkan `httpClient` (header, 204, parse-error).

**P2 (hygiene):**
9. `tsconfig`: `strict:true` + `noUnusedLocals` + `noUncheckedIndexedAccess`; `build`: `tsc -b && vite build`; tambah `eslint` + `no-restricted-imports` per layer + `vitest` (mulai DTO/`BatchQr`/`normalizeState`/`withQuery`/`endpoints`) + `knip`; hapus 4 dead deps; pilih 1 package manager (lockfile ganda `pnpm-lock.yaml` + `bun.lock`).
10. A11y/UX: `type="button"` massal, `aria-label` icon-only, keyboard untuk div-klik, lepas hijack `f`, selaraskan `.audit-micro` baseline, label view-mode vs enum.

## 5. Perintah verifikasi

```bash
# layering
grep -rn 'from.*infrastructure/' src/application/ | wc -l          # harap 0
grep -rn 'fetch(\|new WebSocket\|localStorage\|import.meta' src/domain/ | wc -l  # harap 0
grep -rn 'isLiveTelemetryFrame' src/                              # harap ada callsite, bukan cuma komentar
grep -rn 'onclose\|onerror\|reconnect' src/infrastructure/realtime/  # harap ada
# kualitas
grep -rn -E '\bany\b' src/ | wc -l                                # target turun dari 12 → 0
ls tests/                                                         # harap tidak kosong
npx tsc --noEmit                                                  # harap lolos dengan strict:true
```

## 6. Referensi silang berkas (inti)

- Sakelar & komposisi: `src/infrastructure/config/env.ts:17-28,55`, `src/infrastructure/di/Container.ts:99-183`, `src/presentation/providers/DiProvider.tsx:7-16`, `src/presentation/providers/ThemeProvider.tsx:7-9,49`
- Orkestrasi: `src/application/hooks/useOeeDashboard.ts:160-238,279-407,429-552,555-608,622-741`
- Skala/mapping: `src/domain/entities/MqttContracts.ts:9`, `src/domain/services/OeeCalculator.ts:25,54-85`, `src/application/dto/telemetry.dto.ts:85-134,211-267`, `src/infrastructure/adapters/BackendMachineRepository.ts:27-30,32-78,125-179,334-373`
- HTTP/WS: `src/infrastructure/api/httpClient.ts:26-58`, `src/infrastructure/api/oeeApiClient.ts:35-94,144-249`, `src/infrastructure/realtime/telemetryWsClient.ts:1-60`
- UI: `src/presentation/pages/DashboardPage.tsx:33-72,145-163,278-287`, `src/presentation/components/HeaderZone.tsx:19-90`, fullscreen 17 file, echarts 6 file
- Config: `tsconfig.json`, `package.json:6-36`, `vite.config.ts:21-35`, `.env` vs `.env.example`, `tests/` (kosong)

## 7. Status eksekusi refactoring (23 Sep 2026, berurutan, semua lolos `tsc --noEmit` + `pnpm build`)

> 63 files changed, +414/−3510, `src/` 103 → 84 file, `any` 12 → 0.

1. **P0 N1–N3**: `cyc` ×10 → ×100 (`BackendMachineRepository:65`, `useOeeDashboard:345`, fallback `90` → `900`); field `a` ditambahkan di WS mapping; `OeeCalculator.calculate` fallback ISO-22400 + `!= null` (wire 0 valid); TEEP dihitung dari utilisasi kalender (`shift/1440`).
2. **P0 N4–N5**: `TelemetryWsClient` reconnect backoff (1s→30s) + cleanup `onmessage/onclose/onerror`; frame buffered dibuang di gateway + guard `isLiveTelemetryFrame` di hook; DTO frame: `good` fallback `tot−rej`, `totalOee` skala `/100` untuk `oee_x100`, coerce string via `toFiniteNumber`.
3. **P0 N+1**: `getAllMachines` satu ronde `Promise.all` (`buildOneSnapshot`); `getMachineById` jalur single-machine (registry + snapshot + suplemental 1 device).
4. **P1 token/DI**: port `IAuthTokenStorage` + `AuthTokenStorageAdapter` (satu kunci `oee_api_token`); `httpClient` + `OeeHttpAuthGateway` (injectable) + `Container.authTokenStorage`; `BackendAlarmRepository` depend `ITelemetryRepository` (bukan konkret).
5. **P1 contract**: `updateStatusFilter` + `statusFilter` mutable dihapus; `ListWorkOrdersUseCase.complete` guard `Number.isFinite` + `woId` required. Casing `finalRejectCount` camelCase **benar** per `docs/specs/backend-gaps.md` (tidak diubah).
6. **P1 layering**: `ThemeProvider` via `useDiContainer()` + `IThemeStoragePort` (tambah `applyResolvedTheme?` opsional di port); siklus barrel diputus — dihapus: `src/types.ts`, `application/hooks/useTheme.ts`, `infrastructure/di/DiContext.tsx` (+ baris barrel), `infrastructure/adapters/LocalStorageThemeAdapter.ts`.
7. **P1 unifikasi**: `toFiniteNumber` 1 kanonis (`LiveState.ts`); `ALL_DOWNTIME_CATEGORIES` di domain; `ShiftTimeline` + optimistik `logDowntime` pakai `isPlannedDowntimeCategory`.
8. **P1 error UX**: `acknowledgeAlarm`/`resolveAlarm` via `runProtected`; boot-401 buka `AuthPinModal`; `openAuthModal` baru; `loginWithPin` reload fleet; layar error dapat tombol "Login operator" + modal.
9. **P1 http**: `Content-Type` hanya saat ada body; parse-error → `BackendHttpError(INVALID_RESPONSE)` (bukan `null as T`).
10. **Tipe**: `any` 12 → 0 (formatter echarts pakai tipe asli `TooltipComponentFormatterCallbackParams`/`DefaultLabelFormatterCallbackParams` + guard `Array.isArray`; `HeaderZone`/`TrendZone` fallback typed penuh; `MqttEdgeInspectorModal` generic).
11. **Dead code**: 15 panel/echarts mati + 2 use-case mati (`GetLiveState`, `SendDeviceCommand`) dihapus; barrel + `ARCHITECTURE.md` diselaraskan.
12. **Deps**: `express`, `@google/genai`, `dotenv`, `motion`, `@types/express` dihapus (0 import; lockfile regen via `pnpm install --lockfile-only`).
13. **Hygiene**: 36 `<button>` dapat `type="button"`; `useFullscreen` abaikan Ctrl/Cmd/Alt + `select`/`contenteditable`; `noUnusedLocals`+`noUnusedParameters` aktif dan 15 temuan dibersihkan (termasuk dead `mapLiveStateToMachineStatus` di `GetHourlyTrendsUseCase`).

**Ditunda jujur (P2):** full `strict` + `noUncheckedIndexedAccess` → 50 error tersisa, terbesar di `InMemoryMachineRepository` (22, tipe seed longgar) — butuh perbaikan semantik data simulasi, bukan cast massal. `tests/` masih kosong (vitest belum dipasang). `.audit-micro` 10px adalah trade-off responsif yang terdokumentasi di komentar CSS (bukan pelanggaran). God Hook `useOeeDashboard` belum dipecah (perubahan terbesar, disarankan sebagai PR tersendiri).

## 8. Test awal (24 Sep 2026) — `tests/` tidak lagi kosong

- Vitest 5 dipasang (`pnpm add -D vitest`, skrip `test: vitest run`). 6 file, 31 test, semua hijau: DTO `live-state` (FSM normalize, snake/camel, string numerik, unknown→UNCONFIGURED, list non-array), DTO `telemetry` (nested/flat mapping, skala /100, `good=tot−rej`, coerce string, `[CATEGORY]` parse, `isLiveTelemetryFrame`), DTO `work-order` (envelope, status→PENDING, shift plan), `OeeCalculator` (wire x100, wire-0 valid, fallback ISO-22400, TEEP), `BatchQr` (katalog/mesin/JSON/key=value + error ramah operator), `endpoints` (path + encode). Fixture bersama di `tests/helpers.ts`. `tsc --noEmit` tetap bersih (test ikut ter-typecheck).

## 9. Full strict (24 Sep 2026) — 50 → 0 error

- `tsconfig`: `strict` + `noUncheckedIndexedAccess` + `noFallthroughCasesInSwitch` aktif (bersama `noUnusedLocals/Parameters` dari langkah 13).
- Perbaikan jujur tanpa `!` massal: guard `find`/`findIndex` di `InMemory*` (throw eksplisit), `??` untuk grup regex (`BatchQr`, `ShiftTimeline`, `PasXProgressStrip`, `telemetry.dto`, `EChartsOeeTrend`), guard `machineList[0]`/`STEPS[i±1]`/`STEP_ICONS[i]`/`QR_*_CATALOG[0]`, fallback typed di `TrendZone`.
- Verifikasi: `tsc --noEmit` 0 error, `pnpm test` 31/31, `pnpm build` lolos.

## 10. Pecah God Hook (24 Sep 2026) — `useOeeDashboard` 841 → komposisi 333 + 8 hook fokus

- Baru di `src/application/hooks/`: `useAuthSession` (PIN + `runProtected` + replay + `notifyUnauthorized`), `useMachinesQuery` (fleet, seleksi, alarms, loading/retry, boot-401), `useSupplementalSync` (downtime/trend/labelable), `useTelemetrySubscription` (WS, stateless), `useSimulationTicker` (ticker 3,5s, stateless), `useMachineActions` (status/downtime/reject/alarm/MQTT), `useDeviceRegistry` (registry + bind/unbind), `useWorkOrders` (lifecycle WO + modal), `useDashboardUi` (view mode, simulasi, TEEP, modal).
- `UseOeeDashboardReturn` **identik** (termasuk `isDeviceConfigModalOpen`/`isProductionSetupModalOpen` yang sempat tertinggal dan dikembalikan); `DashboardPage` tanpa perubahan.
- Verifikasi: `tsc --noEmit` (strict) 0 error, `pnpm test` 31/31, `pnpm build` lolos.

## 11. Lint tanpa typescript-eslint (24 Sep 2026) — diblokir TS 7, diganti jujur

- `typescript-eslint@8.70` menolak berjalan di TS 7.0 (blokir upstream, issue #10940) → paket dihapus lagi agar tidak jadi dead dep; tidak ada `eslint.config.js`.
- Pengganti: skrip `lint:arch` (grep gate di `package.json`, dijalankan via `lint = tsc --noEmit && pnpm lint:arch`): domain zero-IO, application inward-only, presentation tanpa adapter IO langsung, `no-explicit-any` di `src/`+`tests/`. Lolos.
- Audit manual `exhaustive-deps` untuk 3 disable yatim: `PasXProgressStrip` diperbaiki (deps `[machine, windowMin]`, disable dihapus); `BatchQrScannerModal` + `MqttEdgeInspectorModal` dipertahankan dengan komentar DISENGAJA (reset-on-open / sync-on-device-change agar pulse telemetri tak menimpa input user).

## 12. Badge data parsial (24 Sep 2026) — N11 tertutup sebagian

- `useSupplementalSync` kini menyimpan `supplementalError` (kosong saat sukses, pesan saat gagal) selain `console.error`; diekspos via `useOeeDashboard.supplementalError`.
- `TrendZone` menerima `dataWarning?` opsional dan merender badge `role="status"` ("Data parsial — …") di header saat suplemen gagal; `DashboardPage` meneruskan `dashboard.supplementalError`.
- Batasan jujur: kegagalan per-device di dalam `BackendAlarmRepository`/`BackendMachineRepository` (catch → `[]`) belum bisa dibedakan dari data kosong — butuh perubahan signature repository, ditunda.
- Verifikasi: `pnpm lint` + 31 test + `pnpm build` lolos.
