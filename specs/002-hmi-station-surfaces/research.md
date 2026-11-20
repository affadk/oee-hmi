# Research — Tinjauan Workflow HMI / Station / Admin-Panel (unit 002)

> Bukti & analisa sebelum keputusan. Bukan requirement (otoritas: `spec.md` unit ini).
> Tanggal: 2026-11-20. Pemicu: directive produk pemilik repo — HMI = live OEE per device + start produksi via scan 4 QR; Station = login kredensial admin-set + fleet kartu device → live OEE; historical = admin-panel.

## 1. Pengertian HMI (sumber eksternal)

Wikipedia, *User interface* §Terminology (redirect "Human–machine interface", diakses 2026-11-20):

> "A human–machine interface (HMI) is typically **local to one machine or piece of equipment**, and is the interface method between the human and the equipment/machine. An **operator interface**, on the other hand, is the interface method by which **multiple pieces of equipment, linked by a host control system**, are accessed or controlled."

Kesimpulan: usulan produk **sesuai definisi standar**: HMI = antarmuka lokal satu mesin (kiosk per device); Station = operator interface/supervisory multi-mesin via host (backend). Andon TV = display publik (bukan HMI kontrol). Admin-panel = lapisan manajemen/historis, terpisah dari operasi lantai.

## 2. Preseden repo v1 (`iiot-oee/apps/frontend`) — workflow usulan SUDAH ada bentuknya

| Surface v1 | Perilaku teramati | Padanan usulan |
|---|---|---|
| `StationPage.tsx` | live per-device + `DeviceSwitcher` + `LoginModal` gate aksi ("Semua aksi perlu login & jaringan pabrik") + prop `explicitDeviceId` (binding kiosk) + `useIngress` (deteksi tunnel) + `useInactivityTimer` + `useJobWatchdog` | HMI kiosk (explicitDeviceId) & Station (switcher) |
| `AndonPage.tsx` | KPI plant agregat (AVG OEE, output, good, reject), read-only | Andon publik |
| `SupervisorPage.tsx` | hub: History & Export (`/supervisor/history`), Audit (`/supervisor/audit`), WO management/cancel | **admin-panel** (historical di sini, bukan HMI) |
| `MultiZoneWizardModal` (+test) | wizard 4 zona QR → `POST /validate-zone` per zona → `POST /initiate-from-zones` | start produksi operator via 4 QR |

Artinya: usulan bukan konsep baru — ia **model surface v1** yang belum dipindah ke v2 (repo ini). v2 kini menggabung semuanya: `/overview` (live monitor) + `/audit` (historis) dalam satu shell `DashboardPage`, tanpa gate login surface, tanpa lock kiosk.

## 3. Kontrak backend untuk workflow usulan (API_DOCUMENTATION Nov 2026)

| Langkah usulan | Endpoint | Catatan kontrak |
|---|---|---|
| Operator scan 4 QR (product/machine/operator/shift) | `POST /work-orders/validate-zone` (§C.7) preflight per zona; `POST /work-orders/initiate-from-zones` (§C.8) | Master **tidak** auto-upsert; `CT` harus cocok `products.std_cycle_time_sec` ±0.01s; `DATE` wajib; shift window harus cocok instance; `wo_id` dialokasikan per mesin+shift date. Error: `MASTER_ID_REQUIRED/MASTER_NOT_FOUND/CT_MISMATCH/SHIFT_WINDOW_MISMATCH/INVALID_SHIFT_INSTANCE`, 409, 503 |
| Mulai logging/produksi | `POST /work-orders/:wo_id/dispatch` (§C.4) | **Bearer OPERATOR/SUPERVISOR/ADMIN + LAN**; publish `SET_JOB_CONFIG` QoS1 + watchdog 15s; 503 `DEVICE_OFFLINE`; 409 memuat `active_wo_id` |
| Station login kredensial admin-set | `POST /auth/login` (§L); akun dibuat admin via `POST /operators` (§H) | station_id konteks kiosk; throttle backend; `must_change_password` gate |
| Station lihat fleet berjalan | `GET /live-state` + `GET /machines` (§B/§F) | **public read** (Andon-safe); filter RUNNING sisi klien |
| Kartu device → live OEE | `GET /live-state/:deviceId` + WS `TELEMETRY_UPDATE` | layout live monitor v2 dipakai ulang |
| Historical | `GET /telemetry/*`, `/oee/*`, `/machines/:id/status-history`, export (§K/§Q/§F.8) | semua tersedia backend; konsumen = admin-panel |

**Temuan kritis:**
1. **QR ≠ autentikasi.** `dispatch` wajib Bearer; zona operator QR (`OID`) adalah data job, bukan kredensial. Aktor audit = subjek JWT, bukan OID QR. Maka kiosk tetap butuh sesi operator (login password + station_id) — scan 4 QR terjadi **di dalam sesi**, bukan pengganti login.
2. **Guard `validate-zone`/`initiate-from-zones` tidak terdokumentasi** di tabel auth §7H (hanya resolve/dispatch/complete/cancel yang disebut). v1 memanggilnya; perlu probe apakah LAN-open atau Bearer (GAP-B04). Apa pun hasilnya, dispatch tetap butuh sesi.
3. **Mismatch OID QR vs operator sesi** tidak diatur kontrak → aturan produk diperlukan (OQ-102); default usulan: tolak di klien bila beda.
4. **v2 belum wire `initiate-from-zones`**: lane backend QR v2 = cocokkan hasil pindaian zona ke daftar WO pending → `resolve` → dispatch (audit B4; `BackendReviewStep` menampilkan WO pindaan); stepper 4 zona ada tetapi katalog master statis/simulasi. Pembuatan WO dari 4 zona (initiate) belum ada di v2. Gap GAP-F17.

## 4. Pemetaan ke repo v2 (kondisi kini)

| Usulan | Kondisi v2 | Gap |
|---|---|---|
| HMI kiosk single-device | `/overview` fullscreen per mesin terpilih; switcher fleet terbuka; tanpa binding kiosk | GAP-F18 |
| Station login + fleet kartu | tanpa gate login surface; fleet via switcher, bukan kartu fleet running | GAP-F19 |
| Start via 4 QR → initiate | stepper ada; backend lane cocokkan zona ke WO pending → resolve → dispatch, bukan initiate-from-zones | GAP-F17 |
| Historical di admin-panel | `/audit` + export + LogEventModal histori hidup di HMI v2 | GAP-F20 |
| Andon publik | `/overview` fullscreen bisa peran ini (public read backend) | ada, perlu penegasan mode |

## 5. Rekomendasi tinjauan

1. **Adopsi workflow** (sesuai definisi HMI standar + kontrak backend + preseden v1). Empat surface: HMI kiosk, Station, Andon, Admin-panel.
2. **Unit 001 tetap prasyarat** (auth password/WS/DTO kanonis) — semua surface memakainya; urutan 001 Fase 1 → 002.
3. **Reuse, jangan bangun ulang**: stepper 4 zona v2 + pola wizard v1; layout live monitor v2 untuk kiosk & detail Station (freeze tetap); pola hub Supervisor v1 untuk admin-panel.
4. **Kiosk binding = station context** (jawaban OQ-001 unit 001: `VITE_STATION_ID`) — satu env melayani login throttle DAN lock device kiosk.
5. **Historical keluar dari HMI** bertahap sesuai OQ-103 (nasib `/audit`), bukan dihapus diam-diam.
6. Keputusan surface separation = ADR-0004 (Proposed); spec unit 002 CLARIFYING sampai OQ-101..105 terjawab.

## 6. Tinjauan backend HIDUP (2026-11-20, probe + kode) — dasar jawaban OQ

Topologi terverifikasi (`docker/podman-compose.yml:160-163`, `docker/nginx/nginx.conf`): host **8080 → container 80 (vhost LAN read-write)**; host **8081 loopback → container 8080 (vhost remote-tunnel read-only)**; `oee.fadik.web.id` = Cloudflare Tunnel ke vhost remote. Frontend yang tersaji di LAN 8080 = **v1** (`index.html` title "IIoT OEE Dashboard & HMI"; v2 repo ini = "Single-Page OEE Dashboard").

| Probe | Hasil | Makna |
|---|---|---|
| `GET :8080/health`, `:8081/health`, tunnel `/health` | 200 ok, db connected, ws_clients 2 | stack hidup satu daemon |
| `GET :8080/` | title v1 | **v1 frontend live = Station/Andon/Supervisor(admin) sudah deployed** |
| `GET tunnel/` | 404 | vhost remote tidak menyajikan SPA (API-only) |
| `GET tunnel/docs/` | **200** | dev override `remote-docs-dev/dev.conf` ter-mount di deployment publik ( seharunya prod tidak mount) |
| `POST :8080/work-orders/validate-zone` noauth | 401 | guard auth aktif di LAN |
| `POST tunnel/work-orders/validate-zone` noauth | 401 | reached Fastify (bukan nginx block) |
| `POST tunnel/devices/STM32-OEE-01/command` noauth | **403** | aktuasi remote diblok (backend ingress guard, bukan nginx) |
| `POST tunnel/auth/login` noauth | 401 | login reachable via tunnel |
| `GET :8080/api/v1/live-state` noauth | 200 array | fleet read publik (Andon-safe) terkonfirmasi |

Kode guard (`apps/backend/src/modules/production/routes/work-orders.ts:272-275, 308-311`): `validate-zone` DAN `initiate-from-zones` = `preHandler [enforceSubnetOrigin, authorize("dispatch","work_order")]` → **Bearer OPERATOR+ LAN wajib** (GAP-B04 tertutup untuk klien; tabel docs §7H tetap perlu dilengkapi backend).

Atribusi operator (`services/multi-zone-work-order.ts:326,404,466-467`): operator WO di-resolve strict dari zona QR (`resolveOperatorStrict`, tanpa auto-upsert); audit dispatch mencatat **subjek JWT sesi** terpisah (`triggerSource: OPERATOR_HMI`, description menyebut username sesi). **Tidak ada cross-check OID QR vs operator sesi** → mismatch diizinkan backend dengan atribusi ganda (GAP-B05 tertutup; aturan UX = OQ-102).

Auto-lock preseden v1: `hooks/useInactivityTimer.ts` + `config/env.ts:25` → `VITE_INACTIVITY_TIMEOUT_MS ?? 300000` = **default 5 menit**, env-configurable, pause saat tab hidden.

**Temuan keamanan deployment (GAP-B06, eskalasi pemilik):** hanya `podman-compose.dev.yml:162-164` yang me-mount `tunnel.d-dev/full-api.conf` ("expose the backend through a Cloudflare Tunnel **without the read-only restrictions**") + `remote-docs-dev/dev.conf`. Deployment publik `oee.fadik.web.id` berperilaku dev: `/docs` 200 publik + vhost full-api (POST login/validate-zone reachable; aktuasi tetap 403 oleh backend). Docs §1/§D mengklaim nginx 403 untuk aktuasi tunnel — kenyataannya enforcement ada di backend (`X-Ingress-Source`); docs basi. Rekomendasi: jalankan compose produksi untuk tunnel publik (lepas mount dev), atau batasi `/docs` + full-api di belakang Cloudflare Access; keputusan di pemilik backend/deploy, bukan klien.
