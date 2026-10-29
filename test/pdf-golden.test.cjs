const test=require('node:test'),assert=require('node:assert/strict');
const {cases,viewport}=require('./pdf-golden-fixtures.cjs');
const {extractPdfTextLayout}=require('..');
for(const fixture of cases) test('PDF shared corpus source geometry: '+fixture.name,()=>{
 const before=JSON.stringify(fixture.items),layout=extractPdfTextLayout(fixture.items,{viewport});
 assert.ok(layout.text.length);assert.ok(layout.lines.length);
 for(const line of layout.lines){for(const key of ['xMin','xMax','y'])assert.ok(Number.isFinite(line[key]));assert.ok(line.xMax>=line.xMin);}
 assert.equal(JSON.stringify(fixture.items),before);
 if(!fixture.expected)assert.equal(layout.text.replace(/\s+/g,' ').trim(),fixture.golden);
});
