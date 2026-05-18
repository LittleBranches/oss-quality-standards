---
id: roadmap
title: Roadmap
sidebar_position: 14
---

# OSS Quality Standards — Roadmap

This roadmap tracks planned improvements to the standards themselves.
It is the honest answer to: _what is this repo missing relative to what it claims to be?_

Status legend: ✅ Done · 🔄 In progress · ⬜ Planned · ⏸ Blocked

---

## Phase A — Foundation (✅ Done — May 2026)

The initial public release. Core rules are written, wired into Docusaurus, and consumable via a single trigger phrase.

| Item                                                                        | Status |
| --------------------------------------------------------------------------- | ------ |
| AGENTS.md barrel loadable via raw GitHub URL                                | ✅     |
| AI Collaboration Protocol (§1)                                              | ✅     |
| Branch Hygiene rules (§2)                                                   | ✅     |
| Quality Gate spec (§3)                                                      | ✅     |
| PR Review Workflow — reviewer + responder roles (§4)                        | ✅     |
| Component Structure rules (§5)                                              | ✅     |
| Component API Contract — tier system (§6)                                   | ✅     |
| Naming Conventions — prohibition list (§7)                                  | ✅     |
| Documentation Strategy (§8)                                                 | ✅     |
| Accessibility — WCAG 2.2 AA rules (§9)                                      | ✅     |
| Testing conventions (§10)                                                   | ✅     |
| Definition of Done — Scenario A + B checklists (§11)                        | ✅     |
| Private barrel (`oss-quality-standards-private`) with banned content policy | ✅     |
| Docusaurus site published                                                   | ✅     |

---

## Phase B — AI-Assisted Development Quality Signal (⬜ Planned — HIGH PRIORITY)

**Context (May 2026):** A Reddit post titled _"vibe coded for 6 months. my codebase is a disaster"_ went viral (1,861 upvotes, 2,350 reposts across LinkedIn). The post describes exactly what happens when AI tools are used without discipline: no structure, duplicate functions, three different ways to handle the same thing across the codebase, impossible to onboard, so tangled that touching one part breaks something completely unrelated.

Every AI-assisted codebase triggers the same first question from any developer who opens it: _"is this a vibe-coded black box, or did someone actually think about this?"_

These standards already answer that question in practice — but the repo does not say so explicitly, and there is no single document a developer (or employer) can point to and say: _"this is the professional standard for AI-assisted development."_

**This phase adds:** an explicit framing document that positions these standards as the counter to vibe-coding risk, plus a per-repo audit checklist that any AI-assisted codebase can use to verify it passes the "did someone actually think about this?" test.

| Item                                                                                       | Status |
| ------------------------------------------------------------------------------------------ | ------ |
| `docs/ai-assisted-development.md` — new document                                           | ⬜     |
| Explicit framing: what vibe coding breaks (structure, onboardability, ownership, security) | ⬜     |
| The four verifiable signals that AI was used correctly                                     | ⬜     |
| Signal 1: enforced quality gate with a green CI badge on every PR                          | ⬜     |
| Signal 2: decision documentation — every rule has a "why", not just a "what"               | ⬜     |
| Signal 3: test coverage with a tracked threshold, not aspirational                         | ⬜     |
| Signal 4: named authorship of architectural decisions (no anonymous "the AI decided")      | ⬜     |
| Per-repo audit checklist: 10 verifiable checks any reviewer can run in under 10 minutes    | ⬜     |
| Update `intro.mdx` — one paragraph positioning the standards against vibe-coding risk      | ⬜     |
| Add a note in AGENTS.md §1 linking to this doc                                             | ⬜     |

---

## Phase C — Security (⬜ Planned)

Every major competing standard (Node Best Practices: 25 items, project-guidelines: API security section) has a dedicated security section. This repo does not. It is the most visible gap for any developer evaluating this as a credible reference.

**Scope:** Front-end / React-specific security rules only. Backend/Node.js security is out of scope (see Phase H).

| Item                                                                         | Status |
| ---------------------------------------------------------------------------- | ------ |
| `docs/security.md` — new document                                            | ⬜     |
| XSS: no `dangerouslySetInnerHTML` without explicit sanitiser                 | ⬜     |
| No `eval()`, `new Function()`, dynamic `import()` with user input            | ⬜     |
| Dependency audit: `npm audit` as a quality gate step                         | ⬜     |
| Secrets: never commit `.env` — `.env.example` pattern enforced               | ⬜     |
| Token exposure: no auth tokens in `localStorage` — prefer `httpOnly` cookies | ⬜     |
| Content-Security-Policy header guidance for Next.js / Vite apps              | ⬜     |
| AGENTS.md §12 entry wired to the new doc                                     | ⬜     |

---

## Phase D — Contributing Guide (⬜ Planned)

All three main competitors (airbnb/javascript, goldbergyoni/nodebestpractices, elsewhencode/project-guidelines) have a public `CONTRIBUTING.md`. This repo does not. Without it, there is no stated path for someone who disagrees with a rule or wants to propose a new one.

| Item                                                                            | Status |
| ------------------------------------------------------------------------------- | ------ |
| `CONTRIBUTING.md` at repo root — how to propose a rule change                   | ⬜     |
| Rule proposal template: problem statement → proposed rule → rationale → example | ⬜     |
| Explicit process: open issue first, discuss, then PR                            | ⬜     |
| Scope statement: what rule types belong here vs. in a private extension         | ⬜     |
| `docs/contributing.md` — Docusaurus-surfaced version of the same                | ⬜     |

---

## Phase E — External Citations Pass (⬜ Planned)

Many rules in AGENTS.md are stated as non-negotiable without linking to the evidence that makes them non-negotiable. Node Best Practices links to MDN, research papers, and blog posts for every single rule. Without citations, individual rules are easy to challenge and hard to defend in a code review.

**This is not about adding more rules — it is about strengthening the authority of rules already written.**

| Item                                                                       | Status |
| -------------------------------------------------------------------------- | ------ |
| Audit every rule in AGENTS.md: does it have a "why" with an external link? | ⬜     |
| Add MDN links for accessibility rules (ARIA, contrast ratios)              | ⬜     |
| Add WCAG 2.2 spec links for specific success criteria referenced           | ⬜     |
| Add MUI docs links for `forwardRef`, `sx`, `shouldForwardProp` rules       | ⬜     |
| Add React docs links for hooks rules, `displayName`, render patterns       | ⬜     |
| Add research/blog citations for `forwardRef` + `displayName` value         | ⬜     |

---

## Phase F — Performance Section (⬜ Planned)

Node Best Practices has a performance section. The current standards have performance-adjacent rules scattered through component structure (`useMemo`, `useCallback`, module-level `sx` constants) but no dedicated document that a developer can reference when asking "how should I think about performance in this stack?"

| Item                                                                    | Status |
| ----------------------------------------------------------------------- | ------ |
| `docs/performance.md` — new document                                    | ⬜     |
| `useMemo` / `useCallback` — when required vs. premature optimisation    | ⬜     |
| Module-level `sx` constants vs. inline objects — render cost rule       | ⬜     |
| Bundle size: subpath exports pattern (tree-shaking discipline)          | ⬜     |
| Image optimisation: `next/image`, resolution minimums, SVG optimisation | ⬜     |
| Core Web Vitals baseline: LCP, CLS, INP targets for Next.js projects    | ⬜     |
| AGENTS.md §13 entry wired to the new doc                                | ⬜     |

---

## Phase G — Reference Implementation (⬜ Planned)

Node Best Practices built [Practica.js](https://github.com/practicajs/practica) — a working application that implements all rules, so a developer can see compliance in working code rather than just prose. This repo references `giselle-mui` as the implementing library but does not position it as such or link to it.

| Item                                                                               | Status |
| ---------------------------------------------------------------------------------- | ------ |
| Add "Reference Implementations" section to `intro.mdx`                             | ⬜     |
| Link `giselle-mui` as the React/MUI reference library (component rules)            | ⬜     |
| Link `oss-quality-standards` itself as a reference for the quality gate setup      | ⬜     |
| Document which specific rules each reference repo demonstrates                     | ⬜     |
| (Future) Minimal standalone example app showing the full gate in a Next.js project | ⬜     |

---

## Phase H — Framework Scope Expansion (⬜ Planned — no timeline)

AGENTS.md currently scopes to React + MUI. Sections §1–§4 and §11 are framework-agnostic and apply to any repo. Vue and Angular rule sets are explicitly deferred until the React/MUI section is stable.

**Prerequisite:** Phases B–F must be complete before expanding scope. Adding more frameworks before the core is fully cited and tested would spread the maintenance burden too thin.

| Item                                                   | Status |
| ------------------------------------------------------ | ------ |
| Vue 3 + Vite rule set (`docs/vue/`)                    | ⬜     |
| Angular rule set (`docs/angular/`)                     | ⬜     |
| Separate AGENTS barrel entries per framework           | ⬜     |
| Framework-agnostic §1–§4 extracted to a shared include | ⬜     |

---

## Phase I — Release Management (⬜ Planned)

The `giselle-*` packages have no standardised versioning or changelog workflow. Each package is released manually with no automated CHANGELOG generation, no version bump protocol, and no npm publish workflow. As the library matures toward a stable API, this gap becomes a credibility problem: any developer considering adopting the library will look for a CHANGELOG and find none.

**Scope:** Document and implement [Changesets](https://github.com/changesets/changesets) as the standard release-management tool for packages in the LittleBranches ecosystem.

| Item                                                                                                           | Status |
| -------------------------------------------------------------------------------------------------------------- | ------ |
| `docs/release-management.md` — new document covering the Changesets workflow                                   | ⬜     |
| Add `@changesets/cli` to each package (`giselle-mui`, `giselle-sections-sdk`, `giselle-ui`)                    | ⬜     |
| `.changeset/config.json` per package — linked to the correct npm org                                           | ⬜     |
| Document "write a changeset per PR" as a mandatory step in the quality gate                                    | ⬜     |
| GitHub Actions release workflow: `.github/workflows/release.yml` — bumps versions + publishes on merge to main | ⬜     |
| `CHANGELOG.md` bootstrapped per package from existing git history                                              | ⬜     |
| AGENTS.md §3 (Quality Gate) — add changeset requirement to the pre-push checklist                              | ⬜     |
| AGENTS.md §4 (PR Review) — add "changeset present?" to the reviewer checklist                                  | ⬜     |

---

## Phase J — Shared Config Packages (⬜ Planned)

Each package in the LittleBranches ecosystem currently copies its ESLint and TypeScript configuration independently. `giselle-mui` has `eslint.config.mjs`. `giselle-sections-sdk` has `tsconfig.json`. `first-branch` has its own eslint + tsconfig. All are manually kept in sync. When a rule changes (e.g. a new TypeScript target, a new ESLint plugin), it must be updated in every repo separately.

**This is the textbook case for shared config packages.** Extracting the common baseline into `@alexrebula/eslint-config` and `@alexrebula/tsconfig` eliminates config drift and makes the ecosystem's quality baseline enforceable from a single published source.

| Item                                                                                   | Status |
| -------------------------------------------------------------------------------------- | ------ |
| `docs/shared-configs.md` — document the pattern, how to use, how to extend             | ⬜     |
| `@alexrebula/eslint-config` package — flat config compatible, React + TypeScript rules | ⬜     |
| `@alexrebula/tsconfig` package — base, strict, next.js, and library variants           | ⬜     |
| Each consuming repo extends the shared base rather than duplicating rules              | ⬜     |
| AGENTS.md §3 (Quality Gate) — reference shared config packages as the standard         | ⬜     |
| Wire both packages into Phase I release workflow (Changesets)                          | ⬜     |

---

## Phase K — Monorepo Decision Record (⬜ Planned)

The LittleBranches ecosystem is currently a **polyrepo**: `giselle-mui`, `giselle-sections-sdk`, `giselle-ui`, `giselle-docs`, and `first-branch` are separate repositories. This is a deliberate choice, but the reasoning is not written down anywhere. Any developer joining the project — or any future version of the author — will ask: _"why not a monorepo?"_

Tools like [Turborepo](https://turbo.build/repo) and [Nx](https://nx.dev) are widely adopted for exactly this kind of multi-package setup. The choice to stay polyrepo is not ignorance of those tools; it is a considered trade-off that needs to be documented so it can be revisited with the same intentionality when the conditions change.

**This phase documents the current decision and sets the trigger conditions for revisiting it.**

| Item                                                                                         | Status |
| -------------------------------------------------------------------------------------------- | ------ |
| `docs/monorepo-decision.md` — ADR-style document                                             | ⬜     |
| State the current choice: polyrepo                                                           | ⬜     |
| Explain the reason: `alexrebula` is proprietary and cannot share a repo with public packages | ⬜     |
| Explain the cost: manual `yalc push` workflow, no shared CI pipeline, config drift risk      | ⬜     |
| Document the trigger conditions for migration: when would a monorepo become the right call?  | ⬜     |
| Cover Turborepo and Nx as the primary candidates — what each offers and the trade-offs       | ⬜     |
| AGENTS.md §3 (Quality Gate) — note the polyrepo constraint on inter-package dev workflow     | ⬜     |

---

## How to contribute to this roadmap

See [Phase D — Contributing Guide](#phase-d--contributing-guide--planned) — a contributing guide does not exist yet. Until it does:

1. Open a GitHub issue on [`LittleBranches/oss-quality-standards`](https://github.com/LittleBranches/oss-quality-standards/issues) describing the gap or proposed addition.
2. Reference the relevant phase from this roadmap if applicable.
3. A PR will be opened once the proposal is agreed in the issue.
