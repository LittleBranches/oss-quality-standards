#!/usr/bin/env node
/**
 * sync-smart-gate.js
 *
 * Propagates smart-gate-core.js from the canonical source in oss-quality-standards
 * to each registered consumer repo.
 *
 * Usage:
 *   node scripts/sync-smart-gate.js <path-to-consumer-repo> [<path> ...]
 *
 * Example (run from oss-quality-standards root):
 *   node scripts/sync-smart-gate.js ../giselle-mui ../giselle-sections-sdk
 *
 * The script copies scripts/smart-gate-core.js to <consumer>/scripts/smart-gate-core.js.
 * If the target file is already identical to the source, it is skipped with "up to date".
 *
 * Rule: run this before any PR that changes smart-gate behavior in a consumer repo.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.resolve(__dirname, 'smart-gate-core.js');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/sync-smart-gate.js <consumer-repo-path> [...more]');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/sync-smart-gate.js ../giselle-mui ../giselle-sections-sdk');
  process.exit(1);
}

if (!existsSync(SOURCE)) {
  console.error(`Source not found: ${SOURCE}`);
  process.exit(1);
}

const sourceContent = readFileSync(SOURCE, 'utf8');
let allOk = true;

console.log('');
console.log('Syncing smart-gate-core.js to consumer repos…');

for (const target of args) {
  const absTarget = path.resolve(process.cwd(), target);
  const targetScripts = path.join(absTarget, 'scripts');
  const targetFile = path.join(targetScripts, 'smart-gate-core.js');

  if (!existsSync(absTarget)) {
    console.error(`  ✗  ${target} — repo not found at ${absTarget}`);
    allOk = false;
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

  copyFileSync(SOURCE, targetFile);
  console.log(`  ✓  ${target} — synced`);
}

console.log('');
if (allOk) {
  console.log('✅  Sync complete');
  process.exit(0);
} else {
  console.error('❌  One or more targets failed — check paths above');
  process.exit(1);
}
