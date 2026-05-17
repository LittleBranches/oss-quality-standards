---
id: AGENTS
title: AGENTS.md — Full Barrel
sidebar_position: 1
---

# LittleBranches OSS Quality Standards — AGENTS.md

> **Universal reviewer instructions for any AI model.**
> Load this file once at the start of a session to enforce all quality rules
> across all LittleBranches repositories.
>
> **Trigger phrase (copy-paste into any chat):**
> "Load reviewer instructions from AGENTS.md in LittleBranches/oss-quality-standards"

Raw URL for agents:
`https://raw.githubusercontent.com/LittleBranches/oss-quality-standards/main/docs/AGENTS.md`

---

## Scope — React + MUI (current)

These rules target **React projects using MUI (Material UI)**. Rules that reference `.tsx` files, MUI theme tokens, `sx`, `forwardRef`, `styled()`, or `@testing-library/react` apply only in that context.

Rules in §1–§4 (AI Collaboration Protocol, Branch Hygiene, Quality Gate, PR Review Workflow) and §11 (Definition of Done) are **framework-agnostic** and apply to any LittleBranches repository regardless of stack.

> **Vue and Angular equivalents are planned.** When those rule sets are added, they will follow the same barrel structure and be loadable via their own trigger phrases. Until then, apply only the framework-agnostic sections (§1–§4, §11) to non-React repositories.

---

## How to use this file

This file contains all enforceable rules. Load it and you have everything needed to review a PR, enforce quality checks, or execute any task in a LittleBranches repository.

The `docs/` folder in this repo contains expanded guides for each section below. They are for humans browsing the site and for agents that need more context on a specific rule. Consult them when the rule alone is not enough:

| You need | Fetch this doc |
|---|---|
| What to look for when reviewing a PR (priority order, full checklist) | `docs/code-review-guide.md` |
| Real ✅/❌/⚠️/⏸️ response examples, edge cases for review threads | `docs/pr-review-workflow.md` |
| Gray area decisions on what requires approval vs what AI can do freely | `docs/ai-collaboration-protocol.md` |
| What N/A means on the DoD checklist, common "not done" patterns | `docs/definition-of-done.md` |
| Migration steps, barrel export examples, scaffolding a new component | `docs/component-structure.md` |
| Setup for a new repo, troubleshooting a failing gate check | `docs/quality-gate.md` |
| Suffix vocabulary, 4-criterion naming test, category patterns | `docs/naming-conventions.md` |
| Three-tier doc architecture, zero-personal-data rule, story conventions | `docs/documentation-strategy.md` |
| sx array-safety, `...other` passthrough, icon slots, `shouldForwardProp` | `docs/component-api-contract.md` |
| WCAG 2.2 AA rules, focus rings, ARIA patterns, eye-button rule | `docs/accessibility.md` |
| Vitest patterns, style test pattern, coverage requirements, mock rules | `docs/testing.md` |

Raw base URL for expanded docs:
`https://raw.githubusercontent.com/LittleBranches/oss-quality-standards/main/docs/<filename>`

---

## Table of Contents

1. [AI Collaboration Protocol](#1-ai-collaboration-protocol)
2. [Branch Hygiene](#2-branch-hygiene)
3. [Quality Gate](#3-quality-gate)
4. [PR Review Workflow](#4-pr-review-workflow)
5. [Component Structure Rules](#5-component-structure-rules)
6. [Component API Contract](#6-component-api-contract)
7. [Naming Conventions](#7-naming-conventions)
8. [Documentation Strategy](#8-documentation-strategy)
9. [Accessibility](#9-accessibility)
10. [Testing](#10-testing)
11. [Definition of Done](#11-definition-of-done)
12. [Private Extension](#12-private-extension)

---

## 1. AI Collaboration Protocol

### 1.1 — What AI can do without asking

- Read files, grep, run `git status / log / diff` (read-only git commands).
- Write or edit files that are part of the current task.
- Create commits when the branch owner says "commit" or equivalent.
- Create a PR when the branch owner gives an explicit green light.
- Respond to review threads (Phase 2 of the PR workflow).
- Push commits **on a branch** (never to `main` or `master` directly).

### 1.2 — What requires explicit branch owner approval

- Creating a new branch (state the branch name and why, then wait).
- Force-pushing any branch.
- Merging a PR.
- Closing or re-opening a PR or issue.
- Resolving review threads (branch owner resolves; AI only replies).
- Deleting a branch.
- Changing CI/CD pipeline or workflow files.
- Bumping dependency versions unless that was the stated task.
- Publishing to npm or any registry.

### 1.3 — What AI must never do

- Push directly to `main` or `master`.
- Merge, squash, or rebase without explicit instruction.
- `git push --force` (only `--force-with-lease` and only when explicitly asked).
- Resolve its own review threads.
- Skip pre-commit or pre-push hooks (`--no-verify` is forbidden).
- Auto-generate or auto-populate a PR description using the GitHub UI Copilot button — all PRs must be created via `gh pr create` from the terminal.
- Make "cleanup" changes unrelated to the task at hand.
- Introduce new dependencies without listing and explaining them first.
- **Run the quality gate proactively.** The gate runs automatically on every push (pre-push hook) and on every Vercel build. Running it manually during normal work is unnecessary and slows the developer down. See §3.3.

---

## 2. Branch Hygiene

### 2.1 — Branch naming

| Prefix | Commit type | When |
|---|---|---|
| `feature/` | `feature` | New functionality |
| `fix/` | `fix` | Bug fixes |
| `chore/` | `chore` | Tooling, config, build, dependencies |
| `docs/` | `docs` | Documentation only |
| `data/` | `data` | Data-only changes (no logic, no config) |
| `refactor/` | `refactor` | Code restructure with no behaviour change |
| `test/` | `test` | Adding or updating tests only |
| `style/` | `style` | Formatting, white-space (no logic change) |

### 2.2 — Commit conventions (Conventional Commits)

Format: `<type>(<scope>): <description>`

| Type | When |
|---|---|
| `feature` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, config, build, deps |
| `docs` | Documentation only |
| `data` | Data-only changes (no logic, no config) |
| `refactor` | Code change with no behaviour change |
| `test` | Adding or updating tests |
| `style` | Formatting, white-space (no logic change) |

- Subject line ≤ 72 characters, imperative mood.
- Every commit on a branch must be **related to that branch's stated purpose**.

### 2.3 — Moving unrelated commits

If a commit does not belong on its current branch:

1. Identify the correct branch category.
2. Cherry-pick onto the correct branch (create it from `main` if needed).
3. Drop the commit from the original branch via `git rebase -i`.
4. Force-push the original branch with `--force-with-lease` **only if it has no open PR**. If it does have an open PR, ask the branch owner before force-pushing.

---

## 3. Quality Gate

The quality gate must be **fully green** before a PR is created. A red gate is a blocker — do not request PR creation.

### 3.1 — Running the gate

```sh
npm run check          # auto-fix Prettier + ESLint, then verify all
npm run check:verify   # read-only — no auto-fix (used in CI and pre-push)
```

### 3.2 — Checks (in order)

| Step | Tool | What it catches |
|---|---|---|
| 0a | Banned content scan | Proprietary identifier names in `src/`; internal project references in `src/` and `docs/`. Full list in the private AGENTS.md (§12). |
| 0b | Structure check | Flat component files under layer folders |
| 1 | Prettier | Formatting |
| 2 | ESLint `--max-warnings 0` | react-hooks, unused-imports, TypeScript rules |
| 3 | `tsc --noEmit` | Type errors |
| 4 | Vitest | Unit tests |
| 5 | tsup build | Library compilation and tree-shaking |
| 6 | Storybook build | Broken stories (CI only; opt-in locally with `--storybook`) |

Steps 0a and 0b only apply in repos that include those scripts. If `scripts/check-banned-content.js` or `scripts/check-structure.js` are absent, skip those steps.

### 3.3 — When AI must NOT run the gate

The quality gate is enforced automatically in two places:

1. **Pre-push hook** — runs `check:verify` on every `git push`, blocking the push if any check fails.
2. **Vercel / CI build** — runs `check:verify` on every push to remote.

Because the gate is always enforced at push time, AI must **not** run it proactively during normal work. Running it mid-task is slow, produces noise, and adds no safety — the hook will catch everything before the code reaches remote.

**The only time AI may run the gate is when explicitly asked by the branch owner**, and only in exceptional cases (e.g. a very large batch of changes where the branch owner wants an early warning before pushing). The default assumption is: the hook handles it.

If a repo has no pre-push hook, note this to the branch owner rather than substituting manual gate runs.

---

## 4. PR Review Workflow

### Phase 0 — Branch hygiene (before anything else)

Run the full quality gate. All checks must be green. See §3.

### Phase 1 — PR creation

**1.1 — Wait for the green light**

Do not create a PR until the branch owner explicitly says so ("create the PR", "open it", "go ahead"). A general "finish the task" instruction is not a green light.

**Never use the GitHub UI to create PRs.** Always use:

```sh
gh pr create --title "<type>(<scope>): <short description>" --body "..."
```

**1.2 — PR description format**

Every PR must include all of these sections (from `.github/pull_request_template.md`):

- **What does this PR do?** — one paragraph, concrete deliverable
- **Why** — reason for the change (roadmap entry, issue, or conversation context)
- **Type of change** — matching checkbox from the template
- **Checklist** — all items ticked or explicitly N/A with a reason
- **Notes for reviewer** — non-obvious things the reviewer should check first

**1.3 — Trigger a Copilot review**

After creating the PR, check if `github-copilot[bot]` was auto-added as reviewer:

```sh
gh pr view <N> --json reviewRequests --jq '.reviewRequests[].login'
```

If not, add it via the GitHub UI: **PR → Reviewers → Request → Copilot**.

Do not proceed to Phase 2 until the review is submitted and threads are visible.

---

### Phase 2 — Copilot review response (one thread at a time)

**2.1 — Gather all threads first**

```sh
gh api --paginate /repos/<owner>/<repo>/pulls/<N>/comments --jq \
  '[.[] | {id, path, line, body: .body[0:120]}] | sort_by(.path, .line)'
```

Read every thread in full before responding to any.

**2.2 — Respond to every thread — no exceptions**

Reply in the same thread (never a top-level PR comment):

```sh
gh api --method POST \
  /repos/<owner>/<repo>/pulls/comments/<comment-id>/replies \
  -f body="<response>"
```

| Verdict | Format |
|---|---|
| Valid | `✅ Valid. [reason] Will fix in the batch commit — [what changes].` |
| Not valid | `❌ Not valid. [why the concern does not apply here.]` |
| Partially valid | `⚠️ Partially valid. [what is right / what is wrong]. Will fix [the valid part].` |
| Needs context | `⏸️ Needs branch owner input. [what is missing]. Holding this fix.` |

**2.3 — Security and WCAG comments are always valid**

Any comment flagging an OWASP Top 10 vulnerability or a WCAG accessibility gap is **always treated as valid**.

**2.4 — Inline suggestion blocks**

Every GitHub Suggested Change block must be explicitly accepted or rejected. Accepted suggestions applied via UI must be squashed into the fix batch commit before pushing.

---

### Phase 3 — Fixing valid comments (one batch)

```sh
npm run check:verify
git add -A
git commit -m "fix: address PR #<N> review comments

- <file>: <what was fixed>"
git push origin <branch>
```

After the push, reply to each fixed thread:

```
Fixed in <7-char-SHA> — <one sentence: what changed and where>.
```

---

### Phase 4 — Post-fix state

- **Never resolve a review thread.** Only the branch owner resolves threads.
- If the fix batch changed the PR's scope: `gh pr edit <N> --body "<updated body>"`.

---

### Phase 5 — Branch owner sign-off

1. Read all thread follow-ups.
2. Click through commit SHAs to verify each fix.
3. Resolve threads they are satisfied with.
4. Flag incorrect fixes — AI responds and fixes.
5. Approve and merge (AI never merges unilaterally).

---

## 5. Component Structure Rules

### 5.1 — One component per folder

```
✅  src/components/<layer>/<category>/<name>/<name>.tsx
❌  src/components/<layer>/<category>/<name>.tsx
❌  src/components/<layer>/<name>.tsx
```

### 5.2 — Allowed flat files

`index.ts`, `index.tsx`, `types.ts`, `use-*` hooks, and `*.stories.tsx` group-level files are permitted flat.

### 5.3 — Barrel exports

Every component folder exposes a single `index.ts`. Consumers import from the folder, not from internal files.

### 5.4 — Naming conventions

- Folder: kebab-case (`metric-card/`)
- Main file: `<name>.tsx` (or `.ts` for non-JSX)
- Barrel: `index.ts`
- Tests: `<name>.test.ts`
- Style tests: `<name>.styles.test.ts`
- Stories: `<name>.stories.tsx`
- Styles: `<name>.styles.ts`
- Constants: `<name>.const.ts`
- Defaults: `<name>.defaults.tsx`
- Utilities: `<name>.utils.ts`
- Animations: `<name>.animations.ts`
- Story-specific styles (rare): `<name>.stories.styles.ts`

---

## 6. Component API Contract

### 6.1 — Props interface

Every component's props interface must extend the MUI root component's props (or `React.HTMLAttributes` for non-MUI components). Custom props go before the spread; the props type is exported from `index.ts`.

### 6.2 — `sx` array-safety

Always merge `sx` using array syntax so consumers can chain multiple `sx` values:

```ts
<Card sx={[{ p: 2 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other} />
```

### 6.3 — `...other` passthrough

Always spread remaining props onto the root element. This forwards `data-*`, `aria-*`, event handlers, and future MUI props.

### 6.4 — No hardcoded colours

Use MUI theme tokens (`text.primary`, `background.paper`, `palette.divider`, etc.). Never use hex or RGB values.

### 6.5 — No `React.FC`

Use plain function declarations: `export function Foo({ ... }: FooProps) { ... }`

### 6.6 — No bare `<Box>` with semantic meaning

`<Box>` is a layout primitive only. Elements with roles, ARIA attributes, or meaningful visual styling must be named components.

### 6.7 — `shouldForwardProp` on styled components

Add `shouldForwardProp` for any custom prop that must not reach the DOM.

### 6.8 — `displayName`

Set `displayName` on every component, especially those returned from `forwardRef` or `memo`.

### 6.9 — `ref` forwarding

Components that wrap a DOM element or MUI component must use `React.forwardRef`.

### 6.10 — Icon slots

Accept icons as `React.ReactNode`. Decorative icons must have `aria-hidden="true"`. Icon-only buttons must have an `aria-label` on the `<button>`, not on the icon.

---

## 7. Naming Conventions

### 7.1 — The 4-criterion test

Before naming a component: (1) is the name a noun describing what it renders? (2) does it include the MUI base it extends? (3) is the suffix the most specific one that fits? (4) does it avoid a generic prefix (`Base*`, `Custom*`, `Common*`, etc.)?

### 7.2 — Suffix vocabulary

`Card`, `Row`, `List`, `Table`, `Section`, `Layout`, `Label`, `Sheet`, `Strip`, `Dialog`, `Drawer`, `Form`, `Field`, `Icon`, `Avatar`, `Chip`, `Tab`. Adding a new suffix requires a team decision.

### 7.3 — Casing rules

| Thing | Convention |
|---|---|
| Folder / file | kebab-case |
| React component | PascalCase |
| Props interface | PascalCase + `Props` suffix |
| Hook | camelCase starting with `use` |
| Constant | SCREAMING_SNAKE_CASE |

### 7.4 — Hook naming

Files: `use-<name>.ts`. Exported function: `use<Name>`.

---

## 8. Documentation Strategy

### 8.1 — Three tiers

| Tier | Location | Audience |
|---|---|---|
| JSDoc | Source `.tsx` / `.ts` | IntelliSense, API consumers |
| Story JSDoc | `.stories.tsx` | Storybook, designers, QA |
| Docusaurus / README | `docs/` or `README.md` | Onboarding, external consumers |

Tiers do not duplicate each other. If information belongs in Tier 1, it is not copy-pasted into Tier 3.

### 8.2 — Zero-personal-data rule

Stories, tests, JSDoc `@example` blocks, and all docs must NEVER contain real names of people, clients, or employers; real email addresses, phone numbers, or financial values tied to a real entity. Use generic placeholders: `Jane Doe`, `Acme Corp`, `user-001`, `hello@example.com`.

Violations found in PR review are blocking — same severity as a security finding.

### 8.3 — Storybook conventions

Every component must have at least a `Default` story (minimal required props) and one story per significant variant. Story names use PascalCase and do not repeat the component name (`WithTrend` not `MetricCardWithTrend`).

---

## 9. Accessibility

### 9.1 — Target

WCAG 2.2 Level AA. Accessibility gaps found in PR review are always treated as valid (blocking). No counter-argument overrides this.

### 9.2 — Keyboard-first

Every interactive element must be reachable and activatable by keyboard. Focus rings must be visible — do not suppress `outline` without a replacement.

### 9.3 — ARIA semantics

Prefer semantic HTML over `<div role="...">`. Required patterns: icon-only buttons have `aria-label`; loading states use `aria-busy` + `aria-live`; error messages use `aria-describedby`; toggle buttons use `aria-pressed`.

### 9.4 — Decorative vs informative icons

Decorative icons: `aria-hidden="true"`. Icons inside labelled buttons: `aria-hidden="true"` on the icon (the button carries the label). Icon-only buttons: `aria-label` on the `<button>`.

### 9.5 — Visibility toggle rule

Show/hide password buttons must use `aria-label` that reflects current state and `aria-pressed`. Focus must not move on toggle.

### 9.6 — Motion

Respect `prefers-reduced-motion`. Wrap animations in the appropriate media query or hook.

---

## 10. Testing

### 10.1 — Stack

Vitest + jsdom. Test files co-located in the component folder (`<name>.test.ts`). Style tests in a separate file (`<name>.styles.test.ts`).

### 10.2 — Patterns

Use `React.createElement` + `renderToStaticMarkup` for pure rendering checks. Use `@testing-library/react` + `userEvent` for interaction tests. Import from the barrel, not from internal files.

### 10.3 — Coverage

Minimum 80% line coverage per file. Exclusions: `*.stories.tsx`, `*.const.ts`, `index.ts`, `*.defaults.tsx`.

### 10.4 — Required test cases

Every component must test: smoke render, required props output, each optional variant, `...other` passthrough, `ref` forwarding (if `forwardRef` is used).

### 10.5 — Zero-personal-data in tests

Same rule as §8.2 — no real names, emails, or client data in test files.

### 10.6 — No internal mocks

Mock at module boundaries only. Never mock a function that lives in the same package.

---

## 11. Definition of Done

### Code
- [ ] Quality gate fully green (`npm run check:verify`)
- [ ] No commented-out code, `console.log`, `TODO`, or `FIXME`
- [ ] Component structure rules satisfied
- [ ] Component API contract satisfied (sx array-safety, `...other`, no bare `<Box>`, etc.)
- [ ] No hardcoded colours
- [ ] No new undisclosed dependencies
- [ ] No secrets in committed files
- [ ] No personal data in stories, tests, or docs

### PR
- [ ] Title: `<type>(<scope>): <desc>` ≤ 72 chars
- [ ] Description: What / Why / Type / Checklist / Notes filled
- [ ] All review threads responded to
- [ ] Valid fixes in one batch commit with follow-up replies (SHA)
- [ ] No threads resolved by AI

### Docs & security
- [ ] Public-facing changes reflected in `docs/`
- [ ] No banned identifiers or private refs
- [ ] Security and accessibility comments addressed
- [ ] JSDoc updated for any changed public API

---

## 12. Private Extension

For sensitive rules (banned identifiers, private refs, internal project codes), also load:

> `LittleBranches/oss-quality-standards-private` — `AGENTS.md`

Raw URL:
`https://raw.githubusercontent.com/LittleBranches/oss-quality-standards-private/main/AGENTS.md`

If working in any public LittleBranches repository, load **both** barrels before reviewing.

---

*LittleBranches · MIT License*
