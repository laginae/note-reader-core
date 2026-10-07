'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { splitOpeningAudioParts, splitTextForSpeechChunks, normalizeChunkText } = require('../index');
const compact = text => text.replace(/\s/g, '');

test('opening audio uses 20, then 40 new characters, then the remainder', () => {
  const first = '字'.repeat(19) + '。';
  const second = '文'.repeat(39) + '。';
  const tail = '剩余内容。'.repeat(20);
  assert.deepEqual(splitOpeningAudioParts(first + second + tail), [first, second, tail]);
  assert.deepEqual(splitOpeningAudioParts('短句。'.repeat(30)).map(t => t.length), [21, 42, 27]);
});

test('rapid opening accepts a complete 5-to-19-character sentence, not bare numbering', () => {
  const tail = '这是后面的一段较长的说明文字，必须保留。'.repeat(4);
  assert.equal(splitOpeningAudioParts('快速开始。' + tail, true)[0], '快速开始。');
  assert.notEqual(splitOpeningAudioParts('快速开始。' + tail)[0], '快速开始。');
  assert.notEqual(splitOpeningAudioParts('短句。' + tail, true)[0], '短句。');
  assert.notEqual(splitOpeningAudioParts('1234. ' + tail, true)[0], '1234.');
  assert.notEqual(splitOpeningAudioParts('VIII. ' + tail, true)[0], 'VIII.');
});

test('long sentences are intact and text without sentence punctuation is not arbitrarily split', () => {
  const long = '长'.repeat(100) + '。';
  assert.equal(splitOpeningAudioParts(long + '后续。'.repeat(30))[0], long);
  for (const value of ['', '短句。', 'No sentence punctuation', 'Heading\n\nDr. Smith measured 0.95. Another sentence follows.']) {
    for (const rapid of [false, true]) {
      const parts = splitOpeningAudioParts(value, rapid);
      assert.ok(parts.length <= 3);
      assert.equal(compact(parts.join('')), compact(normalizeChunkText(value)));
    }
  }
});

test('opening subdivision does not mutate logical chunks or lose their tail', () => {
  const text = '这是一个用于测试完整保留分段尾部的句子。'.repeat(80);
  const chunks = splitTextForSpeechChunks(text, [200, 400, 800]);
  const original = chunks.slice();
  for (const chunk of chunks) assert.equal(compact(splitOpeningAudioParts(chunk).join('')), compact(chunk));
  assert.deepEqual(chunks, original);
  assert.equal(compact(chunks.join('')), compact(text));
});

test('fallback without Intl handles newlines, decimals, abbreviations and closing quotes', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/semantic-chunker.js'), 'utf8');
  for (const intl of [undefined, {}]) {
    const context = vm.createContext({ module: { exports: {} }, Intl: intl });
    vm.runInContext(source, context);
    const split = context.module.exports.splitOpeningAudioParts;
    const text = 'Heading\nDr. Smith measured 0.95. "结果可靠。"随后继续检查结果，并确保没有丢失任何文字。';
    const parts = split(text, true);
    assert.ok(parts.length <= 3);
    assert.equal(compact(parts.join('')), compact(text));
    assert.ok(!parts.some(part => /Dr\.$/.test(part)));
    assert.ok(!parts.some(part => /0\.$/.test(part)));
  }
});
