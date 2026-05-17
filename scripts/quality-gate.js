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
 */

import { execSync, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIX_MODE = process.argv.includes('--fix');
const INCLUDE_STORYBOOK =
  !process.argv.includes('--no-storybook') &&
  (process.argv.includes('--storybook') || process.env['CI'] === 'true');

const appDir = path.resolve(__dirname, '..');

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
      'Banned content — prohibited identifier name or private reference found in docs/ or src/. See output above.'
    );
  }
}

// 0b. Structure check (optional — only if the script exists)
const structureScript = path.join(appDir, 'scripts', 'check-structure.js');
if (existsSync(structureScript)) {
  if (!run('Structure check', 'node scripts/check-structure.js', { fatal: false })) {
    failures.push(
      'Structure — flat component file(s) found under src/components/; move each into its own named subfolder.'
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
if (!run('ESLint (--max-warnings 0)', 'npm run lint -- --max-warnings 0', { fatal: false })) {
  failures.push(
    'ESLint — run `npm run lint:fix` to auto-fix, then fix remaining errors/warnings manually'
  );
}

// 3. TypeScript
if (!run('TypeScript (tsc --noEmit)', 'npx tsc --noEmit', { fatal: false })) {
  failures.push('TypeScript — fix all type errors above');
}

// 4. Tests
if (!run('Tests (vitest)', 'npm test', { fatal: false })) {
  failures.push('Tests — fix failing tests above');
}

// 5. tsup build
if (!run('tsup build', 'npm run build', { fatal: false })) {
  failures.push('tsup build — the library failed to compile; fix build errors above');
}

// 6. Storybook build (CI always; opt-in locally)
if (INCLUDE_STORYBOOK) {
  if (!run('Storybook build', 'npm run build-storybook', { fatal: false })) {
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
