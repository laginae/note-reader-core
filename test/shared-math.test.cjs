'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { mathSpeech, academicLatex, academicOptions, ACADEMIC_DEFAULTS, sanitizeTextForSpeech } = require('..');
const { cases } = require('./math-golden-fixtures.cjs');
for (const example of cases) test('shared formula: ' + example.name, () => {
  assert.equal(mathSpeech(example.formula, example.options), example.expected);
});
test('public options default to precise intervals and of without retaining private host fields', () => {
  assert.ok(Object.isFrozen(ACADEMIC_DEFAULTS));
  assert.equal(academicOptions().academicFunctionStyle, 'of');
  assert.equal(academicOptions().academicIntervalStyle, 'precise');
  assert.deepEqual(academicOptions({ apiKey: 'synthetic-placeholder', academicFunctionStyle: 'invalid' }), academicOptions());
});
test('full style remains unchanged by compact-function and range-only options', () => {
  for (const input of ['f(x)', String.raw`\bar f(x)`, String.raw`x\in(0,1]`, String.raw`\sin(x)`]) {
    const options = { academicMathStyle: 'verbose' };
    assert.equal(mathSpeech(input, { ...options, academicFunctionStyle: 'compact', academicIntervalStyle: 'range' }), mathSpeech(input, options));
  }
});
test('prose of and legacy nonacademic cleanup are preserved', () => {
  const text = 'The value of this public example is described.';
  assert.equal(academicLatex(text, { academicFunctionStyle: 'compact' }), text);
  assert.equal(sanitizeTextForSpeech('$x_i$'), 'x subscript i');
  assert.equal(academicLatex(String.raw`示例 $\underline f(x)$。`, { academicFunctionStyle: 'compact' }).trim(), '示例  f underbar x 。');
});
