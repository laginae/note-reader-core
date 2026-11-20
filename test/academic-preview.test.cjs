'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { academicPreviewSamples, sanitizeAcademicTextForSpeech } = require('..');

test('public preview inputs are isolated, bilingual and exercise the real formatter', () => {
  const rows = academicPreviewSamples();
  rows[0][1] = 'Changed';
  assert.equal(academicPreviewSamples()[0][1], 'The function $f(x)$.');
  assert.deepEqual(academicPreviewSamples('zh-CN'),academicPreviewSamples('chinese'));
  for (const lang of ['english','zh']) {
    const [fn,interval,table] = academicPreviewSamples(lang).map(row=>row[1]);
    const format = (s,opts)=>sanitizeAcademicTextForSpeech(s,opts);
    assert.notEqual(format(fn,{}),format(fn,{academicFunctionStyle:'compact'}));
    assert.notEqual(format(interval,{}),format(interval,{academicIntervalStyle:'range'}));
    assert.notEqual(format(table,{}),format(table,{academicTableRepeatHeaders:false}));
  }
});
