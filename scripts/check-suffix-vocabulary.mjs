#!/usr/bin/env node
// @ts-check
/**
 * check-suffix-vocabulary.mjs
 *
 * Checks that the suffix list in docs/AGENTS.md §7.2 matches the suffix table
 * in docs/naming-conventions.md. AGENTS.md is meant to be loadable on its own,
 * so it keeps its own copy of the list; this check stops the copies drifting.
 *
 * Exit codes: 0 = lists match, 1 = lists differ or a list was not found.
 */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Return the text between a heading and the next heading.
 * @param {string} file path relative to the repo root
 * @param {string} heading the full heading line
 */
function section(file, heading) {
  const content = readFileSync(path.join(ROOT, file), 'utf-8');
  const start = content.indexOf(`\n${heading}\n`);
  if (start === -1) return '';
  const rest = content.slice(start + heading.length + 2);
  const end = rest.search(/^#{1,3} /m);
  return end === -1 ? rest : rest.slice(0, end);
}

// First column of rows shaped like "| `Card` | ... |".
const table = [
  ...section('docs/naming-conventions.md', '## Suffix vocabulary').matchAll(/^\|\s*`(\w+)`/gm),
].map((m) => m[1]);

// Every backticked word in the first paragraph of §7.2.
const firstParagraph = section('docs/AGENTS.md', '### 7.2 — Suffix vocabulary')
  .trim()
  .split(/\n\s*\n/)[0];
const agents = [...firstParagraph.matchAll(/`(\w+)`/g)].map((m) => m[1]);

const sorted = (/** @type {string[]} */ list) => [...list].sort().join(', ');

if (table.length > 0 && sorted(table) === sorted(agents)) {
  console.log(`✓ Suffix vocabulary check passed — ${table.length} suffixes match`);
  process.exit(0);
}

console.error('\n❌  Suffix vocabulary lists differ:\n');
console.error(`  docs/naming-conventions.md table: ${sorted(table) || '(not found)'}`);
console.error(`  docs/AGENTS.md §7.2:              ${sorted(agents) || '(not found)'}\n`);
console.error('Fix: make the two lists match. Adding a suffix is a team decision.');
process.exit(1);
