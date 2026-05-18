---
id: code-review-guide
title: Code Review Guide
sidebar_position: 4
---

# Code Review Guide

> This guide tells any AI reviewer what to look for when reviewing a PR in a LittleBranches repository. Load [AGENTS.md](./AGENTS.md) first, then use this guide as your review checklist.
>
> `docs/pr-review-workflow.md` covers *how to respond* once you have findings. This document covers *what to find*.

---

## Before you start

1. Run (or ask for the output of) `npm run check:verify`. If the gate is red, stop and flag it — a red gate is a blocker regardless of code quality.
2. Read the PR description. Note the "What / Why / Type" to understand the intended change before looking at diffs.
3. Read every changed file before commenting on any of them. Commenting file-by-file without the full picture leads to contradictory feedback. **All file types are in scope** — this includes scripts (`.js`, `.mjs`), configuration files (`tsconfig.json`, `docusaurus.config.ts`, `package.json`, `.gitignore`), stylesheets (`.css`, `.module.css`), and content files (`.md`, `.mdx`). Do not limit the review to component files.

---

## Priority order

Review in this order. Stop at each blocking category and flag all violations before moving to the next.

| Priority | Category | Blocking? |
|---|---|---|
| 1 | Security (OWASP Top 10) | Always blocking |
| 2 | Accessibility (WCAG 2.2 AA) | Always blocking |
| 3 | Correctness (logic errors, broken contracts) | Blocking |
| 4 | Component API contract | Blocking |
| 5 | Component structure | Blocking |
| 6 | Naming conventions | Blocking |
| 7 | Testing | Blocking |
| 8 | Documentation | Blocking for public API changes |
| 9 | Code quality | Non-blocking unless severe |
| 10 | Style / formatting | Non-blocking (Prettier handles this) |

---

## 1. Security

Flag any OWASP Top 10 issue as blocking. Common patterns to look for:

- **Injection**: User input passed to `eval`, `innerHTML`, `dangerouslySetInnerHTML`, SQL builders, or shell commands without sanitisation.
- **XSS**: Any use of `dangerouslySetInnerHTML` without an explicit sanitiser (e.g. DOMPurify). Even internal data is suspect.
- **Sensitive data exposure**: Secrets, tokens, API keys, or real personal data in source files, stories, tests, or JSDoc examples.
- **Broken auth**: Client-side-only permission checks with no server enforcement.
- **Dependency confusion**: New packages added without disclosure in the PR description.

All security findings are valid — no counter-argument overrides this.

---

## 2. Accessibility

Flag any WCAG 2.2 Level AA violation as blocking. Check:

- **Icon-only buttons**: Must have `aria-label` on the `<button>`. The icon must have `aria-hidden="true"`.
- **Decorative icons**: Any icon adjacent to text that duplicates its meaning must have `aria-hidden="true"`.
- **Interactive elements**: Every button, link, input, and control must be reachable and operable by keyboard.
- **Focus rings**: `outline: none` or `outline: 0` without a visible replacement is a violation.
- **Form inputs**: Every input must have an associated `<label>` (via `htmlFor` / `id` or `aria-label`). Error messages must use `aria-describedby`.
- **Visibility toggles**: Show/hide password buttons must have `aria-label` that reflects current state and `aria-pressed`.
- **Colour contrast**: No hardcoded colours that might fall below 4.5:1 (text) or 3:1 (UI components). If a custom colour is introduced, it must be documented as contrast-verified.
- **Motion**: Any animation added without a `prefers-reduced-motion` check.

All accessibility findings are valid — no counter-argument overrides this.

See [Accessibility](./accessibility.md) for the full rule set.

---

## 3. Correctness

- Does the component do what the PR description says it does?
- Are conditional branches handled correctly (undefined, null, empty array, 0)?
- Are event handlers cleaned up (useEffect cleanup for subscriptions, timers, event listeners)?
- Are async operations guarded against unmounted components?
- Is any state mutation happening directly (instead of via setState)?

---

## 4. Component API contract

Check every changed or new component against these rules. All are blocking:

| Rule | What to look for | See |
|---|---|---|
| Props extends MUI root | `interface FooProps extends CardProps` (or equivalent) | §6.1 |
| `sx` array-safety | `sx={[{ ... }, ...(Array.isArray(sx) ? sx : [sx])]}` | §6.2 |
| `...other` passthrough | `{...other}` on the root element | §6.3 |
| No hardcoded colours | No hex, RGB, or CSS colour names — use theme tokens | §6.4 |
| No `React.FC` | `export function Foo(...)` not `const Foo: React.FC = ...` | §6.5 |
| No bare `<Box>` with semantics | `<Box>` must be a pure layout container | §6.6 |
| `shouldForwardProp` on styled | Any `styled()` call with a custom prop must filter it | §6.7 |
| `displayName` set | Every component, especially `forwardRef` / `memo` returns | §6.8 |
| `ref` forwarding | Components wrapping a DOM element or MUI component must use `forwardRef` | §6.9 |
| Icon slots typed `ReactNode` | Not a specific icon type | §6.10 |

See [Component API Contract](./component-api-contract.md) for full detail.

---

## 5. Component structure

- Is the component in its own folder: `src/components/<layer>/<category>/<name>/<name>.tsx`?
- Is there an `index.ts` barrel in the folder?
- Does the barrel export both the component and its props type?
- Are all file names correctly prefixed and suffixed (see table below)?
- Are there any flat `.tsx` files directly in a layer folder (not in a component subfolder)?

File naming quick reference:

| File | Expected name |
|---|---|
| Main component | `<name>.tsx` |
| Barrel | `index.ts` |
| Tests | `<name>.test.ts` |
| Styles | `<name>.styles.ts` |
| Style tests | `<name>.styles.test.ts` |
| Stories | `<name>.stories.tsx` |
| Constants | `<name>.const.ts` (not `.constants.ts`) |
| Defaults | `<name>.defaults.tsx` (`.tsx` — can contain JSX) |
| Utilities | `<name>.utils.ts` (not `.utilities.ts`) |
| Animations | `<name>.animations.ts` |

See [Component Structure](./component-structure.md) for migration steps.

---

## 6. Naming conventions

- Component name: noun, not a verb. Does it include the MUI base it extends?
- Does the name pass the 4-criterion test? (noun / includes base / specific suffix / no generic prefix)
- No banned prefixes: `Base*`, `Custom*`, `Common*`, `Generic*`, `My*`, `New*`, `Advanced*`.
- Folder: kebab-case. File: kebab-case matching the folder. Export: PascalCase.
- Hook files: `use-<name>.ts`. Hook export: `use<Name>`.
- Constants: `SCREAMING_SNAKE_CASE`.

See [Naming Conventions](./naming-conventions.md) for the full suffix vocabulary.

---

## 7. Testing

- Is there a `<name>.test.ts` in the component folder?
- Does it cover the smoke render, required props, each optional variant, and `...other` passthrough?
- If `forwardRef` is used, is there a ref-forwarding test?
- If style functions have conditional logic, is there a `<name>.styles.test.ts`?
- No real personal names, emails, or company names in test data.
- No mocking of functions within the same package.

See [Testing](./testing.md) for full patterns and coverage requirements.

---

## 8. Documentation

- Do all new or changed exported components/hooks have JSDoc on the function and on each prop?
- Do stories exist for the default state and each significant variant?
- Do stories contain any real personal names, company names, emails, or financial data? (blocking — zero-personal-data rule)
- If a public API changed (new props, removed props, changed types), is JSDoc updated in the same PR?
- Are there any `@example` blocks with real data?

See [Documentation Strategy](./documentation-strategy.md) for the three-tier architecture and placeholder conventions.

---

## 9. Code quality

Non-blocking unless a pattern is egregious. Flag as `⚠️ Partially valid` or `✅ Valid` depending on severity.

- No `console.log`, `TODO`, `FIXME`, or commented-out code in committed files.
- No `eslint-disable-file` (targeted inline disables are acceptable).
- Cognitive complexity: flag any function that is obviously difficult to follow; SonarQube's limit is 15.
- No `any` without a comment explaining why it is unavoidable.
- Hook dependency arrays: are all dependencies listed? Are any listed unnecessarily?
- No magic numbers — use named constants.
- No deeply nested ternaries (more than 2 levels deep → extract to a variable or function).

---

## 10. Style / formatting

Prettier and ESLint handle this automatically. Flag a style issue only if it survived the gate (which means it is either intentional or the gate was not run). If the gate was not run, that is a §1 (gate red) blocking issue, not a style issue.

---

## Writing review comments

Use the standard verdict prefixes from [AGENTS.md §4.2.2](./AGENTS.md#22--respond-to-every-thread--no-exceptions):

| Verdict | Prefix | When |
|---|---|---|
| Blocking fix required | `✅ Valid.` | Issue is clear and must be fixed |
| No action needed | `❌ Not valid.` | Concern does not apply |
| Partial fix | `⚠️ Partially valid.` | Some of the concern is right |
| Needs owner input | `⏸️ Needs branch owner input.` | Cannot resolve without more context |

Each comment must reference the specific rule it enforces (e.g. "AGENTS.md §6.2 — sx array-safety") so the author can look it up rather than having to take your word for it.

Leave a comment on every issue found, even minor ones — silence is ambiguous. If you have nothing to flag in a category, you do not need to comment on it.

After completing the review, post findings using the GitHub pull request reviews API — the same mechanism Copilot uses. This produces inline comments on specific file lines in the "Files changed" tab, plus a top-level summary body, all as one atomic review submission.

**Where each finding goes:**

| Finding type | Where to post |
|---|---|
| Line-specific issue (wrong value, missing attribute, broken reference) | Inline comment on the exact file + line |
| Architectural / general note (no specific line) | Review body |
| Overall verdict | Review body |
| Footnote | Review body (closing line) |

**How to post:**

```sh
# Step 1 — get the head commit SHA
COMMIT=$(gh pr view <N> --repo <owner>/<repo> --json headRefOid --jq '.headRefOid')

# Step 2 — submit the review
gh api --method POST /repos/<owner>/<repo>/pulls/<N>/reviews \
  --input - <<EOF
{
  "commit_id": "$COMMIT",
  "event": "COMMENT",
  "body": "<overall verdict, architectural notes, footnote>",
  "comments": [
    {
      "path": "<file path relative to repo root>",
      "line": <line number>,
      "side": "RIGHT",
      "body": "<verdict prefix> <finding referencing the rule>"
    }
  ]
}
EOF
```

Add one object to `comments` for each line-specific finding. Use `event: "COMMENT"` — never `"APPROVE"` or `"REQUEST_CHANGES"` (branch owner approves; AI only comments).

Every review comment and every follow-up update — must close with a footnote in the review body:

```
---
*Review by <GitHub username> · in collaboration with <model name>*
```

Example: `*Review by AlexRebula · in collaboration with Claude Sonnet 4.6*`

The footnote identifies who is accountable for the review and which model assisted, creating a permanent audit trail in the PR timeline.

---

## What to do if the quality gate was not run

If the PR diff shows clear formatting inconsistencies, linting errors, or TypeScript errors, flag it as a single blocking comment on the PR (not inline):

```
⛔ Quality gate not run. Please run `npm run check:verify` and push the result before this review proceeds.
The following issues are visible from the diff: [list them].
```

Do not continue reviewing until the gate is green. Running the gate may surface additional violations that render other review comments moot.
