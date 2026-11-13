# IDEA OWNER DIRECTIVES — READ FIRST

**This is the IDEA production marketplace, not just a Figma prototype.** The owner-approved source-of-truth instructions are:

1. [Owner's authoritative directives](docs/IDEA_OWNER_MASTER_DIRECTIVES_20261112.md) — exact 3 account designs, real PHP/MySQL-only identity/commerce, supplier RFQ, AI quotas, 3D, branding, safety and release rules.
2. [Execution register and QA gates](docs/IDEA_EXECUTION_STATUS_20261112.md) — verified status, blockers, PR triage and next phase. Update after each real action.
3. [Existing earlier execution reference](docs/execution-reference-20261112.md) — historical source evidence, **not** permission to restore older architecture.

Owner-specific directives take priority over generic scaffolding text and old Figma-generated design suggestions in this file, while preserving dependencies and legitimate design-system constraints. **Do not use Supabase as the production user database; the existing cPanel PHP/MySQL data is authoritative.** Never invent a working backend, change approved screenshots, erase real records, merge unreviewed old branches, or deploy without backups and tested rollback.

---

# Create website from markdown (Copy) (Copy)

React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is always running on `$PORT` (default 8443). Source changes
are reflected through hot reload.

## Key Files

- `src/main.tsx` - Browser entry point
- `vite.figma.config.ts` - Figma Make wrapper configuration
- `.mise.toml` - Toolchain versions

## Project Guidelines

Read and always follow the instructions in the [project guidelines](guidelines/Guidelines.md) unless the user requests otherwise.
