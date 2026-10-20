// Disposable browser contexts only; never opens learner browser data.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const bank=JSON.parse(await readFile(new URL('../src/content/past/bank.json',import.meta.url),'utf8'));
const base=process.env.CBT_BASE??'http://127.0.0.1:4175/Security_CBT/';
const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
const report={base,errors:[],viewports:[]};await mkdir('test-results',{recursive:true});
try {
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  const goto=async path=>{await page.goto(base+'#'+path);await page.getByRole('main').waitFor();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
  const overflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),`${width}px overflow ${page.url()}`);
  const saved=()=>page.locator('.save-state').filter({hasText:'저장 상태 확인됨'}).waitFor({state:'attached'});
  for(const path of ['/past-exams','/past-exams?view=all','/past-exams?view=review',...bank.papers.map(p=>'/past-exams/'+p.id)]){
   await goto(path);assert((await page.getByRole('main').innerText()).includes('족보')||path.includes('past-exams/'));await overflow();
  }
  await goto('/past-exams/2024-mid');await page.getByLabel('문제 검색',{exact:true}).fill('OWASP');
  await page.getByRole('button',{name:'족보 풀이 시작',exact:true}).click();await page.locator('.question-panel h2').waitFor();
  assert((await page.locator('.question-panel h2').innerText()).includes('2025'));
  assert.equal(await page.locator('.explanation').count(),0);assert.equal(await page.locator('.past-correction').count(),0);
  assert.equal(await page.locator('.quiz-material').count(),0);await overflow();
  await page.getByRole('textbox',{name:'서술 답안',exact:true}).fill('A01 접근 통제 실패 등 2025판 목록을 썼다.');
  await page.getByRole('button',{name:'답안 확인',exact:true}).click();await page.locator('.explanation').waitFor();
  assert((await page.locator('.explanation').innerText()).includes('보안 로깅 및 경보 실패'));
  await page.getByRole('button',{name:'채점 요소를 충족했어요',exact:true}).click();
  await page.getByRole('button',{name:/^전체 제출 ·/}).click();await page.locator('.result-summary').waitFor();
  assert((await page.locator('.result-summary').innerText()).includes('100점'));
  // Real Korean composition on the new bank, then reload, grade, submit and back up.
  await goto('/practice?question=PQ-worm');await page.getByRole('button',{name:'복습 시작',exact:true}).click();
  const input=page.getByRole('textbox',{name:'짧은 답안',exact:true});await input.waitFor();await input.focus();
  const cdp=await context.newCDPSession(page);
  for(const text of ['ㅇ','우','워','웜']){await cdp.send('Input.imeSetComposition',{text,selectionStart:text.length,selectionEnd:text.length});assert.equal(await input.inputValue(),text);}
  await cdp.send('Input.insertText',{text:'웜'});await input.blur();await saved();await page.reload();await input.waitFor();assert.equal(await input.inputValue(),'웜');
  await page.getByRole('button',{name:'답안 확인',exact:true}).click();await page.locator('.grade-status.correct').waitFor();
  await page.getByRole('button',{name:'북마크',exact:true}).click();
  await page.getByRole('button',{name:/^전체 제출 ·/}).click();await page.locator('.result-summary').waitFor();
  // Five-choice question, incorrect answer -> wrong notes -> retry.
  await goto('/practice?question=PQ-vpn');await page.getByRole('button',{name:'복습 시작',exact:true}).click();await page.locator('.choices').waitFor();
  assert.equal(await page.getByRole('radio').count(),5);await page.locator('input[value="1"]').click();
  await page.waitForFunction(()=>document.querySelector('input[value="1"]')?.checked);
  await page.getByRole('button',{name:/^전체 제출 ·/}).click();await page.locator('.result-summary').waitFor();
  await goto('/wrong');assert((await page.getByRole('main').innerText()).includes('PQ-vpn'));
  await page.getByText('사례 자료와 해설 펼치기',{exact:true}).click();await page.locator('.explanation').waitFor();assert((await page.locator('.explanation').innerText()).includes('VPN'));
  // Timed exam hides explanations until submission, and scrollable cipher tables fit.
  await goto('/past-exams/2024-final');await page.getByLabel('풀이 방식',{exact:true}).selectOption('exam');
  await page.getByRole('button',{name:/족보 시작$|족보 풀이 시작/}).click();await page.locator('.question-panel h2').waitFor();
  assert.equal(await page.locator('.explanation').count(),0);assert.equal(await page.getByRole('button',{name:'답안 확인',exact:true}).count(),0);
  assert.equal(await page.locator('.past-material table tbody tr').count(),5);await overflow();
  await page.getByRole('button',{name:/^7번 /}).click();await page.locator('.past-material h3').filter({hasText:'DES'}).waitFor();await overflow();
  assert.equal(await page.locator('.past-material table thead th').count(),17);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`test-results/past-cipher-${width}.png`,fullPage:true});
  await goto('/account?view=backup');const download=page.waitForEvent('download');await page.getByRole('button',{name:'내 기록 내보내기',exact:true}).click();
  const file=await (await download).path(),backup=JSON.parse(await readFile(file,'utf8'));
  assert.equal(backup.profile.attempts.find(a=>a.questionIds.includes('PQ-worm')).answers['PQ-worm'],'웜');
  assert(backup.profile.wrongNotes.some(w=>w.questionId==='PQ-vpn'));
  assert(backup.profile.bookmarks.some(b=>b.targetId==='PQ-worm'));
  assert.deepEqual(backup.profile.draft.questionIds,bank.papers.find(p=>p.id==='2024-final').questionIds);
  await page.locator('input[type=file]').setInputFiles({name:'past-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await page.getByRole('button',{name:'현재 사용자에 합치기',exact:true}).waitFor();
  await page.getByRole('button',{name:'현재 사용자에 합치기',exact:true}).click();await saved();assert.equal(await page.getByRole('alert').count(),0);
  await goto('/past-exams');await page.screenshot({path:`test-results/past-catalogue-${width}.png`,fullPage:true});
  if(width===1440){
   await goto('/past-exams?view=all');await page.getByRole('button',{name:/족보 시작$|족보 풀이 시작/}).click();
   for(let i=0;i<bank.questions.length;i++){
    if(i)await page.getByRole('button',{name:new RegExp(`^${i+1}번 `)}).click();
    await page.locator('.question-panel h2').filter({hasText:bank.questions[i].stem}).waitFor();
    assert.equal(await page.locator('.explanation').count(),0);
    await overflow();
   }
   report.allQuestionsRendered=bank.questions.length;
  }
  report.viewports.push({width,catalogue:14,filteredPractice:true,essayGrade:true,koreanComposition:true,shortGrade:true,fiveChoices:true,wrongNote:true,cipherTables:true,examHidesAnswers:true,backup:true});
  await context.close();
 }
 assert.deepEqual(report.errors,[]);report.status='PASS';console.log(JSON.stringify(report,null,2));
}catch(e){report.status='FAIL';report.failure=String(e);throw e;}
finally{await writeFile('test-results/past-browser-report.json',JSON.stringify(report,null,2));await browser.close();}
