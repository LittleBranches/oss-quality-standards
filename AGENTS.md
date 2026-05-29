# AGENTS.md — LittleBranches OSS Quality Standards

**Single source of truth for all AI models** (Grok, Copilot, Claude, etc.) when working on any Alex Rebula repository.

## How any AI loads this (copy-paste this line in any chat)
> Load reviewer instructions from AGENTS.md in LittleBranches/oss-quality-standards

## Core Rules (Locked & Enforceable)
1. **Read-only / informational tasks** — Grok may perform freely.
2. **Any write / repo-changing action** (create PR, file, branch, merge, edit, etc.) — must ask for **explicit confirmation** first.
3. **Always enforce**:
   - `.github/pull_request_template.md`
   - DoD checklist
   - Component taxonomy & structure rules
   - Quality gates & banned-content checks (non-sensitive version here)
   - Authenticity & ownership (see `docs/ai-collaboration-protocol.md`)
4. Public OSS repos stay clean and library-focused.
5. Sensitive rules (full banned-content list, competitor references) live only in the private repo `LittleBranches/oss-quality-standards-private`.

Full documentation lives in the `docs/` folder.

**Version:** 1.0
**Last updated:** 2026-05-17
**Maintained by:** Alex Rebula
