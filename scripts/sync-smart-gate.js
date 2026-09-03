#!/usr/bin/env node
/**
 * sync-smart-gate.js
 *
 * Propagates smart-gate-core to each registered consumer repo.
 *
 * The canonical source is scripts/smart-gate-core.ts (real TypeScript, typechecked
 * by this repo's own `npm run typecheck` — no special setup). Consumers receive a
 * compiled, plain-JS build instead of the raw .ts source: this script always
 * recompiles first (`tsc -p scripts/tsconfig.build.json`), then distributes
 * scripts/dist/smart-gate-core.js as <consumer>/scripts/smart-gate-core.js —
 * same filename, same extension, same runtime artifact consumers have always
 * received. No consumer needs a newer Node version, a scripts/tsconfig.json, or
 * any change to its own quality-gate.js import to pick this up.
 *
 * Usage:
 *   node scripts/sync-smart-gate.js <path-to-consumer-repo> [<path> ...]
 *
 * Example (run from oss-quality-standards root):
 *   node scripts/sync-smart-gate.js ../giselle-mui ../giselle-sections-sdk
 *
 * If the target file is already identical to the freshly-built source, it is
 * skipped with "up to date".
 *
 * Rule: run this before any PR that changes smart-gate behavior in a consumer repo.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const SOURCE = path.resolve(__dirname, 'dist', 'smart-gate-core.js');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/sync-smart-gate.js <consumer-repo-path> [...more]');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/sync-smart-gate.js ../giselle-mui ../giselle-sections-sdk');
  process.exit(1);
}

// Always rebuild from the TypeScript source before distributing — never trust
// a possibly-stale scripts/dist/ left over from an earlier run.
console.log('Building smart-gate-core.ts…');
execFileSync('npx', ['tsc', '-p', 'scripts/tsconfig.build.json'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

if (!existsSync(SOURCE)) {
  console.error(`Source not found: ${SOURCE}`);
  process.exit(1);
}

const sourceContent = readFileSync(SOURCE, 'utf8');
let allOk = true;
let failedCount = 0;

console.log('');
console.log('Syncing smart-gate-core.js to consumer repos…');

for (const target of args) {
  const absTarget = path.resolve(process.cwd(), target);
  const targetScripts = path.join(absTarget, 'scripts');
  const targetFile = path.join(targetScripts, 'smart-gate-core.js');

  if (!existsSync(absTarget)) {
    console.error(`  ✗  ${target} — repo not found at ${absTarget}`);
    allOk = false;
    failedCount++;
    continue;
  }

  // Create scripts/ directory if it doesn't exist yet.
  if (!existsSync(targetScripts)) {
    mkdirSync(targetScripts, { recursive: true });
  }

  // Skip if the existing file is byte-for-byte identical.
  if (existsSync(targetFile)) {
    const existing = readFileSync(targetFile, 'utf8');
    if (existing === sourceContent) {
      console.log(`  ✓  ${target} — already up to date`);
      continue;
    }
  }

  try {
    copyFileSync(SOURCE, targetFile);
    console.log(`  ✓  ${target} — synced`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  ✗  ${target} — copy failed: ${message}`);
    allOk = false;
    failedCount++;
  }
}

console.log('');
if (allOk) {
  console.log('✅  Sync complete');
  process.exit(0);
} else {
  console.error(`❌  ${failedCount} of ${args.length} target(s) failed — check paths above`);
  process.exit(1);
}
