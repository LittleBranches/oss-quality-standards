#!/usr/bin/env node
/**
 * quality-gate.js
 *
 * Runs all quality checks for a LittleBranches repository.
 * Copy this script into any repo and add the npm scripts below.
 *
 * npm scripts to add in package.json:
 *   "check"        : "node scripts/quality-gate.js --fix"
 *   "check:verify" : "node scripts/quality-gate.js --verify"
 *
 * Called automatically by:
 *   - .githooks/pre-push  (before every push)
 *   - .github/workflows/ci.yml  (CI, with CI=true)
 *
 * Checks performed (in order):
 *   0a. Banned content scan (if scripts/check-banned-content.js exists)
 *   0b. Structure check (if scripts/check-structure.js exists)
 *   1.  Prettier — format check / auto-fix
 *   2.  ESLint   — react-hooks, unused-imports, TypeScript rules
 *   3.  TypeScript — tsc --noEmit
 *   4.  Vitest   — unit tests
 *   5.  tsup build — library compilation
 *   6.  Storybook build — always on in CI; opt-in locally with --storybook
 *
 * Flags:
 *   --fix          Auto-fix Prettier + ESLint before read-only checks
 *   --verify       Read-only mode (default for pre-push and CI)
 *   --storybook    Force-include the Storybook build
 *   --no-storybook Skip the Storybook build even in CI
 *
 * Exit codes: 0 = all passed, 1 = at least one check failed.
 *
 * Yalc dependency-resolution leniency (local only, never in CI):
 *   ESLint, TypeScript, Tests, tsup build, and Storybook build all resolve
 *   modules and can fail because of an unrelated, in-progress breaking
 *   change in a yalc-linked dependency rather than a real regression in
 *   this repo. When one of those steps fails locally and its output
 *   implicates a package currently linked via yalc.lock, the gate warns
 *   instead of blocking the push. CI always treats the same failure as
 *   blocking — see docs/quality-gate.md.
 */

import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIX_MODE = process.argv.includes('--fix');
const INCLUDE_STORYBOOK =
  !process.argv.includes('--no-storybook') &&
  (process.argv.includes('--storybook') || process.env['CI'] === 'true');
const IS_CI = process.env['CI'] === 'true';

const appDir = path.resolve(__dirname, '..');

// ── Yalc dependency-resolution failure detection ──────────────────────────
// Kept in sync by hand with the equivalent functions in smart-gate-core.ts
// (this file is a self-contained, standalone copy per its own header comment
// — it deliberately has no other script dependencies).

/** @param {string[]} dirs @returns {string[]} */
function loadYalcLinkedPackages(dirs) {
  const names = new Set();
  for (const dir of dirs) {
    const lockPath = path.join(dir, 'yalc.lock');
    if (!existsSync(lockPath)) continue;
    try {
      const data = JSON.parse(readFileSync(lockPath, 'utf8'));
      for (const name of Object.keys(data.packages ?? {})) names.add(name);
    } catch {
      // Malformed or unreadable lockfile — never let this block a check.
    }
  }
  return [...names];
}

/** @param {string} output @param {string[]} yalcLinkedPackages @returns {boolean} */
function isLikelyYalcFailure(output, yalcLinkedPackages) {
  if (!output || yalcLinkedPackages.length === 0) return false;
  return yalcLinkedPackages.some((pkg) => output.includes(pkg));
}

// Package names currently linked via yalc — used to recognize a
// dependency-resolution failure that isn't this repo's own regression.
const yalcLinkedPackages = loadYalcLinkedPackages([appDir]);

function run(label, cmd, { fatal = true } = {}) {
  console.log(`\n→ ${label}…`);
  try {
    execSync(cmd, { cwd: appDir, stdio: 'inherit' });
    console.log(`✓ ${label} passed`);
    return true;
  } catch {
    console.error(`\n❌  ${label} failed`);
    if (fatal) process.exit(1);
    return false;
  }
}

/**
 * Like `run`, but tees the child process's combined output to the console
 * live (same experience as `run`) while also buffering it, so a failure can
 * be checked against `yalcLinkedPackages`. Returns a Promise since piping
 * requires an async child process rather than execSync.
 *
 * @param {string} label
 * @param {string} cmd
 * @param {{ fatal?: boolean }} [opts]
 * @returns {Promise<boolean>}
 */
function runCheckedForYalc(label, cmd, { fatal = true } = {}) {
  return new Promise((resolve) => {
    console.log(`\n→ ${label}…`);
    const child = spawn(cmd, { cwd: appDir, shell: true });
    let output = '';
    const tee = (stream) => (chunk) => {
      stream.write(chunk);
      output += chunk.toString();
    };
    child.stdout.on('data', tee(process.stdout));
    child.stderr.on('data', tee(process.stderr));
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ ${label} passed`);
        resolve(true);
        return;
      }
      if (!IS_CI && isLikelyYalcFailure(output, yalcLinkedPackages)) {
        console.warn(
          `\n⚠  ${label} failed, but the output implicates a yalc-linked package — ` +
            `treating this as an unrelated dependency issue, not a regression. Not blocking this push.`,
        );
        resolve(true);
        return;
      }
      console.error(`\n❌  ${label} failed`);
      if (fatal) process.exit(1);
      resolve(false);
    });
  });
}

async function main() {
  console.log('');
  console.log('══════════════════════════════════════════════════════════');
  console.log(' Quality gate — LittleBranches');
  if (FIX_MODE) console.log(' Mode: auto-fix + verify');
  else console.log(' Mode: verify only (use --fix to auto-fix)');
  if (INCLUDE_STORYBOOK) console.log(' Storybook build: enabled');
  console.log('══════════════════════════════════════════════════════════');

  const failures = [];

  // 0a. Banned content scan (optional — only if the script exists)
  const bannedContentScript = path.join(appDir, 'scripts', 'check-banned-content.js');
  if (existsSync(bannedContentScript)) {
    if (!run('Banned content scan', 'node scripts/check-banned-content.js', { fatal: false })) {
      failures.push(
        'Banned content — prohibited identifier name or private reference found in docs/ or src/. See output above.',
      );
    }
  }

  // 0b. Structure check (optional — only if the script exists)
  const structureScript = path.join(appDir, 'scripts', 'check-structure.js');
  if (existsSync(structureScript)) {
    if (!run('Structure check', 'node scripts/check-structure.js', { fatal: false })) {
      failures.push(
        'Structure — flat component file(s) found under src/components/; move each into its own named subfolder.',
      );
    }
  }

  // 1. Prettier
  if (FIX_MODE) {
    run('Prettier auto-fix', 'npm run fm:fix', { fatal: false });
  } else {
    if (!run('Prettier format check', 'npm run fm:check', { fatal: false })) {
      failures.push('Prettier — run `npm run fm:fix` to auto-fix');
    }
  }

  // 2. ESLint
  if (FIX_MODE) {
    run('ESLint auto-fix', 'npm run lint:fix', { fatal: false });
  }
  if (
    !(await runCheckedForYalc('ESLint (--max-warnings 0)', 'npm run lint -- --max-warnings 0', {
      fatal: false,
    }))
  ) {
    failures.push(
      'ESLint — run `npm run lint:fix` to auto-fix, then fix remaining errors/warnings manually',
    );
  }

  // 3. TypeScript
  if (
    !(await runCheckedForYalc('TypeScript (tsc --noEmit)', 'npx tsc --noEmit', { fatal: false }))
  ) {
    failures.push('TypeScript — fix all type errors above');
  }

  // 4. Tests
  if (!(await runCheckedForYalc('Tests (vitest)', 'npm test', { fatal: false }))) {
    failures.push('Tests — fix failing tests above');
  }

  // 5. tsup build
  if (!(await runCheckedForYalc('tsup build', 'npm run build', { fatal: false }))) {
    failures.push('tsup build — the library failed to compile; fix build errors above');
  }

  // 6. Storybook build (CI always; opt-in locally)
  if (INCLUDE_STORYBOOK) {
    if (
      !(await runCheckedForYalc('Storybook build', 'npm run build-storybook', { fatal: false }))
    ) {
      failures.push('Storybook build — fix broken stories above');
    }
  }

  console.log('');
  console.log('══════════════════════════════════════════════════════════');

  if (failures.length === 0) {
    console.log(' ✅  All checks passed');
    console.log('══════════════════════════════════════════════════════════');
    process.exit(0);
  } else {
    console.error(` ❌  ${failures.length} check(s) failed:\n`);
    for (const f of failures) {
      console.error(`   • ${f}`);
    }
    console.log('══════════════════════════════════════════════════════════');
    process.exit(1);
  }
}

main();
