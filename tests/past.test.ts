import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { allQuestions, allCases, questionMap, questions, blueprints } from '../src/content';
import { pastQuestions, pastPapers, pastReviews, pastSources, pastAudit } from '../src/content/past';
import { grade, newDraft, roundQuestions, selectQuestions } from '../src/engine';
import { emptyProfile, updateProfile, submitDraft, evaluateEssay, getProfile, exportBackup, validateBackup, importBackup } from '../src/storage';

describe('검토한 족보와 기존 학습 데이터',()=>{
  it('중복 사본을 합치고 모든 수록 문항의 출처·정답·세트 참조를 검사한다',()=>{
    expect(pastAudit.total).toBe(27);expect(pastSources.reduce((n,s)=>n+s.files,0)).toBe(27);
    expect(pastQuestions).toHaveLength(102);expect(new Set(allQuestions.map(q=>q.id)).size).toBe(allQuestions.length);
    expect(new Set(allCases.map(c=>c.id)).size).toBe(allCases.length);
    const included=new Set(pastPapers.flatMap(p=>p.questionIds));
    expect(included.size).toBe(pastQuestions.length);
    for(const p of pastPapers){expect(new Set(p.questionIds).size).toBe(p.questionIds.length);for(const id of p.questionIds)expect(questionMap[id].past).toBeDefined();}
    for(const q of pastQuestions){
      expect(q.past!.occurrences.length).toBeGreaterThan(0);
      for(const o of q.past!.occurrences)expect(pastSources.some(s=>s.id===o.sourceId)&&!!o.locator).toBe(true);
      expect(q.explanation.length).toBeGreaterThan(25);expect(q.steps.length).toBeGreaterThanOrEqual(2);
      expect(q.sources).toEqual([]);expect(q.lessonId).toBe('');
      if(q.kind==='choice'){
        expect([4,5]).toContain(q.choices!.length);
        expect(new Set(q.choices!.map(c=>c.text)).size).toBe(q.choices!.length);
        for(const c of q.choices!)expect(grade(q,c.id)).toBe(c.id===q.correctId);
      } else if(q.kind==='short') {
        expect(q.accepted).toContain(q.modelAnswer);for(const a of q.accepted!)expect(grade(q,a)).toBe(true);
      } else {
        expect(q.rubric!.length).toBeGreaterThanOrEqual(3);expect(grade(q,q.modelAnswer)).toBe(null);
      }
      for(const r of q.past!.references)expect(r.url.startsWith('https://')).toBe(true);
    }
    for(const r of pastReviews){expect(pastSources.some(s=>s.id===r.sourceId)).toBe(true);if(r.replacement)expect(questionMap[r.replacement].past).toBeDefined();}
    expect(pastReviews).toHaveLength(18);
  });
  it('기존 160문항·종합 회차를 유지하고 새 문제도 오답·북마크에서 선택할 수 있다',()=>{
    expect(questions).toHaveLength(160);
    for(const b of blueprints){const ids=roundQuestions(b);expect(ids).toHaveLength(50);expect(ids.every(id=>!questionMap[id].past)).toBe(true);}
    const ids=selectQuestions({pool:pastQuestions,count:102,random:false}).ids;
    expect(new Set(ids)).toEqual(new Set(pastQuestions.map(q=>q.id)));
    const mixed=selectQuestions({pool:[questions[0],questionMap['PQ-worm']],count:2,random:false}).ids;
    expect(mixed).toHaveLength(2);expect(mixed).toContain('PQ-worm');
  });
  it('2017 문항을 제외하고 2025판만 명시하며 불완전한 원문을 점수에 넣지 않는다',()=>{
    expect(pastQuestions.some(q=>/2017/.test(q.stem))).toBe(false);
    const q=questionMap['PQ-owasp2025'];expect(q.stem).toContain('2025');expect(q.modelAnswer).toContain('경보');expect(q.modelAnswer).not.toContain('경로');
    expect(q.past!.status).toBe('정리자료 재구성');
    expect(pastQuestions.some(q=>q.id==='PQ-social-original')).toBe(false);
    expect(pastQuestions.some(q=>q.stem.includes('가장 느린'))).toBe(false);
    expect(JSON.stringify(pastQuestions)).not.toMatch(/C:[\\/]|@gmail|학번|KakaoTalk|gkadlstn/);
  });
});

describe('원 자료에서 오답·조건 누락이 있었던 계산 검산',()=>{
  it('Playfair 암호표로 13쌍을 독립 검산한다',()=>{
    const q=questionMap['PQ-playfair'],grid=q.past!.material!.rows;
    const pos=(c:string)=>{for(let i=0;i<5;i++)for(let j=0;j<5;j++)if(grid[i][j].split('/').includes(c))return [i,j];throw Error(c);};
    const output='BE CA RE FU LF OR AS SA SX SI NA TO RX'.split(' ').map(pair=>{
      const [r1,c1]=pos(pair[0]),[r2,c2]=pos(pair[1]);
      return r1===r2?grid[r1][(c1+1)%5]+grid[r2][(c2+1)%5]:c1===c2?grid[(r1+1)%5][c1]+grid[(r2+1)%5][c2]:grid[r1][c2]+grid[r2][c1];
    }).join(' ');
    expect(output).toBe('OG ON OF EV VL RB SI IS NV IN TS AD CV');expect(q.modelAnswer).toBe(output);
  });
  it('DES의 6비트 추출·행·열과 DH 양쪽 공유값이 일치한다',()=>{
    const input='101111000111'.slice(3,9);expect(input).toBe('111000');
    const row=parseInt(input[0]+input[5],2),col=parseInt(input.slice(1,5),2);
    expect([row,col]).toEqual([2,12]);
    const table=questionMap['PQ-des-sbox'].past!.material!.rows;
    expect(Number(table[row][col+1]).toString(2).padStart(4,'0')).toBe('0011');
    const A=5**2%23,B=5**6%23;expect([A,B]).toEqual([2,8]);
    expect(B**2%23).toBe(18);expect(A**6%23).toBe(18);
    expect(questionMap['PQ-dh'].modelAnswer).toContain('18');
    expect(5**12).toBe(244140625);
  });
});

it('족보·기존 문제 혼합 응시, 5지선다, 자기 평가, 오답·북마크 백업을 보존한다',async()=>{
  const owner='past-fixture',other='past-restore';
  const ids=['PQ-worm-choice','PQ-session',questions[0].id];
  const draft=newDraft(owner,'practice','족보와 기존 복습',ids,60,false);
  draft.answers={'PQ-worm-choice':'4','PQ-session':'논리적 연결과 상태'};
  const profile=emptyProfile(owner);profile.draft=draft;
  await updateProfile(owner,p=>Object.assign(p,profile));await submitDraft(owner,draft.id);
  let saved=await getProfile(owner);expect(saved.attempts[0].pending).toBe(1);
  await evaluateEssay(owner,draft.id,'PQ-session',true);
  await updateProfile(owner,p=>{p.bookmarks.push({userId:owner,createdAt:p.createdAt,updatedAt:p.updatedAt,kind:'question',targetId:'PQ-worm-choice'});});
  saved=await getProfile(owner);expect(saved.attempts[0].score).toBe(67);
  const text=exportBackup(saved);expect(validateBackup(text).attempts[0].questionIds).toEqual(ids);
  await importBackup(other,text,'replace');const restored=await getProfile(other);
  expect(restored.attempts[0].answers).toEqual(draft.answers);expect(restored.bookmarks[0].targetId).toBe('PQ-worm-choice');
  expect(restored.wrongNotes[0].questionId).toBe(questions[0].id);
  expect(restored.attempts[0].userId).toBe(other);
  const newer=newDraft(owner,'practice','새 초안',['PQ-vpn'],60,false);expect(newer.choiceOrders['PQ-vpn']).toHaveLength(5);
  await updateProfile(owner,p=>{p.draft=newer;});expect(validateBackup(exportBackup(await getProfile(owner))).draft!.questionIds).toEqual(['PQ-vpn']);
});
