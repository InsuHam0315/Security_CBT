// Isolated headless browser contexts: no existing browser profile is opened.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.CBT_BASE??'http://127.0.0.1:4175/Security_CBT/';
const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
const report={base,viewports:[],errors:[],backup:[],menu:[]};
await mkdir('test-results',{recursive:true});
try{
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(base);await page.getByRole('main').waitFor();
  if(width<=760){await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();assert(await page.locator('.sidebar').evaluate(e=>e.classList.contains('open')));await page.keyboard.press('Shift+Tab');assert(await page.locator('.sidebar').evaluate(e=>e.contains(document.activeElement)));await page.keyboard.press('Tab');assert.equal(await page.locator('.sidebar a').first().evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.sidebar').classList.contains('open'));assert.equal(await page.getByRole('button',{name:'메뉴 열기',exact:true}).evaluate(e=>e===document.activeElement),true);await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();await page.getByRole('button',{name:'메뉴 닫기',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.sidebar').classList.contains('open'));await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();}
  for(const toggle of await page.locator('.nav-toggle').all())if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
  assert.equal(await page.locator('.nav-toggle[aria-expanded="true"]').count(),10);await page.locator('.nav-toggle').first().focus();await page.keyboard.press('Space');assert.equal(await page.locator('.nav-toggle[aria-expanded="true"]').count(),9);await page.keyboard.press('Space');assert.equal(await page.locator('.nav-toggle[aria-expanded="true"]').count(),10);
  const paths=await page.locator('.sidebar-nav a').evaluateAll(els=>[...new Set(els.map(e=>e.getAttribute('href')))]);
  if(width<=760){await page.locator('.nav-parent').filter({hasText:'강의실'}).click();await page.waitForFunction(()=>!document.querySelector('.sidebar').classList.contains('open'));report.menu.push({width,escape:true,backdrop:true,navigation:true});}
  let maximum=0;
  for(const path of paths){
   await page.goto(base+path);await page.getByRole('main').waitFor();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const text=await page.getByRole('main').innerText();assert(text.length>30&&!text.includes('페이지를 찾을 수 없습니다.')&&!text.includes('자료를 찾을 수 없습니다.'),path);
   const extra=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);maximum=Math.max(maximum,extra);if(extra>1)console.log('OVERFLOW',await page.locator('main *').evaluateAll(els=>els.filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,90),right:e.getBoundingClientRect().right}))));assert(extra<=1,`${width}px ${path} overflow ${extra}`);
  }
  for(const topic of ['A','B','C','D']){
   await page.goto(base+'#/lessons/chapter/'+topic);await page.locator('.chapter-article').waitFor();
   const count=await page.locator('.ppt-section').count();assert(count>=28);
   assert.equal(await page.locator('.chapter-article img').count(),0);
   assert(await page.locator('#chapter-extras').isVisible());
   if(width>760){
    await page.getByRole('button',{name:'왼쪽 메뉴 접기',exact:true}).click();await page.locator('.app-shell.sidebar-closed').waitFor();
    assert.equal(await page.locator('#study-sidebar').isVisible(),false);
    assert((await page.locator('.main-wrap').boundingBox()).x===0);
    await page.reload();await page.getByRole('button',{name:'왼쪽 메뉴 펼치기',exact:true}).click();await page.locator('.app-shell:not(.sidebar-closed)').waitFor();
    assert(await page.locator('#study-sidebar').isVisible());
   }
  }
  await page.goto(base+'#/practice?topic=A');await page.getByRole('heading',{name:'20문항 복습',exact:true}).waitFor();
  await page.goto(base+'#/practice?topic=B');await page.getByRole('heading',{name:'50문항 복습',exact:true}).waitFor();
  await page.goto(base+'#/lessons/SL18');await page.locator('[data-lesson-id=SL18]').waitFor();
  assert.equal(await page.locator('.chapter-unit').count(),8);
  await page.goto(base+'#/lessons');assert.equal(await page.locator('.chapter-card').count(),4);
  report.viewports.push({width,routes:paths.length,maxOverflow:maximum,chapters:4,legacyLink:true,sidebarToggle:width>760});
  await page.goto(base+'#/account');if(width<=760)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();await page.getByRole('link',{name:'로컬 회원가입',exact:true}).click();await page.getByRole('button',{name:'회원가입',exact:true}).and(page.locator('[aria-pressed="true"]')).waitFor();if(width<=760)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();await page.getByRole('link',{name:'로컬 로그인·프로필',exact:true}).click();await page.getByRole('button',{name:'로그인',exact:true}).and(page.locator('[aria-pressed="true"]')).waitFor();
  await page.goto(base+'#/reading?case=SC13');await page.getByRole('button',{name:'time-taken',exact:true}).click();await page.getByRole('button',{name:'time-taken',exact:true}).click();assert.equal(await page.locator('th[aria-sort="descending"]').innerText(),'time-taken');
  await page.getByLabel('표 행 필터',{exact:true}).fill('403');assert.equal(await page.locator('tbody tr').count(),1);
  await page.getByRole('button',{name:'자료 확대',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
  await page.goto(base+'#/reading?case=SC27');await page.getByRole('button',{name:'2줄 해설',exact:true}).click();assert((await page.locator('.line-explanation').innerText()).includes('값 위치'));
  await page.goto(base+'#/');await page.getByRole('button',{name:'테마 전환',exact:true}).click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');await page.locator('.save-state').filter({hasText:'저장 상태 확인됨'}).waitFor({state:'attached'});await page.reload();await page.getByRole('main').waitFor();await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  await page.screenshot({path:`test-results/home-${width}.png`,fullPage:true});
  await page.goto(base+'#/account?view=backup');
  await page.locator('input[type=file]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')});await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('button',{name:'현재 사용자에 합치기',exact:true}).count(),0);
  const now=new Date().toISOString(),owned={userId:'fixture',createdAt:now,updatedAt:now};
  const data={app:'computer-security-cbt',schemaVersion:1,exportedAt:now,profile:{...owned,schemaVersion:1,textbookChecks:['B'],attempts:[],wrongNotes:[],progress:[{...owned,lessonId:'SL02',completed:true}],bookmarks:[],draft:null,settings:{theme:'light',shuffle:false},lastLessonId:'SL02'}};
  await page.locator('input[type=file]').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.getByRole('button',{name:'현재 사용자에 합치기',exact:true}).waitFor();assert((await page.getByRole('main').innerText()).includes('진도 1개'));
  await page.getByRole('button',{name:'현재 사용자에 합치기',exact:true}).click();await page.locator('.save-state').filter({hasText:'저장 상태 확인됨'}).waitFor({state:'attached'});await page.goto(base+'#/lessons/SL02');await page.locator('[data-lesson-id=SL02]').getByRole('button',{name:'이 단원 읽기 완료 해제',exact:true}).waitFor();
  await page.goto(base+'#/account?view=backup');await page.getByLabel('복원 정책').selectOption('replace');data.profile.progress=[];
  await page.locator('input[type=file]').setInputFiles({name:'replace.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.getByRole('button',{name:'현재 학습 기록 덮어쓰기',exact:true}).click();await page.locator('.save-state').filter({hasText:'저장 상태 확인됨'}).waitFor({state:'attached'});await page.goto(base+'#/lessons/SL02');await page.locator('[data-lesson-id=SL02]').getByRole('button',{name:'이 단원 읽기 완료',exact:true}).waitFor();
  report.backup.push({width,invalidRejected:true,preview:true,merge:true,replace:true});await context.close();
 }
 assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{await writeFile('test-results/browser-report.json',JSON.stringify(report,null,2));await browser.close();}
