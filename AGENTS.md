# AGENTS.md — oee-dashboard-aistudio (HMI OEE)

> Entry point AI agent di repo ini. Cara beroperasi, bukan salinan dokumentasi. Baca yang dirujuk, jangan duplikat.

## Reading order (sebelum mengubah apa pun)

1. `AGENTS.md` (ini)
2. `TODO.md` — posisi eksekusi sekarang
3. `.sdd/context/constraints.md` — **layout OEE live monitor BEKU**; constraint LAN-only/auth/null≠0
4. `.sdd/constitution/constitution.md` — prinsip + gate
5. `specs/<unit-aktif>/spec.md` → `plan.md`
6. ADR yang dirujuk di `decisions/`
7. `specs/<unit-aktif>/design.md` → `tasks.md`
8. Kontrak wire bila menyentuh data: `../iiot-oee/apps/backend/docs/API_DOCUMENTATION.md`
9. Struktur kode: `ARCHITECTURE.md`

Tidak perlu membaca seluruh repo tiap task — hanya yang relevan unit aktif.

## Mandatory rules

- Setiap perubahan perilaku traceable ke FR/AC spec yang disetujui. Spec ambigu/diam soal material → STOP, angkat Open Question; otoritas resolusi: produk (perilaku) / pemilik repo (engineering). Jangan menebak.
- Keputusan arsitektur signifikan → ADR dulu (Proposed → Accepted oleh pemilik repo) sebelum implementasi.
- Design STALE / ADR belum Accepted / OQ material belum terjawab → jangan implementasi.
- `TODO.md` bukan backlog; `tasks.md` bukan tempat mendefinisikan ulang requirement. Gap → perbaiki spec.
- Update `TODO.md` + `tasks.md` setelah progress bermakna; tandai AC terverifikasi hanya dengan bukti (`verification.md`).
- Jangan sentuh komponen layout live monitor (constraint beku). Diff presentasi yang diizinkan unit berjalan hanya modal auth.
- Jaga `pnpm lint:arch`: domain zero-IO, application inward-only, presentation no-direct-IO, no `any`.
- Tanpa fabrikasi data: null/kosong jujur; `is_buffered` bukan penggerak gauge; tanpa fetch-loop mandiri.
- Backend (`iiot-oee`) tidak diubah dari repo ini; gap kontrak dicatat (spec + `docs/specs/backend-gaps.md`).

## Finding active work

`TODO.md` → Current Position (unit, stage, task).

## Gates (sebelum implementasi unit)

- spec SPECIFIED + AC testable + OQ material terjawab.
- ADR terkait Accepted.
- design DESIGNED + Health VALID (Reviewed against ≥ spec Revision).
- tasks READY + traceable.

## Verifikasi

```bash
pnpm lint     # tsc --noEmit + lint:arch
pnpm test     # vitest run
```

E2E: stack `iiot-oee` hidup (docker, nginx :80; dev HMI :3002 via vite proxy). Bukti per AC → `specs/<unit>/verification.md`.

## Authoritative sources (link, jangan duplikat)

- Kontrak wire: `../iiot-oee/apps/backend/docs/API_DOCUMENTATION.md`
- Prinsip: `.sdd/constitution/constitution.md` · Governance: `.sdd/governance.md`
- Domain: `.sdd/context/domain.md` · Glossary: `.sdd/context/glossary.md`
- Keputusan: `decisions/` · Unit: `specs/` · Audit historis: `docs/`
- Struktur kode: `ARCHITECTURE.md`
