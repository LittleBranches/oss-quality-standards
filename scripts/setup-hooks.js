/**
 * Wires .githooks/ as the git hooks directory on postinstall.
 * Run automatically via `npm install`.
 */
const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const hooksDir = path.resolve(__dirname, '..', '.githooks');

if (existsSync(hooksDir)) {
  execSync('git config core.hooksPath .githooks');
  console.log('✓ Git hooks configured: .githooks/');
} else {
  console.warn('Warning: .githooks/ directory not found — hooks not wired.');
}
