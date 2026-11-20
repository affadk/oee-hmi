# ADR-0002 — Auth Password + Station Context + UI Ber-gate Capability

**Status:** Accepted
**Tanggal:** 2026-11-20
**Acceptance:** pemilik repo, directive "mulai implementasikan" (2026-11-20)
**Unit terkait:** `specs/001-hmi-data-transfer-refresh`
**Acuan kontrak:** API_DOCUMENTATION §L (020/ADR-0012 backend, spec 043/044, §3.4 access-control, §6D)
**Menggantikan (sisi klien):** pola login PIN (`POST /auth/operator-pin`) — dihapus total oleh backend (404). Bukan ADR repo ini yang di-supersede; keputusan backend dirujuk: `iiot-oee/apps/backend/decisions/0012-username-password-auth-and-env-switches.md`, `0023-admin-hmi-login-separation.md`.

## Konteks

Klien masih memakai `AuthPinModal` (PIN numerik 8 digit) + `/auth/operator-pin` yang sudah 404. Backend kini: kredensial username (`operator_id`) + password PBKDF2; `station_id` konteks kiosk (bukan input manual, harus deviceId terdaftar); throttle login 5/60s per `<ip>:<station_id>` dengan `Retry-After` (backend satu-satunya sumber throttle — klien dilarang lockout paralel); gerbang `must_change_password` (403 `PASSWORD_ROTATION_REQUIRED` di semua rute terproteksi kecuali `/auth/me` + `/auth/password/change`); JWT TTL 900s sliding refresh; `authz_version` naik → token lama `401 AUTHZ_STALE`; role = string bebas dengan otoritas `effectiveRoles`; `GET /auth/me` memproyeksikan capability `allow/deny/unknown`; `GET /system/access-mode` menentukan read-only vs read-write per kanal (tunnel = observasi saja).

## Keputusan

1. **Login HMI hanya via `POST /api/v1/auth/login`** `{operator_id, password, station_id?}`. Modal auth beralih ke password (gaya visual dipertahankan; ini satu-satunya perubahan presentasi yang diizinkan unit ini).
2. **Station context diturunkan klien**, urutan: explicit → query param → store (localStorage adapter eksisting) → registry devices → env. Hanya `deviceId` terdaftar yang dikirim; tak ada → kosong (throttle `<ip>:default`). Tidak pernah fallback ke `machineId`.
3. **Tanpa lockout/throttle paralel di klien.** `429` → tampilkan countdown `Retry-After`; submit dinonaktifkan selama jendela.
4. **Gerbang rotasi password**: flag `must_change_password` dari login ATAU `403 PASSWORD_ROTATION_REQUIRED` dari rute mana pun → dialog ganti password (`{current_password, new_password}` kanonis). Sukses → login ulang otomatis (token lama pasti `AUTHZ_STALE`).
5. **Refresh sliding proaktif**: pre-action bila `exp` < 120s (eksisting) + timer berkala ≤ 5 menit selama sesi aktif. `401 AUTHZ_STALE` / subjek nonaktif → logout paksa + modal login (bukan loop retry). Refresh hanya dicoba di kanal LAN.
6. **UI aksi terproteksi di-gate capability `GET /auth/me`** (`<domain>.<action>`): `allow` → aktif; `deny`/`unknown` → nonaktif (fail-closed) dengan alasan. Role ditampilkan apa adanya (string bebas), bukan enum.
7. **`GET /system/access-mode`**: `mutations_allowed=false` → mode read-only: semua mutasi dinonaktifkan + penanda memakai elemen UI eksisting.

## Alternatif yang Dipertimbangkan

- **Pertahankan adapter PIN + fallback** — ditolak: endpoint 404 permanen (PIN dihapus total, bukan deprecated).
- **Enum role statis untuk gating** — ditolak: otorisasi backend ABAC-first (024); `operators.role` hanya label; enum akan salah gate saat policy dinamis berubah.
- **Lockout klien setelah N gagal** — ditolak: kontrak eksplisit melarang (throttle backend otoritatif; lockout paralel = UX rusak + audit ganda).
- **Simpan password di store** — ditolak: hanya token JWT yang persist (adapter eksisting); password tidak pernah disimpan/dilog.

## Konsekuensi

- Positif: HMI bisa login lagi terhadap backend hidup; hak aksi sinkron dengan policy dinamis tanpa redeploy; sesi idle panjang tidak mati mendadak; tunnel otomatis read-only.
- Negatif/biaya: ketergantungan pada `/auth/me` (no-store) tiap login/refresh; fail-closed `unknown` bisa menyembunyikan aksi bila katalog backend belum lengkap — mitigasi: tampilkan alasan + fallback login ulang.
- Keamanan: token tetap di `AuthTokenStorageAdapter` (localStorage) — risiko XSS inheren accepted (lihat design.md §Security); password tidak persist; `station_id` bukan kredensial.
