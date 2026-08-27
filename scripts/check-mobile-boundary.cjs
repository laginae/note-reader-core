const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceFiles = [path.join(root, 'index.js')]
  .concat(fs.readdirSync(path.join(root, 'src')).map((name) => path.join(root, 'src', name)));
const forbidden = [
  /require\(['"](?:node:)?(?:child_process|crypto|electron|fs|https?|os|path|url)['"]\)/,
  /\bBuffer\b/,
  /\bprocess\./,
  /\(\?<=[^)]/,
  /\(\?<![^)]/,
];

const failures = [];
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(source)) {
      failures.push(`${path.relative(root, file)} matched ${pattern}`);
    }
  }
}

if (failures.length) {
  throw new Error(`Mobile boundary check failed:\n${failures.join('\n')}`);
}
console.log(`Mobile boundary check passed for ${sourceFiles.length} source files.`);
