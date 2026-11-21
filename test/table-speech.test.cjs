'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { academicOptions, formatTableForSpeech, sanitizeAcademicTextForSpeech, sanitizeTextForSpeech } = require('../index');
const headers = ['Item', 'Count'], rows = [['Apples', '2'], ['Pears', '3']];
const markdown = '| Item | Count |\n| --- | --- |\n| Apples | 2 |\n| Pears | 3 |';

test('unversioned saved custom settings keep the old header default', () => {
  for (const value of [undefined, null, 0, 'false', true]) {
    const options = academicOptions({ readingProfile: 'custom', academicTableRepeatHeaders: value });
    assert.equal(options.academicTableRepeatHeaders, true);
    assert.equal(formatTableForSpeech(headers, rows, options), 'Table columns: Item; Count.\nRow 1. Item: Apples; Count: 2.\nRow 2. Item: Pears; Count: 3.');
  }
  assert.equal(academicOptions({ academicTableRepeatHeaders: false }).academicTableRepeatHeaders, false);
});
test('read headers once and preserve row order and pauses', () => {
  const options = { academicTableRepeatHeaders: false };
  const expected = 'Table columns: Item; Count.\nRow 1. Apples; 2.\nRow 2. Pears; 3.';
  assert.equal(formatTableForSpeech(headers, rows, options), expected);
  assert.equal(sanitizeAcademicTextForSpeech(markdown, options), expected);
  assert.equal(sanitizeTextForSpeech(markdown, options), expected);
});
test('Chinese headers are read only at the opening when repetition is off', () => {
  assert.equal(formatTableForSpeech(['品名', '数量'], [['苹果', '2'], ['梨', '3']], { academicTableRepeatHeaders: false }),
    '表格列: 品名; 数量。\n第 1 行. 苹果; 2。\n第 2 行. 梨; 3。');
});
test('blank cells and missing headings retain their column positions without dropping zero', () => {
  assert.equal(formatTableForSpeech(['Item', '', 'Count'], [['Apples', '', 0], ['Pears']], { academicTableRepeatHeaders: false }),
    'Table columns: Item; Column 2; Count.\nRow 1. Apples; empty; 0.\nRow 2. Pears; empty; empty.');
  assert.match(formatTableForSpeech(['项', '数'], [['甲', '']], { academicTableRepeatHeaders: false }), /甲; 空/);
});
test('header repetition is independent of smart and explicit skip policies', () => {
  const long = Array.from({ length: 8 }, (_, index) => ['R' + index, String(index), String(index + 10)]);
  for (const academicTableRepeatHeaders of [true, false]) {
    assert.equal(formatTableForSpeech(['Item', 'A', 'B'], long, { academicTableMode: 'smart', academicTableRepeatHeaders }), 'Table data omitted.');
    assert.equal(formatTableForSpeech(headers, rows, { academicTableMode: 'skip', academicTableRepeatHeaders, academicSkipNotice: false }), '');
    assert.match(formatTableForSpeech(['Item', 'A', 'B'], long, { academicTableMode: 'all', academicTableRepeatHeaders }), /R7/);
  }
});
test('header choice does not alter prose outside a Markdown table or reinterpret pipe-free text', () => {
  const result = sanitizeAcademicTextForSpeech('Before.\n\n' + markdown + '\n\nAfter.', { academicTableRepeatHeaders: false });
  assert.ok(result.startsWith('Before.\n')); assert.ok(result.endsWith('\nAfter.'));
  assert.equal(sanitizeAcademicTextForSpeech('Item Count Apples 2', { academicTableRepeatHeaders: false }), 'Item Count Apples 2');
});
