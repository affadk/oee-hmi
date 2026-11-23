# ADR-0004 — Separasi Surface: HMI Kiosk / Station / Andon / Admin-Panel

**Status:** Accepted
**Acceptance:** pemilik repo, 2026-11-20 (jawaban eksplisit acceptance)
**Tanggal:** 2026-11-20
**Amandemen:** 2026-11-23 (FAT-248/260, lihat §A)
**Unit terkait:** `specs/002-hmi-station-surfaces`
**Acuan:** Wikipedia *User interface* §Terminology (HMI lokal satu mesin vs operator interface multi-mesin); API_DOCUMENTATION §C.7/8 (4-zone QR), §C.4 (dispatch auth), §L (login), §B/§F (public read); preseden v1 `iiot-oee/apps/frontend` (StationPage/AndonPage/SupervisorPage/MultiZoneWizardModal); directive produk pemilik repo 2026-11-20.

## Konteks

Repo v2 menggabung semua peran dalam satu shell (`/overview` live + `/audit` historis) tanpa gate surface: switcher fleet terbuka di kiosk, historical hidup di HMI, QR backend lane hanya resolve WO existing. Directive produk: HMI = live OEE per device + start via 4 QR; Station = login kredensial admin-set + fleet kartu → live; historical = admin-panel. Definisi standar HMI mendukung pemisahan ini (HMI lokal per mesin; operator interface multi-mesin via host). v1 sudah memiliki bentuk surface tersebut.

## Keputusan

1. **Empat surface dengan peran tegas**: HMI kiosk (single-device terikat station context, sesi operator, start 4 QR), Station (login + fleet RUNNING + kartu → live OEE), Andon (agregat publik read-only, tunnel-safe), Admin-panel (historical/master/IAM/export — di luar repo HMI bila OQ-105 memutuskan demikian).
2. **Mode surface = konteks deployment**, bukan toggle in-app di kiosk: binding `VITE_STATION_ID`/query/store tervalidasi → kiosk; tanpa binding → station/andon sesuai sesi. Satu sumber station context melayani throttle login (unit 001) DAN lock device.
3. **QR = data job, bukan autentikasi**: alur kiosk = sesi operator (unit 001) → validate-zone per zona → initiate-from-zones → dispatch (Bearer). OID QR ≠ subjek JWT **diizinkan dengan peringatan + konfirmasi eksplisit** (backend atribusi ganda by design: WO.operator_id dari zona, audit aktor dari sesi; OQ-102 resolved 2026-11-20 dari kode backend).
4. **Historical keluar dari HMI**: `/audit` v2 keluar dari nav HMI pada unit 002 (OQ-103 resolved: admin-panel v1 Supervisor **sudah live** di LAN, tanpa vacuum); admin-panel = lineage `SupervisorPage` v1 (OQ-105 resolved) — v2 tidak membangun fitur historical baru.
5. **Reuse layout live monitor v2** untuk kiosk dan detail Station (freeze tetap berlaku); reuse stepper 4 zona v2 + pola wizard v1; tanpa dependensi baru.
6. **Urutan**: unit 001 (data transfer) Fase 1–2 prasyarat; unit 002 menyusul setelah ADR ini Accepted (OQ-101..105 sudah resolved 2026-11-20 dari backend hidup).

## Alternatif yang Dipertimbangkan

- **Satu SPA semua peran (kondisi kini)** — ditolak: peran lantai vs supervisory vs manajemen tercampur; kiosk bisa pindah device sembarangan; historical membebani HMI; bertentangan dengan definisi HMI dan directive produk.
- **QR sebagai autentikasi operator (tanpa login)** — ditolak: kontrak dispatch wajib Bearer OPERATOR+; audit aktor = subjek JWT; QR OID mudah dipalsukan/dipinjam.
- **Bangun admin-panel baru di v2** — ditolak dulu (YAGNI): v1 SupervisorPage sudah hub history/audit/export; keputusan rumah = OQ-105.
- **Lock kiosk via toggle UI** — ditolak: kiosk lantai harus terkunci by deployment, bukan pilihan operator.

## Konsekuensi

- Positif: peran jelas sesuai standar industri; kiosk aman & fokus; station supervisory terotentikasi; HMI ringan (tanpa historical); reuse maksimal v1+v2.
- Negatif/biaya: empat surface = empat konfigurasi deployment; sesi operator kiosk wajib (login per shift) menambah langkah dibanding QR-saja; pemindahan `/audit` butuh sequencing agar tidak ada vacuum historical sebelum admin-panel siap (OQ-103).

---

## §A — Amandemen 2026-11-23 (FAT-248 / FAT-252 / FAT-260)

**Status amandemen:** Accepted (directive produk pemilik repo 2026-11-23; opsi (a) untuk FAT-248/249/260, opsi (b) untuk FAT-252).

**Konteks:** v2 menghapus gerbang login password operator di HMI kiosk. Operator shopfloor tidak punya akun per-user; identitas operator sudah datang dari badge OID di 4-zone QR (spec 043) sehingga sesi login = friksi tanpa nilai. Aksi sensitif tidak boleh dari HMI.

**Keputusan (menggantikan sebagian §Keputusan butir 3–4 dan §Konsekuensi negatif "sesi operator kiosk wajib"):**

1. **HMI tanpa login operator.** Kiosk live tidak menuntut sesi operator. Start via tombol fisik + 4 QR; logging/atribusi dari badge OID zona (bukan JWT sesi). Sesi login tetap ada di kode (`useAuthSession`) namun dimatikan pada deployment HMI (`loginEnabled=false` di `DashboardPage`); jalur login password tidak dihapus agar surface yang membutuhkan tetap dapat mengaktifkan kembali.

2. **Station = identitas terminal HMI (menggantikan "Station login-first").** "Station" bukan surface login-first dengan fleet multi-mesin, melainkan terminal HMI terikat satu mesin (`VITE_STATION_ID`/query tervalidasi registry), dikomisionkan sekali, diidentifikasi lewat kredensial terminal (broker DynSec per-station, FR-043-25). Fleet multi-mesin di HMI dihapus — agregat fleet ada di Andon (read-only) dan admin-panel.

3. **Aksi sensitif → admin-panel (FAT-252, opsi b).** HMI login-off tidak dapat: batalkan WO (`work_order.cancel`), ubah konfigurasi mesin (`machine.update`/`device.update`). Gate `canMutate` menolak kunci sensitif saat tanpa sesi (`authenticated:false`) dengan tombol nonaktif + alasan "tersedia di admin-panel", bukan 403 buta. Daftar aksi sensitif di `SENSITIVE_KEYS` (`src/application/capabilityGate.ts`). Start/stop/logging tetap tanpa login.

4. **Otorisasi backend tidak berubah.** RBAC backend tetap per-rute; amandemen hanya menggeser *di mana* aksi sensitif diekspos di UI (HMI → admin-panel), bukan melonggarkan backend. Dispatch/ack shadow-mode (operatorAuth) tetap.

**Konsekuensi (memperbarui §Konsekuensi):**
- HMI tidak lagi menuntut login password; modul auth tetap untuk admin-panel/station yang memerlukan.
- Surface "Station" kehilangan peran login-first + fleet; definisi terminal terikat-mesin menggantikan.
- Aksi sensitif hanya lewat admin-panel (login Spec 044).
- Sesi operator shift hilang sebagai konsep operasional HMI; atribusi via badge OID + audit backend.
- Netral: unit 001 tidak berubah arah; kontrak backend tidak diubah; gap guard initiate-from-zones dieskalasi via probe (GAP-B04/B05).
