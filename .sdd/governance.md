# Governance — SDD oee-dashboard-aistudio

> Bagaimana konvensi SDD repo ini dijalankan dan diubah. Versi mesin: `manifest.yaml`. Prinsip: `.sdd/constitution/constitution.md`.
> Adaptasi: rantai artefak mengikuti skill `sdd-repo-governance`, lokasi mengikuti konvensi ekosistem iiot-oee (`specs/NNN-slug/`, `decisions/NNNN-slug.md` di root). Dokumen historis tetap di `docs/` (audit/plans/specs lama) — bukan artefak governed.

## Artifact Authority Matrix

| Informasi | Otoritas tunggal | Penurunan (merujuk, tidak menyalin) |
|---|---|---|
| Kontrak wire (endpoint/WS/auth/error) | `iiot-oee/apps/backend/docs/API_DOCUMENTATION.md` | spec (FR merujuk §), design (Interfaces), DTO |
| Perilaku fungsional unit | `specs/<unit>/spec.md` | plan, design, tasks, verification |
| Pendekatan kerja unit | `specs/<unit>/plan.md` | tasks |
| Keputusan arsitektur | `decisions/NNNN-*.md` | design (Traces to) |
| Solusi teknis unit | `specs/<unit>/design.md` | tasks, kode |
| Rincian kerja | `specs/<unit>/tasks.md` | eksekusi |
| Bukti pemenuhan AC | `specs/<unit>/verification.md` | status VERIFIED |
| Status eksekusi repo | `TODO.md` | — |
| Prinsip engineering | `.sdd/constitution/constitution.md` | semua artefak |
| Constraint berdiri | `.sdd/context/constraints.md` | spec §Constraints |
| Struktur kode | `ARCHITECTURE.md` | design |
| Cara agent beroperasi | `AGENTS.md` | — |

## Lifecycle vs Health (dua dimensi, jangan digabung)

- **Lifecycle** (kemajuan): spec DRAFT→CLARIFYING→SPECIFIED→SUPERSEDED; plan DRAFT→PLANNED; design DRAFT→DESIGNED; tasks DRAFT→READY→IMPLEMENTING→IMPLEMENTED; verification DRAFT→IN PROGRESS→VERIFIED/FAILED; ADR Proposed→Accepted→Superseded/Rejected.
- **Health** (kepercayaan): VALID | REVIEW_REQUIRED | STALE | BLOCKED. Spec tidak punya STALE (naikkan **Revision** tiap perubahan bermakna).
- **Staleness**: downstream (plan/design/tasks) mencatat `Reviewed against: spec revision N`. Bila spec Revision > N → Health downstream = STALE sampai direview. Design STALE = dilarang implementasi.
- **VERIFIED** = semua AC pass + bukti tercatat di verification.md. Tanpa bukti = Gate Theater (dilarang).

## Conflict Resolution Protocol

1. Deteksi konflik (artefak A vs B, atau docs vs payload hidup).
2. Identifikasi artefak terdampak + otoritasnya (Matrix di atas).
3. Tentukan apakah intent berubah atau hanya interpretasi.
4. Update artefak otoritatif; tandai downstream STALE/REVIEW_REQUIRED.
5. Konflik lintas-repo (docs backend vs kenyataan): probe payload hidup, catat temuan di spec/unit terkait + `docs/specs/backend-gaps.md`, eskalasi ke tim backend — klien tidak menebak diam-diam.
6. Konflik produk vs engineering: pemilik repo memutuskan; keputusan signifikan → ADR.

## Deviation Protocol (implementasi menyimpang dari design)

- **Intent-preserving** (cara beda, perilaku sama): boleh; update design.md bila perlu; catat di verification.md §Known Deviations.
- **Intent-changing** (perilaku beda): STOP → kembali ke governance: update design/spec, ADR baru bila signifikan, downstream di-review ulang.

## ADR supersession

ADR tidak pernah dihapus/ditulis ulang sejarahnya. Keputusan baru = ADR baru dengan `Supersedes: NNNN`; ADR lama status Superseded + `Superseded by`. Keputusan kecil (naming, detail implementasi) bukan ADR — masuk design.md.

## Change impact classification

- LOW: typo/format/docs non-kontrak → edit langsung.
- MEDIUM: perubahan design dalam satu unit → review tasks + test terdampak.
- HIGH: perubahan spec/FR, kontrak DTO, auth → plan+design+tasks review, verification ulang AC terdampak.
- CRITICAL: lintas-unit, keamanan, layout beku tersentuh, atau ADR ditolak → STOP, eskalasi pemilik repo/produk; jangan resolve unilateral.

## Governance versioning

Versi saat ini: **1.0** (manifest.yaml). Perubahan konvensi: naikkan versi, catat di Migration log bawah, nyatakan apa yang required vs tidak perlu rewrite retroaktif.

## Migration log

### 1.0 — 2026-11-20

**Required (unit baru):**
- Rantai `specs/NNN-slug/{spec,plan,design,tasks,verification}.md` dengan Lifecycle/Health/Revision/Reviewed against.
- Keputusan signifikan → `decisions/NNNN-slug.md` (status Proposed sampai accepted).
- TODO.md sebagai ledger eksekusi; AGENTS.md entry point.

**Not required (tanpa rewrite retroaktif):**
- Dokumen historis `docs/audits|plans|specs` tetap apa adanya (dirujuk sebagai bukti/audit, bukan artefak governed).
- Kode eksisting tidak perlu annotasi FR retroaktif; hanya perubahan baru wajib traceable.
