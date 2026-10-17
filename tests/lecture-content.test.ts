import { describe,it,expect } from 'vitest';
import { lessons,lessonMap,cases,questions } from '../src/content';
import coverage from '../src/content/slide-coverage.json';

describe('PPT 기반 강의의 범위와 출처 분리',()=>{
 it('표지·목차·목표·마무리를 제외한 실제 본문 232장을 모두 설명에 연결한다',()=>{
  expect(coverage.filter(r=>r.kind==='content')).toHaveLength(232);
  expect(coverage.filter(r=>r.kind==='frontmatter')).toHaveLength(16);
  for (const [i,last] of [39,73,77,55].entries()) {
   const rows=coverage.filter(r=>r.sourceId===`P${i+1}`&&r.kind==='content');
   expect(rows.map(r=>r.page)).toEqual(Array.from({length:last-3},(_,n)=>n+4));
   expect(rows.every(r=>r.sections.some(x=>lessonMap[x.lessonId].sections[x.sectionIndex].body.length>0))).toBe(true);
  }
 });
 it('감사 때 빠져 있던 사건·제품·공격이 실제 본문에 들어 있다',()=>{
  const anchors={A:['에니그마','콜로서스','ARPA','모리스','농협','DEF CON','BPFDoor'],B:['SQL Server Audit','UNIFIED_AUDIT_TRAIL','Relay','sulog','Backup Operators','VRFY','블루버그'],C:['Boink','Bonk','MACOF','Slowloris','hosts.equiv','802.11ah','LAST-ACK'],D:['robots.txt','Login_Failed','저장형 XSS','리버스 텔넷','CSRF','구성요소']};
  for(const [topic,words] of Object.entries(anchors)){
   const body=JSON.stringify(lessons.filter(l=>l.topic===topic).map(l=>l.sections));
   for(const w of words)expect(body,`${topic}: ${w}`).toContain(w);
  }
 });
 it('추가 정정과 새 질문은 PPT 본문과 별도 필드에 두고 기존 문제 ID를 보존한다',()=>{
  expect(lessons.map(l=>l.id)).toEqual(Array.from({length:24},(_,i)=>`SL${String(i+1).padStart(2,'0')}`));
  expect(lessons.every(l=>l.selfChecks.length===3&&Array.isArray(l.additionalSections))).toBe(true);
  expect(lessonMap.SL01.additionalSections[0].body.join(' ')).toContain('1993');
  expect(cases.map(c=>c.id)).toEqual(Array.from({length:32},(_,i)=>`SC${String(i+1).padStart(2,'0')}`));
  expect(questions).toHaveLength(160);
  for(const c of cases)expect(lessonMap[c.lessonId].caseIds).toContain(c.id);
 });
});
