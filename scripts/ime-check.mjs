// Chromium's real composition events, in a disposable browser profile.
// No existing learner profiles or backups are opened.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const questions=JSON.parse(await readFile(new URL('../src/content/questions.json',import.meta.url),'utf8'));
const cases=JSON.parse(await readFile(new URL('../src/content/cases.json',import.meta.url),'utf8'));
const blueprints=JSON.parse(await readFile(new URL('../src/content/blueprints.json',import.meta.url),'utf8'));

const base=process.env.CBT_BASE??'http://127.0.0.1:4175/Security_CBT/';
const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
const report={base,viewports:[],errors:[]};
await mkdir('test-results',{recursive:true});
try {
 for(const width of [390,1440]) {
  const context=await browser.newContext({viewport:{width,height:1000}});
  const page=await context.newPage();
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
  const steps=[];
  const cdp=await context.newCDPSession(page);
  const compose=async(field,prefix,sequence,{slow=false}={})=>{
    await field.focus();
    for(const text of sequence) {
      await cdp.send('Input.imeSetComposition',{text,selectionStart:text.length,selectionEnd:text.length});
      if(slow&&text==='워')await page.waitForTimeout(1100); // Exercise the quiz clock's rerender.
      const actual=await field.inputValue();
      steps.push({text,prefix,actual});
      assert.equal(actual,prefix+text,`Korean composition ${text}, ${width}px`);
    }
    await cdp.send('Input.insertText',{text:sequence.at(-1)});
    assert.equal(await field.inputValue(),prefix+sequence.at(-1));
  };
  const choose=async(n)=>{
    await page.getByRole('button',{name:new RegExp(`^${n}번 `)}).click();
    await page.locator('.question-top>.tag').filter({hasText:`문제 ${n} /`}).waitFor();
  };
  const short=()=>page.getByRole('textbox',{name:'짧은 답안',exact:true});
  const essay=()=>page.getByRole('textbox',{name:'서술 답안',exact:true});
  const saved=()=>page.locator('.save-state').filter({hasText:'저장 상태 확인됨'}).waitFor({state:'attached'});
  await page.goto(base+'#/lessons/chapter/A');
  await page.getByRole('link',{name:'이 장 문제 연습 →',exact:true}).click();
  await page.getByRole('button',{name:'복습 시작',exact:true}).click();
  await choose(2);
  await compose(short(),'', ['ㅇ','우','워','웜'],{slow:true});
  await page.getByRole('button',{name:'다음',exact:true}).click();
  await page.getByRole('button',{name:'이전',exact:true}).click();
  assert.equal(await short().inputValue(),'웜','saved answer after question navigation');
  await saved();await page.reload();
  await short().waitFor();
  assert.equal(await short().inputValue(),'웜','saved answer after reload');
  await page.getByRole('button',{name:'답안 확인',exact:true}).click();
  await page.locator('.grade-status.correct').waitFor();
  await page.screenshot({path:`test-results/ime-short-${width}.png`,fullPage:false});
  await choose(4);
  assert.equal(await short().inputValue(),'','different short question must not inherit the last answer');
  await short().pressSequentially('SQL ');
  await compose(short(),'SQL ',['ㅇ','이','인']);
  await compose(short(),'SQL 인',['ㅈ','저','젝']);
  await compose(short(),'SQL 인젝',['ㅅ','셔','션']);
  await page.getByRole('button',{name:'답안 확인',exact:true}).click();
  await page.locator('.grade-status.correct').waitFor();
  await choose(5);
  await essay().fill('대상과 수단을 ');
  await compose(essay(),'대상과 수단을 ',['ㅎ','하','한']);
  await essay().pressSequentially('글로 구분한다.');
  await essay().press('Enter');
  await essay().pressSequentially('조건과 근거를 쓴다.');
  const essayText='대상과 수단을 한글로 구분한다.\n조건과 근거를 쓴다.';
  assert.equal(await essay().inputValue(),essayText);
  await page.getByRole('button',{name:'다음',exact:true}).click();
  await page.getByRole('button',{name:'이전',exact:true}).click();
  assert.equal(await essay().inputValue(),essayText);
  await saved();await page.reload();await essay().waitFor();
  assert.equal(await essay().inputValue(),essayText,'multiline essay survives reload');
  await page.screenshot({path:`test-results/ime-essay-${width}.png`,fullPage:false});
  await page.getByRole('button',{name:/^전체 제출 ·/}).click();
  await page.locator('.result-summary').waitFor();
  assert((await page.getByRole('main').innerText()).includes('SQL 인젝션'));
  // The exported data is from this disposable guest, through the normal UI.
  await page.goto(base+'#/account?view=backup');
  const exported=page.waitForEvent('download');
  await page.getByRole('button',{name:'내 기록 내보내기',exact:true}).click();
  const backup=JSON.parse(await readFile(await (await exported).path(),'utf8'));
  const attempt=backup.profile.attempts.at(-1);
  assert.equal(attempt.answers['SQ01-2'],'웜');
  assert.equal(attempt.answers['SQ01-4'],'SQL 인젝션');
  assert.equal(attempt.answers['SQ01-5'],essayText);
  // Exercise the same field in timed exam mode, including continuous typing,
  // selected-text replacement, deletion, composition backtracking and blur.
  await page.goto(base+'#/mock/'+blueprints[0].id);
  await page.getByRole('button',{name:'시험 시작',exact:true}).click();
  const roundIds=blueprints[0].caseIds.flatMap(id=>cases.find(c=>c.id===id).questionIds);
  const shortIndex=roundIds.findIndex(id=>questions.find(q=>q.id===id).kind==='short');
  await choose(shortIndex+1);
  await short().pressSequentially('FAST SQL 123');
  assert.equal(await short().inputValue(),'FAST SQL 123');
  await short().press('ControlOrMeta+A');await short().press('Backspace');
  await compose(short(),'', ['ㅇ','우','워','웜','워','우','워','웜']);
  await page.getByRole('button',{name:'나중에 검토',exact:true}).click();
  await saved();await page.reload();await short().waitFor();
  assert.equal(await short().inputValue(),'웜','exam answer after blur and reload');
  const numericIndex=roundIds.findIndex(id=>questions.find(q=>q.id===id).kind==='numeric');
  if(numericIndex>=0) {
    await choose(numericIndex+1);
    const numeric=page.getByRole('textbox',{name:'숫자 답안',exact:true});
    await numeric.pressSequentially('12.5');
    assert.equal(await numeric.inputValue(),'12.5');
    await saved();await page.reload();await numeric.waitFor();assert.equal(await numeric.inputValue(),'12.5');
  }
  report.viewports.push({width,steps,navigation:true,reload:true,mixedText:true,essay:true,
    submittedBackup:true,exam:true,backspace:true,numeric:numericIndex>=0});
  await context.close();
 }
  assert.deepEqual(report.errors,[]);
  report.status='PASS';
  console.log(JSON.stringify({...report,viewports:report.viewports.map(({steps,...rest})=>({...rest,compositionFrames:steps.length}))},null,2));
} catch(error) {
  report.status='FAIL';
  report.failure=String(error);
  throw error;
} finally {
  await writeFile('test-results/ime-report.json',JSON.stringify(report,null,2));
  await browser.close();
}
