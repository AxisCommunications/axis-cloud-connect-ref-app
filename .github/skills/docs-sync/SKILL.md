---
name: docs-sync
description: 'Keep documentation in sync after a code change in this repo. Use automatically after adding/removing/changing backend endpoints, env vars, npm scripts, frontend features, domain terms/acronyms, packages, or architecture/auth flows — before considering a coding task done. Checks and updates README.md, DEVELOPMENT.md, docs/glossary.md, package READMEs (packages/backend, packages/frontend), and .github/copilot-instructions.md.'
---

# Docs Sync

Ensures documentation stays accurate whenever code changes affect something docs describe. Run this at the end of a coding task, right before declaring it complete — not just when explicitly asked.

## When to Use

Check this skill's mapping table below whenever a change touches:

- Backend endpoints (add, remove, change method/purpose)
- Environment variables (new/renamed/removed, or default behavior changes)
- npm scripts in any `package.json`
- Frontend features or user-facing capabilities (`packages/frontend/src/features/**`)
- Domain terms, acronyms, or protocol names introduced in code/comments
- New/removed/renamed package (workspace) or top-level folder
- Auth/session/token flow, architecture, or data-flow changes
- Test files added/removed (changes what's covered)
- Coding conventions described in `.github/copilot-instructions.md`

If the change is purely internal (refactor, styling, variable rename, bugfix with no behavior/interface change), skip docs and say so briefly — do not touch docs speculatively.

## Change → Doc Mapping

| Change type | Update |
| --- | --- |
| Backend endpoint added/removed/changed | Endpoint table in [README.md](../../../README.md) (Architecture diagram), [DEVELOPMENT.md](../../../DEVELOPMENT.md) ("Backend Design" section), [packages/backend/README.md](../../../packages/backend/README.md) |
| Env var added/removed/changed | [README.md](../../../README.md) ("Getting Started" / "Configure environment variables"), the relevant package "readme" |
| npm script added/removed/renamed | [DEVELOPMENT.md](../../../DEVELOPMENT.md) ("Available Scripts" table) |
| Frontend feature/capability added or changed | [packages/frontend/README.md](../../../packages/frontend/README.md) ("Features" section), [README.md](../../../README.md) ("Features" list) |
| New domain term, acronym, or protocol name | [docs/glossary.md](../../../docs/glossary.md) |
| Package/workspace added, removed, or renamed | "Project Structure" sections in [README.md](../../../README.md), [DEVELOPMENT.md](../../../DEVELOPMENT.md), and `.github/copilot-instructions.md` |
| Auth/session/token/architecture flow changed | Mermaid diagrams and architecture prose in [DEVELOPMENT.md](../../../DEVELOPMENT.md) and [README.md](../../../README.md) |
| Test file added/removed | "Test structure" section in [DEVELOPMENT.md](../../../DEVELOPMENT.md) |
| Coding convention changed | `.github/copilot-instructions.md`, and the summary in [DEVELOPMENT.md](../../../DEVELOPMENT.md) ("Coding Conventions") |

## Procedure

1. After finishing the code change, list which rows of the mapping table apply.
2. For each match, open the target doc(s) and compare against the current code — check tables, diagrams, and lists for anything now stale (missing, outdated, or contradicted).
3. Make the minimal edit needed to restore accuracy. Do not rewrite unrelated doc content or add speculative new sections.
4. If you can't tell whether a doc needs updating, or which doc is authoritative for the change, **ask the user** instead of guessing or skipping silently.
5. Report back briefly: which docs were updated (linked), and which mapped docs were checked but already accurate.

## Non-Goals

- Don't create new documentation files unless the user asks for one.
- Don't update docs for changes with no user-facing or contributor-facing effect.
- Don't reformat or restyle existing docs while doing an accuracy pass.
