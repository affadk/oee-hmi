# Design — Spec 003 Dual-Lane Inisiasi QR

> Kontrak solusi teknis. Turunan spec 003 rev 2 + ADR-0005 (Accepted).
> Gate terpenuhi 2026-11-20: OQ-201..204 resolved pemilik + ADR-0005 Accepted.

**Lifecycle:** DESIGNED
**Health:** VALID
**Traces to:** `spec.md` rev 2 · ADR-0005
**Reviewed against:** spec revision 2

## Architecture

Dua lane satu modal, auto-deteksi dari isi QR; pipa initiate unit 002 dipakai apa adanya:

```
scan kamera ─┬─ badge zona (PID/MID/OID/SID) ─→ parseZoneBadge ─→ draft[zona] ─→ stepper maju
             │                                    4 zona lengkap ─→ PANEL KONFIRMASI ─→ konfirmasi eksplisit
             │                                                         └→ validate-zone 4× ─→ initiate-from-zones
             │                                                              (WO PENDING + dispatch MQTT)
             └─ QR ber-WO ─→ parseQrString ─→ submitWoForPreview (resolve, jalur B)
textfield (hanya WO) ─→ submitWoForPreview; badge zona paste ─→ error arah kamera

initiate/dispatch ─→ ACK WAIT (poll detail WO 2s, cap 20s)
                      ├─ ACTIVE  ─→ sukses + START siap (jobConfig terisi via resync)
                      ├─ ABORTED ─→ error ACK edge
                      └─ timeout ─→ TIMEOUT_UNACKNOWLEDGED + retry idempoten
START fisik ─→ guard jobConfig.workOrder (hanya dari WO ACTIVE) ─→ RUNNING ─→ logging
```

## Components

| Komponen | Tanggung jawab | Trace |
|---|---|---|
| `domain/entities/QrZoneBadge.ts` (baru, pure) | `parseZoneBadge(raw)` → `{zoneType, product?, machine?, operator?, shift?}` cermin `qr-zone-parser.ts`: key wajib + alias (`PRODUCT_ID/MACHINE_ID/OPERATOR_ID/SHIFT_ID/BREAK_AT`), CT>0, `HH:MM`, BREAK int ≥0, TARGET int >0, DATE `YYYY-MM-DD`, overnight, plannedOperatingSec>0. Deteksi zona: SHIFT (START+END+BREAK+TARGET) > MACHINE (MID/MCH/LINE) > OPERATOR (OID/OP) > PRODUCT (PID/CT/NAME); key wajib kurang → error sebut zona+key | FR-001 |
| `domain/entities/BatchQr.ts` | field draft zona jadi nullable (`product/operator/schedule: … \| null`, `machineId: string \| null`) + `shiftDate?: string` di schedule; `targetQty` produk diisi dari TARGET badge shift saat parse. Katalog + `parseQrString` tetap (simulasi + jalur B). `draftFromMachine` hanya dipakai lane simulasi | FR-003/004 |
| `application/qrZones.ts` | `buildZoneStrings(draft, extras)`: nilai badge menang — `extras.line` dari badge mesin, `extras.shiftDate` dari badge shift (tanpa fallback hari-ini bila zona dari scan); draft belum lengkap → tolak (guard FR-003 di pemanggil) | FR-004 |
| `BatchQrScannerModal.tsx` | `handleCameraScan` → `parseZoneBadge` dulu (zona → draft + stepper), gagal → `parseQrString` ber-WO → resolve; draft awal backend = kosong; stepper backend travers 4 zona (bukan PRODUCT→REVIEW); REVIEW = panel konfirmasi 4 zona + tombol konfirmasi eksplisit → `handleInitiateFromZones`; footer: initiate hanya bila lane zona + 4 lengkap, setup hanya bila `scannedWo`; guard MID ≠ mesin terikat saat scan badge mesin; status ACK (menunggu/ACTIVE/ABORTED/timeout+retry) ganti klaim "aktif" pra-ACK | FR-002/003/005 |
| `QrScanInput.tsx` | backend-mode: submit → hanya resolve WO (`submitWoForPreview`); isi terdeteksi badge zona → error "badge zona dipindai via kamera". Placeholder WO-only di backend | FR-002 |
| `application/hooks/useWorkOrderAckWait.ts` (baru) | `waitForAck(woId)`: poll `listWorkOrdersUseCase.detail(woId)` interval 2s, cap 20s; berhenti ACTIVE/ABORTED/timeout; return `{status:'ACTIVE'\|'ABORTED'\|'TIMEOUT', detail?}`; cleanup saat unmount; bukan loop permanen | FR-005/006, NFR-002 |
| `useWorkOrders.ts` | `initiateFromZones` + `dispatchWorkOrder`: pasca sukses panggil ACK wait, expose state ACK (`ackWait: {woId, status}`) untuk modal; retry = panggil ulang initiate (idempoten) | FR-005/006 |
| `steps/BackendReviewStep.tsx` | panel konfirmasi: tabel 4 zona nilai badge (PID/CT/NAME, MID/MCH/LINE, OID/OP, SID/DATE/window/BREAK/TARGET) + ringkasan target/CT; tombol "Konfirmasi & Konfigurasi Mesin"; state ACK tampil di sini | FR-005, AC-010 |
| Setup Produksi (jalur B) | pasang state ACK wait yang sama pasca dispatch | FR-006 |

Tidak berubah: `FloorPushButtonsPanel` (guard sudah ACK-aware via `jobConfig` dari WO ACTIVE — `BackendMachineRepository.ts:371`), layout live monitor, ports/endpoints, backend, lane simulasi.

## Domain Model

`BatchDraft` field nullable + `shiftDate`; tipe baru `ParsedZoneBadge` (hasil parser) + `AckWaitStatus` union. Tanpa entitas backend baru; `WorkOrderListItem.status`/`ackedAt` sudah ada.

## Interfaces

- `POST /work-orders/validate-zone` `{zone_type, device_id, raw_string}` — ada (unit 002).
- `POST /work-orders/initiate-from-zones` `{device_id, zones}` — ada; respons `{work_order, dispatch_tx_id, is_idempotent_duplicate}`.
- `GET /work-orders/:wo_id` (detail) — ada; dipakai ACK wait (`status`, `ackedAt`).
- Tanpa endpoint baru; tanpa perubahan kontrak.

## State Transitions

Modal backend: `BUKA(draft kosong) → SCAN zona×4 (draft terisi, stepper maju) → KONFIRMASI(panel 4 zona) → VALIDATE(4×) → INITIATE(PENDING+dispatch) → ACK_WAIT → ACTIVE(sukses+START siap) | ABORTED(error) | TIMEOUT(retry)`.
Jalur B: `SCAN/paste WO → RESOLVE(preview) → SETUP → DISPATCH → ACK_WAIT → ACTIVE → START`.
Batal di panel konfirmasi → tidak ada request initiate; draft tetap untuk koreksi scan ulang.

## Error Handling

- Parse badge gagal → toast zona+key bermasalah (pesan cermin backend), draft tidak berubah.
- MID ≠ mesin terikat → error dini saat scan badge mesin, arah scan ulang.
- Validate zona gagal → error per zona di stepper (kontrak unit 002: MASTER_*/CT_MISMATCH/SHIFT_*/409/503).
- ACK timeout → pesan `TIMEOUT_UNACKNOWLEDGED` + tombol retry (initiate ulang idempoten <5s); ACK error → WO ABORTED, pesan konfigurasi edge gagal.
- Kamera gagal → pesan jujur; jalur A berhenti (wajib kamera), textfield WO tetap.
- OID mismatch → konfirmasi eksplisit (unit 002 FR-005) sebelum initiate.

## Security

Sesi operator + Bearer + LAN (backend enforce); capability `work_order.dispatch` gate existing; QR bukan autentikasi; badge zona wajib scan fisik (bukan paste) = bukti kehadiran operator di mesin.

## Migration Strategy

Tanpa migrasi data. Lane simulasi tetap (`parseQrString` + `draftFromMachine` lama). Backend-mode berperilaku baru setelah deploy; katalog demo tidak pernah jadi payload.

## Alternatives Considered

Lihat ADR-0005 (perluas parseQrString, toggle lane, prefill jobConfig, WS-only ACK, shared parser package — semua ditolak dengan alasan).
