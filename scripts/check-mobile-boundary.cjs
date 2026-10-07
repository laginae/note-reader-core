'use strict';

const fs = require('node:fs');
const path = require('node:path');

function checkSource(source) {
  const violations = [];
  const patterns = [
    ['host API', /\b(?:Buffer|process|global|window|document|navigator|fetch|XMLHttpRequest|WebSocket|localStorage|indexedDB|Deno|Bun)\b/],
    ['lookbehind', /\(\?<[-=]/],
    ['dynamic evaluation', /\b(?:eval|Function)\s*\(/],
    ['ES module import', /\b(?:import|export)\b/],
  ];
  for (const [label, pattern] of patterns) {
    if (pattern.test(source)) violations.push(label);
  }
  // Runtime modules may load only literal, package-local CommonJS modules.
  const calls = source.match(/\brequire\s*\(/g) || [];
  const literals = [...source.matchAll(/\brequire\s*\(\s*(['"])([^'"]+)\1\s*\)/g)];
  if (calls.length !== literals.length) violations.push('dynamic require');
  if (literals.some(match => !/^\.\/[A-Za-z0-9_/-]+(?:\.js)?$/.test(match[2]))) violations.push('non-local dependency');
  return violations;
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(fullPath) : /\.js$/.test(entry.name) ? [fullPath] : [];
  });
}

function checkMobileBoundary(root = path.resolve(__dirname, '..')) {
  const files = [path.join(root, 'index.js'), ...sourceFiles(path.join(root, 'src'))];
  const failures = files.flatMap(file => checkSource(fs.readFileSync(file, 'utf8'))
    .map(rule => `${path.relative(root, file)}: ${rule}`));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (Object.keys(pkg.dependencies || {}).length || Object.keys(pkg.optionalDependencies || {}).length) {
    failures.push('runtime dependencies must be audited before adoption');
  }
  if (failures.length) throw new Error(`Mobile boundary check failed:\n${failures.join('\n')}`);
  return files.length;
}

module.exports = { checkSource, checkMobileBoundary };
if (require.main === module) console.log(`Mobile boundary check passed for ${checkMobileBoundary()} source files.`);
