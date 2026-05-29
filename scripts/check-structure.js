#!/usr/bin/env node
/**
 * check-structure.js
 *
 * Enforces the component folder structure convention: every component must live
 * in its own named subfolder inside its layer group. No .ts/.tsx files are
 * permitted directly under a layer or category folder.
 *
 * Customise PARENT_DIRS_TO_CHECK for the specific layer groups in your repo.
 *
 * Exit codes: 0 = all OK, 1 = violations found.
 */

import { readdirSync, statSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../src');

/**
 * Layer and category folders where component files must NOT sit flat.
 * Every .ts/.tsx file found directly in one of these folders is a violation.
 * Customise this list for each repository.
 */
const PARENT_DIRS_TO_CHECK = [
  'components',
  'components/material',
  'components/material/surfaces',
  'components/material/surfaces/card',
  'components/material/data-display',
  'components/material/layout',
  'components/material/navigation',
  'components/material/input',
  'components/chart',
  'components/motion',
  'components/section',
  'components/theming',
];

/** Files that are legitimate flat at any layer level (not component files). */
const ALLOWED_FLAT_FILES = new Set(['index.ts', 'index.tsx', 'types.ts']);
const isAllowedFlat = (filename) =>
  ALLOWED_FLAT_FILES.has(filename) ||
  filename.startsWith('use-') ||
  filename.endsWith('.stories.tsx');

const violations = [];

for (const domain of PARENT_DIRS_TO_CHECK) {
  const domainDir = path.join(srcDir, domain);
  if (!existsSync(domainDir)) continue;

  for (const entry of readdirSync(domainDir)) {
    if (!entry.endsWith('.tsx') && !entry.endsWith('.ts')) continue;
    if (isAllowedFlat(entry)) continue;

    const fullPath = path.join(domainDir, entry);
    if (statSync(fullPath).isFile()) {
      violations.push(`src/${domain}/${entry}`);
    }
  }
}

if (violations.length > 0) {
  console.error('\n❌  Structure check failed — flat component files found:\n');
  for (const v of violations) {
    console.error(`   ${v}`);
  }
  console.error(
    '\nEach component must live in its own named subfolder:\n' +
      '   ✅  src/components/<layer>/<category>/<name>/<name>.tsx\n' +
      '   ❌  src/components/<layer>/<category>/<name>.tsx\n',
  );
  process.exit(1);
} else {
  console.log('✓ Structure check passed — no flat component files');
  process.exit(0);
}
