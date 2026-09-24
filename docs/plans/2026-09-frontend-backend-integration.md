# Rencana Penyesuaian Integrasi Frontend ↔ Backend IIoT OEE

## Summary

Perbaiki backend lane agar benar-benar mengikuti kontrak `API_DOCUMENTATION.md`: mapping DTO REST/WS benar, semua command memakai `deviceId`, data realtime tidak salah skala, dan operasi kontrol dilindungi login PIN operator. Untuk backend mode, modal log event tidak boleh membuat mutasi lokal palsu; data downtime/reject tetap berasal dari telemetry/backend, dengan kemampuan label downtime aktif jika ID event tersedia.

## Key Changes

- Tambahkan mapper DTO eksplisit untuk:
  - `work_order.resolve`: `wo_id/product_name/shift_plan` → `woId/productName/shiftPlan`.
  - telemetry hourly/history, downtime events, operational events: dukung snake_case dan envelope `{data, meta}`.
  - WS lifecycle events: `machine_id/device_id/data.wo_id` → domain camelCase.
- Betulkan pemakaian identifier:
  - Semua endpoint `/telemetry/:device_id`, `/downtime-events/:device_id`, `/devices/:device_id/command`, dan dispatch WO memakai `machine.deviceId`.
  - `currentMachineId` tetap machine ID untuk state/UI selection.
  - `BackendMachineRepository` resolve `machineId → deviceId` sebelum mengirim command.
- Betulkan skala metric realtime:
  - WS `availability/performance/quality/total_oee` diperlakukan sebagai persen dari backend.
  - Hindari perkalian `* 100` ganda saat menulis `machine.telemetry`.
- Tambahkan alur auth operator:
  - Extend `IAuthGateway.loginWithPin` agar menyimpan token dan mengembalikan metadata operator dari response backend.
  - Tambahkan state/session auth di application/presentation.
  - Saat backend mode dan user menjalankan command kontrol/dispatch/label downtime, tampilkan PIN gate jika token belum ada atau command mendapat `401`.
  - Token tetap disimpan di `localStorage` key `oee_api_token`; `VITE_API_TOKEN` tetap fallback untuk deployment kiosk.
- Sesuaikan Log Floor Event di backend mode:
  - Jangan lagi melakukan update downtime/reject lokal.
  - Untuk downtime, tampilkan daftar downtime aktif/unlabeled dari backend jika tersedia dan kirim `POST /api/v1/downtime-events/:id/reason`.
  - Untuk reject/scrap, tampilkan sebagai read-only/disabled dengan pesan ringkas bahwa reject count berasal dari telemetry dan final scrap direkonsiliasi saat complete WO.

## Public Interfaces / Types

- Update `WorkOrderResolveResult` mapper, bukan kontrak backend.
- Update `IAuthGateway.loginWithPin` return type menjadi `{ token, expiresIn, operator }`, dengan `operator: { id, username, role, lineId }`.
- Tambahkan type frontend untuk `AuthSession` dan normalized `WsLifecycleEvent`.
- Tambahkan metode telemetry repository untuk mengambil downtime yang bisa dilabeli dengan query `active_only/unlabeled_only` jika belum cukup dari method existing.

## Test Plan

- `pnpm lint` harus lolos.
- Unit/mapper tests:
  - Resolve WO snake_case menjadi domain camelCase lengkap.
  - WS telemetry persen tidak dikali dua kali.
  - WS lifecycle `WORK_ORDER_CANCELLED` membaca `data.wo_id`.
  - Downtime/operational/telemetry envelope dan plain array sama-sama terbaca.
- Integration-style mocked fetch tests:
  - Status command dari machine ID `CNC-*` memanggil `/api/v1/devices/STM32-*/command`.
  - Supplemental trends/downtime memakai `deviceId`, bukan `machineId`.
  - `401` pada command memicu auth-required state, lalu retry setelah login PIN memakai Bearer token.
- Manual smoke:
  - `VITE_USE_BACKEND=false` tetap menjalankan simulasi lama.
  - `VITE_USE_BACKEND=true` initial load membaca live-state, machines, telemetry hourly, WS updates, dan command butuh PIN/token.

## Assumptions

- Tidak mengubah backend contract pada tahap ini.
- Operator login PIN cukup sebagai gate untuk semua mutasi yang sudah diwajibkan backend.
- Backend mode tidak melakukan local-only mutation untuk downtime/reject; hanya membaca telemetry dan melabeli downtime event yang sudah ada.
- UI auth dibuat ringan dan terintegrasi ke flow command, bukan halaman login penuh.
