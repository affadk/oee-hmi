# Engineering Constitution — oee-dashboard-aistudio (HMI)

> Prinsip engineering lintas-unit. Governance, bukan spesifikasi unit.
> Struktur kode otoritatif: `ARCHITECTURE.md`. Kontrak wire otoritatif: `iiot-oee/apps/backend/docs/API_DOCUMENTATION.md`.

## Principles

- **Requirement traceability.** Setiap perubahan perilaku wajib terlacak ke `specs/<unit>/spec.md` yang disetujui (FR/AC). Tanpa spec → tidak ada implementasi.
- **Explicit scope.** Setiap spec menyatakan in/out-of-scope eksplisit. Fitur "sekalian" = out-of-scope sampai masuk spec.
- **Testable requirements.** FR/AC ditulis terverifikasi (Given-When-Then), bukan asserted.
- **Explicit boundaries.** Hexagonal: domain zero-IO; application inward-only (tanpa infrastructure/presentation); presentation tanpa IO langsung; DTO boundary satu-satunya penerjemah kontrak wire. Dijaga `pnpm lint:arch`.
- **Security by default.** Aktuasi LAN-only (backend menegakkan; klien tidak mencoba via tunnel). Token tidak dilog; password tidak persist. Capability fail-closed (`deny`/`unknown` → nonaktif). Tanpa lockout auth paralel di klien.
- **Kejujuran data.** Null/kosong/`—` lebih benar daripada fabrikasi. `is_buffered` tidak menggerakkan gauge. Staleness ditandai, bukan disembunyikan.
- **Maintainability.** Diff terpendek yang bekerja; tanpa dependensi baru untuk yang bisa stdlib/deps terpasang; dual-lane simulasi/backend dipertahankan; tanpa fetch-loop mandiri.
- **Layout beku.** Tampilan/layout OEE live monitor tidak berubah tanpa directive produk eksplisit (constraint aktif: `.sdd/context/constraints.md`).
- **Human approval gates.** (1) Spec disetujui sebelum design final; (2) ADR Accepted sebelum implementasi keputusan terkait; (3) design VALID (tidak STALE) sebelum tasks READY; (4) `VERIFIED` hanya dengan bukti per AC.

## Single source of truth

Satu informasi = satu lokasi otoritatif; lainnya merujuk. Kontrak wire → API docs backend. Perilaku unit → spec.md. Solusi teknis → design.md. Keputusan arsitektur → decisions/. Status eksekusi → TODO.md. Prinsip → dokumen ini.

## Boundary rules

1. Product requirement ≠ engineering specification.
2. Specification ≠ design.
3. Plan ≠ tasks.
4. ADR ≠ decision log generik (hanya keputusan signifikan/sulit dibalik).
5. TODO.md ≠ backlog.
6. TODO.md ≠ tasks.md.
7. Standing rules platform (hexagonal, lint arch) ≠ rantai artefak SDD — keduanya saling merujuk.
8. AGENTS.md ≠ seluruh dokumentasi (entry point).
9. Dokumen audit historis (`docs/`) ≠ artefak SDD governed (`specs/`, `decisions/`).
10. Jangan pernah membuat source-of-truth ganda.

## Amending this document

Perubahan konstitusi: usulkan via PR/dokumen perubahan dengan alasan; persetujuan pemilik repo; catat versi di `.sdd/governance.md` + `manifest.yaml`. Jarang dan deliberate.
