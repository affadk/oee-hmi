# Implementation Plan — Spec 001 Pembaruan Data Transfer HMI

**Lifecycle:** PLANNED
**Health:** VALID
**Traces to:** `spec.md` (unit ini)
**Reviewed against:** spec revision 2

> Review rev 2 (2026-11-20): OQ resolved sesuai asumsi plan; strategi/fase tidak berubah.

## 1. Approach

Perombakan **lapisan data transfer saja**, bukan rewrite. Arsitektur hexagonal + dual-lane eksisting dipertahankan; perubahan mengikuti arah dependensi: DTO/adapter (infrastructure) → ports/entities (domain) → hooks (application) → satu modal auth (presentation). Layout live monitor beku (BR-003). Setiap perubahan kontrak wajib punya jejak FR + ADR dan test.

## 2. Implementation Strategy

- **Kontrak dulu, UI belakangan**: endpoints + DTO + gateway diperbaiki dan diuji terhadap payload contoh API docs sebelum hook menyentuhnya.
- **Toleransi transisi**: alias legacy (`avg*`, frame flat) dipertahankan sampai backend hidup terverifikasi kanonis; sunset dicatat di design.md.
- **Test per boundary**: unit test DTO/mapper (pola `tests/` eksisting), test hook dengan collaborator fake, E2E manual terhadap stack docker `iiot-oee` untuk AC integrasi.
- **Tanpa dependensi baru** — semua kebutuhan tertutup stdlib browser + deps terpasang.

## 3. Affected Areas

| Layer | Area | Perubahan |
|---|---|---|
| infrastructure | `api-clients/endpoints.ts`, `oeeApiClient.ts`, `httpClient.ts` | auth login/refresh/change/me/access-mode; command count; ack body; error codes surfaced |
| infrastructure | `dto/telemetry.dto.ts`, `live-state.dto.ts`, `work-order.dto.ts`, `shift.dto.ts` | kanonis `*Pct`, null-preserving, provisional, lifecycle union, PENDING_CLOSE |
| infrastructure | `realtime/telemetryWsClient.ts` | close-code policy, callback reconnect, heartbeat tetap |
| domain | `entities/backend/Device.ts`, `WorkOrder.ts`, `Telemetry.ts`, `LiveState.ts`, `ports/IOeeBackend.ts` | union perintah/status/lifecycle; tipe nullable; port auth baru |
| application | `hooks/useAuthSession.ts`, `useTelemetrySubscription.ts`, `useOeeDashboard.ts`, `useWorkOrders.ts`, `useMachineActions.ts`, `authToken.ts` | station context, rotation gate, refresh timer, FSM merge, resync, capability gate |
| presentation | `modals/AuthPinModal.tsx` saja | PIN → password (visual parity) |
| tidak disentuh | semua pages/zones/panels/gauges live monitor | — (BR-003) |

## 4. Dependencies

- Stack `iiot-oee` hidup (docker: nginx :80, backend :3001, broker, TimescaleDB) untuk E2E.
- ADR-0001/0002/0003 **Accepted** sebelum design final → implementasi (gate konstitusi).
- Jawaban OQ-001/OQ-003 (produk) sebelum fase 1 selesai.

## 5. Sequence / Phases

1. **Fase 1 — Auth & WO (P0, blocking):** FR-001..FR-006, FR-016. Hasil: HMI bisa login dan mengoperasikan WO terhadap backend hidup.
2. **Fase 2 — Realtime & perintah (P1):** FR-009..FR-015. Hasil: live state lengkap tanpa reload; perintah penuh.
3. **Fase 3 — Kontrak data & otorisasi (P2):** FR-007, FR-008, FR-017..FR-020. Hasil: angka kanonis jujur, UI sesuai hak, tunnel read-only.
4. **Verifikasi & dokumen:** E2E semua AC → `verification.md` bukti; update `docs/README.md` + cross-ref `backend-gaps.md`.

Tiap fase selesai = `pnpm lint` + `pnpm test` hijau + AC fase terkait terverifikasi; tidak ada fase dimulai dengan design STALE.

## 6. Risks

| Risiko | Kemungkinan/Dampak | Mitigasi |
|---|---|---|
| Kontrak backend hidup beda dari docs (riwayat G17–G22) | sedang/tinggi | Probe payload nyata per fase sebelum finalisasi DTO; alias transisi |
| Refetch storm dari lifecycle WS (regresi G11-style) | sedang/tinggi | debounce ≤ 2s + dedupe per jenis state; test identitas deps; NFR-001 |
| Loop auth (refresh gagal → modal → refresh gagal) | sedang/tinggi | AUTHZ_STALE → logout paksa sekali; countdown 429; tanpa retry buta |
| Null-propagation merusak komponen eksisting | sedang/sedang | penyisiran pemakai tipe saat perubahan domain; test presentation-related; layout tetap |
| Station context salah → 400 STATION_NOT_FOUND | tinggi/sedang | OQ-001 dijawab dulu; resolver hanya deviceId terdaftar; test |

## 7. Assumptions

- Backend hidup mengikuti API docs Nov 2026 (spec 043/044/045 sudah deployed) — diverifikasi probe fase 1.
- `VITE_USE_BACKEND=true` lane backend adalah target produksi; lane simulasi tetap untuk dev.
- Tidak ada perubahan layout yang diminta produk selama unit ini berjalan.

## 8. Architectural Questions

Sudah dijawab oleh ADR-0001 (strategi realtime), ADR-0002 (auth+capability), ADR-0003 (batas kontrak/null). Status ketiganya **Proposed** — acceptance adalah gate berikutnya.

## 9. Required Decisions

| Keputusan | Pembuat | Sebelum | Status |
|---|---|---|---|
| Acceptance ADR-0001/0002/0003 | pemilik repo (engineering) | design final / implementasi | **terbuka** |
| OQ-001 station context, OQ-003 deployment tunnel | produk | fase 1 selesai | resolved 2026-11-20 (spec §11 rev 2) |
| OQ-002 poll 60s, OQ-004 unknown fail-closed | engineering (design review) | fase 2/3 | resolved 2026-11-20 (spec §11 rev 2) |

## 10. Verification Strategy

- Unit: vitest untuk DTO (dua skema + null), mapper lifecycle, ws close-code, auth gateway (fake fetch), guard WO.
- Integrasi hook: collaborator fake (pola tests eksisting) untuk rotation gate, resync, debounce.
- E2E manual terjadwal terhadap stack hidup: skenario AC-001..AC-019 dicatat di `verification.md` dengan bukti (tangkapan network/log, hasil test).
- Regresi: `pnpm lint` (tsc + arch grep) + `pnpm test` + diff-review komponen layout (harus nol kecuali AuthPinModal).
