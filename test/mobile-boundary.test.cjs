'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { checkSource, checkMobileBoundary } = require('../scripts/check-mobile-boundary.cjs');
const root = path.resolve(__dirname, '..');

test('runtime source has no external modules, host APIs or runtime dependencies', () => {
  assert.equal(checkMobileBoundary(), 8);
  for (const source of [
    "require('node:fs')", "require('child_process')", "require('electron')", "require('stream')",
    "require(name)", "require('../outside')", "fetch('https://example.test')", 'window.speechSynthesis',
    'process.env', 'Buffer.from(data)', "import('node:fs')", "import fs from 'fs'",
  ]) assert.ok(checkSource(source).length, source);
  assert.deepEqual(checkSource("module.exports = require('./academic-speech');"), []);
});

test('all package exports load with no Node or browser host globals', () => {
  const context = vm.createContext({ Intl: undefined });
  const modules = new Map();
  const load = filename => {
    const fullPath = path.resolve(filename.endsWith('.js') ? filename : filename + '.js');
    assert.ok(fullPath.startsWith(root + path.sep));
    if (modules.has(fullPath)) return modules.get(fullPath).exports;
    const module = { exports: {} };
    modules.set(fullPath, module);
    const source = fs.readFileSync(fullPath, 'utf8');
    const wrapper = vm.runInContext(`(function(module, exports, require) {${source}\n})`, context);
    wrapper(module, module.exports, request => {
      assert.ok(request.startsWith('./'), `Unexpected dependency: ${request}`);
      return load(path.resolve(path.dirname(fullPath), request));
    });
    return module.exports;
  };
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const target of Object.values(pkg.exports)) assert.ok(Object.keys(load(path.join(root, target))).length);
  const core = load(path.join(root, 'index.js'));
  assert.equal(core.sanitizeAcademicTextForSpeech('研究[2][4]。'), '研究 文献2和4。');
  assert.equal(core.splitOpeningAudioParts('快速开始。后续说明。', true)[0], '快速开始。');
  assert.ok(core.extractPdfTextLayout([{ str: 'Public sample.', hasEOL: true }]).text.includes('Public sample.'));
  assert.equal(core.createPlaybackQueueState(['first']).currentIndex, 0);
});
