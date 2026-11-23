const test = require('node:test');
const assert = require('node:assert/strict');
const {markRomanHierarchy, capitalHeading} = require('../src/pdf-heading-hierarchy');

function fixture(centered=true) {
  const page={lines:[],bodyFont:'body'}, rows=[];
  for (const [text,token,kind] of [['I. DESIGN','I','roman'],['A. Setup','A','letter'],['B. Details','B','letter'],
    ['C. Notes','C','roman'],['II. CHECKS','II','roman']]) {
    const x=kind==='roman' && token!=='C' && centered ? 100 : 40;
    const line={text,xMin:x,xMax:x+80,y:710-page.lines.length*16,fontSize:10,font:token.length===1 && 'ABC'.includes(token)?'italic':'body',offset:1};
    rows.push({text,line,page,index:page.lines.length,num:{token,kind,level:kind==='roman'?1:2,body:text.slice(text.indexOf(' ')+1)}});
    page.lines.push(line,{text:'An ordinary piece of public example text.',xMin:40,xMax:240,y:line.y-15,fontSize:10,font:'body',offset:2});
  }
  return rows;
}
test('corroborated Roman chapters support a lettered series in their own column',()=>{
  const rows=fixture();markRomanHierarchy(rows,10);
  assert.deepEqual(rows.map(r=>[!!r.romanSection,!!r.letterSection,r.num.level]),[[true,false,1],[false,true,2],[false,true,2],[false,true,2],[true,false,1]]);
  assert.ok(capitalHeading('SECOND LINE'));assert.ok(!capitalHeading('Plain prose follows.'));
});
test('an uncentered Roman list does not promote its lettered neighbors',()=>{
  const rows=fixture(false);markRomanHierarchy(rows,10);
  assert.ok(rows.every(r=>!r.romanSection && !r.letterSection));
});
