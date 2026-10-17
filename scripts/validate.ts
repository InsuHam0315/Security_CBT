import assert from 'node:assert/strict';
import {sources,lessons,cases,questions,blueprints,lessonMap,caseMap,questionMap,sourceMap} from '../src/content';
import {calculate,roundQuestions,grade} from '../src/engine';
import coverage from '../src/content/slide-coverage.json';
function unique<T>(ids:T[]){assert.equal(new Set(ids).size,ids.length);}
for(const list of [sources,lessons,cases,questions,blueprints])unique(list.map(x=>x.id));
for(const item of [...lessons,...cases,...questions]){
 assert(item.sources.length);for(const r of item.sources){assert(sourceMap[r.sourceId]);assert(r.pages.length);unique(r.pages);for(const n of r.pages)assert(Number.isInteger(n)&&n>0&&n<=sourceMap[r.sourceId].pages);}
}
for(const l of lessons){assert(l.sections.length>=2&&l.selfChecks.length===3);assert(l.workedExamples.length);for(const id of l.caseIds)assert.equal(caseMap[id].lessonId,l.id);for(const id of l.prerequisiteIds)assert(lessonMap[id]);}
assert.equal(coverage.length,248);
assert.equal(coverage.filter(s=>s.kind==='content').length,232);
unique(coverage.map(s=>`${s.sourceId}:${s.page}`));
for(const row of coverage){
 if(row.kind==='content'){
  assert(row.sections.length);
  for(const link of row.sections){const s=lessonMap[link.lessonId].sections[link.sectionIndex];assert(s.body.join('').length>=60);assert(s.sources.some(r=>r.sourceId===row.sourceId&&r.pages.includes(row.page)));}
 } else assert(row.reason&&row.sections.length===0);
}
for(const l of lessons){
 const pages=l.sections.flatMap(s=>s.sources.flatMap(r=>r.pages));
 assert.deepEqual(pages,[...pages].sort((a,b)=>a-b),`${l.id}: PPT order`);
 assert.deepEqual([...new Set(pages)],l.sources[0].pages);
 for(const s of l.sections){assert(s.sources.length);if(s.table)assert(s.table.rows.every(r=>r.length===s.table!.columns.length));}
}
for(const c of cases){assert.equal(c.validN,c.rows.length);assert.equal(c.questionIds.length,5);unique(c.questionIds);for(const id of c.questionIds)assert.equal(questionMap[id].caseId,c.id);for(const r of c.rows)assert(c.columns.every(k=>k in r));}
for(const q of questions){assert(lessonMap[q.lessonId]&&caseMap[q.caseId]);assert(q.explanation&&q.steps.length>=2&&q.commonError);if(q.kind==='choice'){assert.equal(q.choices!.length,4);unique(q.choices!.map(c=>c.id));unique(q.choices!.map(c=>c.text));assert.equal(q.choices!.filter(c=>c.id===q.correctId).length,1);assert(q.choices!.every(c=>c.reason));assert(grade(q,q.correctId));}if(q.kind==='numeric'){assert.equal(calculate(caseMap[q.caseId].rows,q.numeric!.calculation),q.numeric!.value);assert(grade(q,String(q.numeric!.value)));}if(q.kind==='essay')assert(q.modelAnswer&&q.rubric!.length>=3);}
const slots=blueprints.flatMap(roundQuestions);unique(blueprints.map(b=>b.id));
for(const b of blueprints){const ids=roundQuestions(b);unique(ids);assert.equal(ids.length,50);unique(b.caseIds);const distribution=Object.fromEntries('ABCD'.split('').map(t=>[t,ids.filter(id=>questionMap[id].topic===t).length]));assert.deepEqual(distribution,{A:5,B:15,C:15,D:15});}
assert.equal(new Set(slots).size,questions.length);
console.log(JSON.stringify({lessons:lessons.length,cases:cases.length,uniqueQuestions:questions.length,rounds:blueprints.length,slots:slots.length,repeatedSlots:slots.length-new Set(slots).size,kinds:Object.fromEntries(['choice','numeric','short','essay'].map(k=>[k,questions.filter(q=>q.kind===k).length]))},null,2));
