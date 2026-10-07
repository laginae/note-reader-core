'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  academicOptions, mathSpeech, academicLatex, citations, skipTable,
  sanitizeAcademicTextForSpeech, sanitizeTextForSpeech,
} = require('../index');

test('academic math uses concise subscripts, accents, fraction order and known operators', () => {
  assert.equal(mathSpeech(String.raw`\frac{1}{2}`, { mathReadingLanguage: 'chinese' }), '2 分之 1');
  assert.equal(mathSpeech(String.raw`\alpha+\gamma`), 'alpha plus gamma');
  assert.equal(mathSpeech(String.raw`\bar{x}_i`), 'x bar sub i');
  assert.equal(mathSpeech(String.raw`x_\alpha`), 'x sub alpha');
  assert.equal(mathSpeech(String.raw`x^\alpha`), 'x to the power of alpha');
  assert.equal(mathSpeech('x_i', { academicMathStyle: 'verbose' }), 'x subscript i');
  assert.equal(mathSpeech('x_i', { academicMathStyle: 'verbose', mathReadingLanguage: 'chinese' }), 'x 下标 i');
  assert.equal(mathSpeech(String.raw`|Y\_{k,h}|`), 'absolute value of Y sub k,h');
  assert.equal(mathSpeech(String.raw`\sqrt{x}`), 'square root of x');
  assert.match(mathSpeech(String.raw`\frac{1}{a-b}`), /open parenthesis a minus b close parenthesis/);
  assert.match(academicLatex('Bounds $[1,2]$ and $x<y$.'), /open bracket 1,2 close bracket.*x less than y/);
});

test('complex, unknown and malformed formulas are omitted rather than guessed', () => {
  for (const input of [String.raw`\sum_{i=1}^n x_i`, String.raw`\unknown{x}`, 'x_{i', 'x'.repeat(33)]) {
    assert.equal(mathSpeech(input), 'Formula omitted.');
    assert.equal(mathSpeech(input, { academicSkipNotice: false }), '');
  }
  assert.equal(mathSpeech('x'.repeat(33), { academicMathMode: 'all' }), 'x'.repeat(33));
  assert.equal(mathSpeech('x'.repeat(101), { academicMathMode: 'all' }), 'Formula omitted.');
  assert.equal(mathSpeech('x', { academicMathMode: 'skip', mathReadingLanguage: 'chinese' }), '公式略过。');
});

test('academic citations group numeric references and preserve units, years and intervals', () => {
  assert.equal(citations('研究[3]。'), '研究 文献3 。');
  assert.equal(citations('研究[2][4]。'), '研究 文献2和4 。');
  assert.equal(citations('研究[2], [4], [6]。'), '研究 文献2、4和6 。');
  assert.equal(citations('研究[2](#r2), [4](#r4)。'), '研究 文献2和4 。');
  assert.equal(citations('See [2][4].'), 'See  references 2 and 4 .');
  assert.equal(citations('研究[2-4][6]。'), '研究 文献2到4和6 。');
  assert.equal(citations('范围[0,1]，年份[2026]，单位[s] [%]。'), '范围[0,1]，年份[2026]，单位[s] [%]。');
});

const headers = ['Region', 'A', 'B'];
const rows = Array.from({ length: 8 }, (_, i) => [`R${i}`, `${i + 10}`, `${i + 20}`]);
const markdown = '| Region | A | B |\n| --- | --- | --- |\n' + rows.map(row => '| ' + row.join(' | ') + ' |').join('\n');

test('smart table mode skips long numeric tables, not short tables or text glossaries', () => {
  assert.equal(skipTable(headers, rows), true);
  assert.equal(skipTable(headers, rows.slice(0, 3)), false);
  assert.equal(skipTable(headers, rows, { academicTableMode: 'all' }), false);
  assert.equal(skipTable([], [['one', 'description']], { academicTableMode: 'skip' }), true);
  assert.equal(skipTable([], Array.from({ length: 20 }, () => ['ESR', 'Energy storage resource'])), false);
  const input = `Table 1. Results\n${markdown}\n\nFollowing paragraph.`;
  const clean = sanitizeAcademicTextForSpeech(input);
  assert.match(clean, /Table 1. Results\nTable data omitted./);
  assert.match(clean, /Following paragraph/);
  assert.doesNotMatch(clean, /R7/);
  assert.match(sanitizeAcademicTextForSpeech(input, { academicTableMode: 'all' }), /R7/);
  assert.doesNotMatch(sanitizeAcademicTextForSpeech(input, { academicSkipNotice: false }), /omitted|R7/);
});

test('legacy default cleanup is unchanged; the academic entry point explicitly opts in', () => {
  assert.equal(sanitizeTextForSpeech('研究[2][4]。'), '研究 参考文献 2 参考文献 4。');
  assert.equal(sanitizeAcademicTextForSpeech('研究[2][4]。'), '研究 文献2和4。');
  assert.equal(sanitizeTextForSpeech('$x_i$'), 'x subscript i');
  assert.equal(sanitizeAcademicTextForSpeech('$x_i$'), 'x sub i');
  assert.match(sanitizeTextForSpeech(markdown), /R7/);
  assert.equal(sanitizeAcademicTextForSpeech('第一段。\n\n第二段。'), '第一段。\n第二段。');
});

test('academic options project only public algorithm settings', () => {
  assert.deepEqual(academicOptions({ apiKey: 'synthetic-placeholder', filePath: 'sample.md' }), academicOptions());
  assert.equal(Object.keys(academicOptions()).length, 5);
  assert.equal(academicOptions({ academicMathMode: 'invalid' }).academicMathMode, 'smart');
});
