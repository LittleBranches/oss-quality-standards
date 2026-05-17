---
id: definition-of-done
title: Definition of Done
sidebar_position: 5
---

# Definition of Done — Expanded Guide

> The checklist is in [AGENTS.md §6](./AGENTS.md#6-definition-of-done). This page explains how to apply each item and what "not done" looks like in practice.

---

## How to use the checklist

The DoD checklist lives in `.github/pull_request_template.md` and appears in every PR description. Before marking a PR ready for review, every item must be either ticked or explicitly marked N/A with a reason.

**N/A is not a free pass.** It requires a reason:

| Item | Valid N/A | Invalid N/A |
|---|---|---|
| "Storybook build green" | "This repo has no Storybook" | "Didn't have time" |
| "Docs updated" | "This is an internal refactor with no public API change" | "Docs are someone else's job" |
| "Tests added" | "This is a docs-only change" | "Will add tests in a follow-up" |

---

## Code items

### Quality gate green

Run `npm run check:verify` — not `npm run check`. The `:verify` variant runs in read-only mode (no auto-fix) and matches what CI runs. A gate that passes locally with `--fix` but fails in CI is not green.

### No console.log / TODO / FIXME

These slip in during development and are easy to forget. Before committing, run:

```sh
git diff HEAD -- '*.ts' '*.tsx' | grep -E 'console\.log|TODO|FIXME'
```

If you find one that is intentional (e.g. a debug log that needs to stay temporarily), flag it to the branch owner — do not silently leave it.

### No new undisclosed dependencies

"Undisclosed" means not mentioned in the PR description. The branch owner needs to know what new packages are being added, why, and what they do. Transitive dependencies don't need to be listed — only direct `npm install` additions.

---

## PR items

### All review threads responded to

"Responded to" means every thread has a reply (✅ / ❌ / ⚠️ / ⏸️). A thread with no reply is not responded to, even if the issue was silently fixed. The branch owner cannot tell a fix happened without a reply.

### Valid fixes in one batch commit

Not two, not three — one. See [PR Review Workflow](./pr-review-workflow.md#phase-3--why-one-batch-commit) for the rationale.

### Follow-up replies with commit SHAs

The SHA must be the 7-character short SHA of the fix batch commit, not the branch name or a link to the PR. The branch owner clicks the SHA to see the exact diff for that fix.

---

## What "not done" looks like in practice

These are the most common ways a PR gets to review without actually being done:

| Symptom | Root cause |
|---|---|
| Gate passes locally, fails in CI | `npm run check` (with auto-fix) was run instead of `check:verify` |
| Thread has no reply | AI fixed the issue silently without replying |
| Multiple fix commits | AI pushed after each individual fix instead of batching |
| PR description has empty sections | Created via GitHub UI instead of `gh pr create` |
| Resolved threads | AI resolved its own threads |
| `console.log` in diff | Forgot to clean up debug output |

---

## Quick paste — PR description checklist

```markdown
## Definition of Done

- [ ] Quality gate green (`npm run check:verify`)
- [ ] No `console.log`, `TODO`, `FIXME` in committed files
- [ ] No new undisclosed dependencies
- [ ] No secrets in committed files
- [ ] PR title: `<type>(<scope>): <desc>` ≤ 72 chars
- [ ] Description: What / Why / Type / Checklist / Notes filled
- [ ] All review threads responded to (✅ / ❌ / ⚠️ / ⏸️)
- [ ] Valid fixes in one batch commit
- [ ] Follow-up replies with 7-char commit SHAs
- [ ] No threads resolved by AI
- [ ] Docs updated for public-facing changes
- [ ] No banned identifiers or private refs
```
