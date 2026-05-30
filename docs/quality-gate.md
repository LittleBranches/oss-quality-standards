---
id: quality-gate
title: Quality Gate
sidebar_position: 7
---

# Quality Gate — Expanded Guide

> The rules are in [AGENTS.md §3](./AGENTS.md#3-quality-gate). This page covers setup for a new repo, troubleshooting, and how to add or remove checks.

---

## Adding the gate to a new repo

**1. Copy the scripts**

```sh
cp scripts/quality-gate.js <new-repo>/scripts/
cp scripts/check-structure.js <new-repo>/scripts/   # only if the repo has components
```

For the banned content check, copy `check-banned-content.js` from `oss-quality-standards-private`.

**2. Add npm scripts to `package.json`**

```json
{
  "scripts": {
    "check": "node scripts/quality-gate.js --fix",
    "check:verify": "node scripts/quality-gate.js --verify"
  }
}
```

**3. Add the pre-push hook**

Create `.githooks/pre-push`:

```sh
#!/bin/sh
npm run check:verify
```

Make it executable and configure git to use the folder:

```sh
chmod +x .githooks/pre-push
git config core.hooksPath .githooks
```

**4. Add to CI**

```yaml
# .github/workflows/ci.yml
- name: Quality gate
  run: npm run check:verify
  env:
    CI: true # enables Storybook build automatically
```

---

## Troubleshooting

### Gate passes locally but fails in CI

Most common cause: you ran `npm run check` (with `--fix`) locally, which auto-formatted files. CI runs `check:verify` (read-only) and sees the unformatted originals.

Fix: always run `npm run check:verify` before pushing, not `npm run check`.

Second cause: Node.js version mismatch. CI uses a pinned version; locally you may be on a different one. Check `.nvmrc` or the `engines` field in `package.json`.

### Prettier keeps re-failing after `fm:fix`

The editor's auto-formatter is applying different rules than Prettier. Check that the editor is picking up `.prettierrc` and not using its own defaults. In VS Code, set `"editor.defaultFormatter": "esbenp.prettier-vscode"` and `"editor.formatOnSave": true`.

### ESLint fails with "0 warnings allowed" on a line you didn't write

The gate runs ESLint with `--max-warnings 0`, which treats warnings as errors. If the warning is a genuine false positive, suppress it with a targeted inline disable:

```ts
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Never use `eslint-disable-file` — it silences all warnings in the file and hides real issues.

### Structure check flags a file that should be allowed flat

Add the filename pattern to `isAllowedFlat` in `scripts/check-structure.js`:

```js
const isAllowedFlat = (filename) =>
  ALLOWED_FLAT_FILES.has(filename) ||
  filename.startsWith('use-') ||
  filename.endsWith('.stories.tsx') ||
  filename.startsWith('your-new-pattern'); // ← add here
```

Document the reason in a comment so the next person knows why it's allowed.

### tsup build fails but `tsc --noEmit` passes

`tsc --noEmit` only checks types — it doesn't run the bundler. tsup may fail for separate reasons: missing peer dependencies, incorrect `exports` config in `package.json`, or a file that imports from a path that exists locally but isn't in the published bundle. Read the tsup output carefully — it usually names the problematic import.

---

## Adding a new check

All checks are steps in `scripts/quality-gate.js`. To add one:

```js
// Add after the existing checks, before the summary block
if (!run('My new check', 'node scripts/my-check.js', { fatal: false })) {
  failures.push('My new check — description of what failed and how to fix it');
}
```

Guidelines:

- Use `fatal: false` so the gate continues and reports all failures at once rather than stopping at the first.
- Keep the failure message actionable — tell the developer exactly what to run to fix it.
- If the check is optional (like Storybook), gate it behind a flag or an `existsSync` check.

---

## Smart gate (pre-push only)

The smart gate is an opt-in mode that skips heavy steps when the changed files
don't require them. It is **enabled by default in the pre-push hook** and always
disabled in CI. The full gate is always used in CI regardless of flags.

### How it works

The gate resolves the diff with three fallbacks in order:

1. **Upstream tracking branch** — `git diff --name-only @{u}...HEAD` — most precise,
   only shows commits not yet pushed to the remote branch.
2. **Merge-base** — `git diff --name-only $(git merge-base HEAD main)` — covers
   squash/rebase workflows where there is no upstream tracking branch.
3. **Fallback** — diff resolution failed; the full gate runs as a safe default.

Once the diff is known, each heavy step is evaluated independently:

| Step            | Triggered when                                                                       |
| --------------- | ------------------------------------------------------------------------------------ |
| Tests           | Any `src/` file changed (targeted by co-located `.test.ts`; full suite if >25 files) |
| tsup build      | `src/`, `tsup.config.ts`, `tsconfig.json`, or `package.json` changed                 |
| Storybook build | `src/`, `*.stories.tsx`, or `.storybook/` changed                                    |

Core static checks (banned content, structure, prettier, eslint, tsc) always run.

### Flags

| Flag            | Effect                                                   |
| --------------- | -------------------------------------------------------- |
| `--smart`       | Enable smart mode (skip untriggered heavy steps)         |
| `--full`        | Force full gate (overrides `--smart`)                    |
| `--log-metrics` | Append a JSON timing record to `scripts/gate-timing.log` |

### npm scripts

```json
{
  "check:verify:smart": "node scripts/quality-gate.js --verify --smart --storybook",
  "check:verify:full": "node scripts/quality-gate.js --verify --storybook"
}
```

### Adding smart mode to a new repo

**1. Copy the shared core module**

Run the sync script from `oss-quality-standards`:

```sh
node scripts/sync-smart-gate.js /path/to/new-repo
```

This copies `scripts/smart-gate-core.js` to the consumer's `scripts/` folder.

**2. Wire the import at the top of `quality-gate.js`**

```js
import {
  FULL_FILE_THRESHOLD,
  resolveChangedFiles,
  evaluateTriggers,
  resolveTargetedTests,
} from './smart-gate-core.js';
```

**3. Add smart-mode flags and orchestration** (see `giselle-mui/scripts/quality-gate.js`
for the full reference implementation).

**4. Update the pre-push hook**

```sh
"$NODE" scripts/quality-gate.js --verify --smart --storybook
```

**5. Add to `.gitignore`**

```
# Smart gate telemetry log — local only
scripts/gate-timing.log
```

### Sync rule — non-negotiable

Any PR that changes smart-gate behavior in a consumer repo must:

1. Run `node scripts/sync-smart-gate.js <consumer-repo-path>` to keep the vendored
   `smart-gate-core.js` in sync with the canonical source.
2. Include timing evidence in the PR description:
   - Baseline full gate timing on the same change set
   - Smart gate timing on the same change set
   - Step-level executed/skipped summary from the timing output

### Acceptance criteria (pilot: giselle-mui)

- ≥30% median pre-push time reduction vs the full gate.
- Zero increase in CI false negatives.
- Rollback trigger: 2 consecutive PRs failing CI due to smart-gate misclassification.
- Rollout to the next repo only after 5 successful pilot PRs in giselle-mui.

---

## Removing or skipping a check temporarily

Never remove a check from the script without branch owner approval. If a check is temporarily broken (e.g. a flaky test in CI), gate it behind an environment variable rather than deleting it:

```js
if (!process.env['SKIP_TESTS']) {
  if (!run('Tests (vitest)', 'npm test', { fatal: false })) {
    failures.push('Tests — fix failing tests above');
  }
}
```

Set `SKIP_TESTS=1` in CI until the flakiness is resolved, then remove the env var. This makes the skip explicit and visible rather than a silent code deletion.
