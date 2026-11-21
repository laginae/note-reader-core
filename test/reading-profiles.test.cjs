'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { academicOptions, storedReadingPreferences, sanitizeAcademicTextForSpeech: format, formatTableForSpeech: table, mathSpeech } = require('..');

test('new, legacy and custom preferences stay distinct across reload and preset changes', () => {
  const fresh = storedReadingPreferences(null);
  assert.equal(fresh.readingProfile, 'everyday');
  assert.equal(fresh.academicTableRepeatHeaders, false);
  const legacy = storedReadingPreferences({ other: true });
  assert.equal(legacy.readingProfile, 'custom'); assert.equal(legacy.academicFunctionStyle, 'of'); assert.equal(legacy.academicTableRepeatHeaders, true);
  const custom = storedReadingPreferences({ academicIntervalStyle:'range', academicFunctionStyle:'compact', academicMathMode:'skip', academicTableRepeatHeaders:false });
  for (const readingProfile of ['everyday','study']) {
    const stored = storedReadingPreferences({ ...custom, readingProfile });
    assert.deepEqual(storedReadingPreferences({ ...stored, readingProfile:'custom' }),custom);
    const effective = academicOptions(stored);
    assert.deepEqual(academicOptions(effective), effective);
    assert.equal(effective.academicMathMode,'smart');
  }
});
test('everyday uses spoken context, preserves endpoints and does not reinterpret coordinates or negation', () => {
  const opts = {readingProfile:'everyday'};
  assert.match(format('函数 $f(x)$。 The function $f(x)$.',opts), /f x。\s*The function f of x\./);
  assert.equal(mathSpeech(String.raw`x\in(0,1]`,{...opts, mathReadingLanguage:'chinese'}),'x 大于 0 且不超过 1');
  assert.equal(mathSpeech(String.raw`x\in[0,\infty)`,opts),'x is at least 0');
  assert.equal(mathSpeech(String.raw`x\in(-\infty,4)`,opts),'x is less than 4');
  assert.match(mathSpeech(String.raw`x\notin(0,1]`,opts),/does not belong/);
  assert.doesNotMatch(format('The point $(a,b)$.',opts),/interval|greater than| to /);
  assert.match(mathSpeech(String.raw`x\in(0,1]`,{readingProfile:'study'}),/left-open, right-closed/);
  assert.equal(mathSpeech(String.raw`\sum_i x_i`,opts),'Formula.');
});
test('daily reads headings once except numeric columns needing context; explicit choices win', () => {
  const items = ['Item','Count'], rows=[['Blue',2],['Green',3]];
  assert.match(table(items, rows, {readingProfile:'everyday'}),/Row 1\. Blue; 2\./);
  const headers = ['Item','Low','High'], values=[['Blue',0,4],['Green','',8]];
  assert.match(table(headers,values,{readingProfile:'everyday'}),/Row 1\. Blue; Low: 0; High: 4\./);
  assert.match(table(headers,values,{readingProfile:'custom',academicTableRepeatHeaders:false}),/Row 1\. Blue; 0; 4\./);
  assert.match(table(items,rows,{readingProfile:'study'}),/Row 1\. Item: Blue; Count: 2\./);
  assert.equal(table(headers,Array(10).fill(values[0]),{readingProfile:'everyday'}),'Table data omitted.');
});
