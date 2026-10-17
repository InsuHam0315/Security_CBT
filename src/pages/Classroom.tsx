import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Check, ChevronUp } from "lucide-react";
import { lessons, lessonMap, topics } from "../content";
import type { Lesson } from "../types";
import { useStudy } from "../context";
import { readLesson, readChapter } from "../storage";
import { Heading, BookmarkButton } from "../components/UI";
import { Code, Sources } from "../components/Materials";
import { WorkedExamples, LessonLab } from "../components/LessonStudy";

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
}

function Practice({ lesson }: { lesson: Lesson }) {
  const [open,setOpen] = useState(false);
  return <details className="chapter-practice" onToggle={e=>setOpen(e.currentTarget.open)}>
    <summary>{lesson.title} · 직접 만든 가상 사례 {lesson.caseIds.length}개</summary>
    {open && <><WorkedExamples lesson={lesson}/><LessonLab lesson={lesson}/>
      <h3>추가 해설 · 재구성한 흐름</h3><Code code={lesson.code} notes={lesson.codeNotes}/>
      <ul>{lesson.mistakes.map(m=><li key={m}>{m}</li>)}</ul>
    </>}
  </details>;
}

export function Classroom() {
  const location = useLocation();
  const token = location.pathname.split('/')[2];
  const legacy = lessonMap[token];
  const topicId = legacy?.topic ?? (token === 'chapter' ? location.pathname.split('/')[3] : new URLSearchParams(location.search).get('topic'));
  const topic = topics.find(t=>t.id===topicId);
  const chapterLessons = lessons.filter(l=>l.topic===topicId);
  const { profile,session,run } = useStudy();
  const [query,setQuery] = useState('');
  useEffect(()=>{
    if (!topic) return;
    const target = legacy?.id ?? new URLSearchParams(location.search).get('at');
    void run(readLesson(session.userId, legacy?.id ?? chapterLessons[0].id));
    if (target) {
      const frame=requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({block:'start'}));
      return ()=>cancelAnimationFrame(frame);
    }
  },[location.pathname,location.search,session.userId]);

  if (token && !topic) return <div className="empty"><h1>강의를 찾을 수 없습니다.</h1><Link to="/lessons">강의실로</Link></div>;
  if (!topic) {
    const visible=topics.filter(t=>lessons.filter(l=>l.topic===t.id).some(l=>`${l.title} ${l.sections.map(s=>s.heading+' '+s.body.join(' ')).join(' ')}`.toLowerCase().includes(query.toLowerCase())));
    return <><Heading eyebrow="CLASSROOM" title="1~4장 강의실" description="한 장의 전체 내용을 한 페이지에서 읽습니다. PPT 순서의 본문과 추가 해설·가상 사례를 구분했습니다."/>
      <label className="chapter-search">강의 내용 검색<input placeholder="예: 모리스, 감사, MACOF, CSRF" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <div className="chapter-cards">{visible.map(t=>{
        const ls=lessons.filter(l=>l.topic===t.id), done=ls.filter(l=>profile.progress.some(p=>p.lessonId===l.id&&p.completed)).length;
        const pages=ls.flatMap(l=>l.sources.flatMap(r=>r.pages));
        return <article className="panel chapter-card" key={t.id}>
          <span className="eyebrow">CHAPTER {topics.indexOf(t)+1}</span><h2><Link to={`/lessons/chapter/${t.id}`}>{t.title}</Link></h2>
          <p>{t.subtitle}</p><p className="muted">PPT {Math.min(...pages)}~{Math.max(...pages)}번 · 전체 본문 {ls.reduce((n,l)=>n+l.sections.length,0)}개 소제목</p>
          <ul>{[...new Set(ls.map(l=>l.pptOutline))].map(o=><li key={o}>{o}</li>)}</ul>
          <p className="muted">{done===ls.length?'✓ 읽기 완료':done?`이전 학습 기록 ${done}/${ls.length}단원 보존됨`:'장 전체를 한 페이지에서 학습'}</p>
          <Link className="button primary" to={`/lessons/chapter/${t.id}`}>{topics.indexOf(t)+1}장 전체 읽기<ArrowRight size={16}/></Link>
        </article>;
      })}</div>{!visible.length&&<p className="empty">검색한 내용이 없습니다.</p>}
    </>;
  }

  const chapterNumber=topics.indexOf(topic)+1;
  const done=chapterLessons.every(l=>profile.progress.some(p=>p.lessonId===l.id&&p.completed));
  const supplemental=chapterLessons.filter(l=>l.additionalSections.length);
  const toc=<>{chapterLessons.map(l=><div className="chapter-toc-group" key={l.id}>
    <button onClick={()=>jump(l.id)}>{l.title}</button>
    {l.sections.map((s,i)=><button className="chapter-toc-detail" key={s.heading} onClick={()=>jump(`${l.id}-s${i}`)}>{s.heading}</button>)}
  </div>)}<button onClick={()=>jump('chapter-extras')}>추가 해설·정정</button><button onClick={()=>jump('chapter-checks')}>직접 작성한 복습 질문</button><button onClick={()=>jump('chapter-practice')}>가상 사례·문제</button></>;
  return <>
    <div className="lesson-top" id="chapter-top"><Link to="/lessons">← 1~4장 강의실</Link><Link to={`/practice?topic=${topic.id}`}>이 장 문제 연습 →</Link></div>
    <Heading eyebrow={`CHAPTER ${chapterNumber} · PPT 순서`} title={topic.title} description="이 페이지에서 장 전체를 읽을 수 있습니다. 본문 옆 슬라이드 번호로 PPT의 같은 위치를 확인하세요."/>
    <div className="lesson-layout chapter-layout">
      <article className="lesson-article chapter-article panel">
        <details className="mobile-lesson-toc"><summary>이 장의 목차 · 바로가기</summary><nav aria-label="장 목차">{toc}</nav></details>
        <p className="chapter-basis"><strong>PPT 기반 본문</strong> · 강의 자료의 순서·표·그림·코드 흐름을 글로 설명합니다. PPT에 포함된 교육용 사례는 본문에 표시했습니다.</p>
        {chapterLessons.map(l=><div className="chapter-unit" key={l.id} id={l.id} data-lesson-id={l.id}>
          <header className="chapter-unit-heading"><span className="eyebrow">{l.pptOutline}</span><h2>{l.title}</h2><BookmarkButton targetId={l.id} kind="lesson"/>
            {l.additionalSections.length>0&&<button className="supplement-jump" onClick={()=>jump(`${l.id}-extra`)}>이 단원의 추가 해설·정정 보기 ↓</button>}
          </header>
          {l.sections.map((s,i)=><section className="ppt-section" id={`${l.id}-s${i}`} key={s.heading}>
            <h3>{s.heading}</h3><div className="section-source">PPT {s.sources.flatMap(r=>r.pages).join(', ')}번 슬라이드</div>
            {s.body.map((p,j)=><p key={j}>{p}</p>)}
            {s.table&&<div className="table-scroll ppt-table"><table><caption>{s.heading} · PPT 항목을 풀어 쓴 표</caption><thead><tr>{s.table.columns.map(c=><th key={c} scope="col">{c}</th>)}</tr></thead><tbody>{s.table.rows.map((r,j)=><tr key={j}>{r.map((c,k)=><td key={k}>{c}</td>)}</tr>)}</tbody></table></div>}
            {s.code&&<pre tabIndex={0} className="ppt-code" aria-label={`${s.heading} 텍스트 예시`}><code>{s.code}</code></pre>}
          </section>)}
          <div className="chapter-unit-progress"><button onClick={()=>void run(readLesson(session.userId,l.id,!profile.progress.some(p=>p.lessonId===l.id&&p.completed)))}>
            <Check size={15}/>{profile.progress.some(p=>p.lessonId===l.id&&p.completed)?'이 단원 읽기 완료 해제':'이 단원 읽기 완료'}</button></div>
        </div>)}
        <section id="chapter-extras" className="chapter-extras"><span className="eyebrow">추가 해설·정정 · PPT 본문과 구분</span><h2>추가 해설과 원자료 정정</h2>
          <p>아래는 이해를 돕는 설명과 원자료의 오류·버전 차이를 보충한 내용입니다. PPT의 문장·연표와 구분해서 읽으세요.</p>
          {supplemental.length?supplemental.map(l=><div key={l.id} id={`${l.id}-extra`} className="chapter-extra-unit"><p className="muted">관련 본문: {l.title} <button className="supplement-jump" onClick={()=>jump(l.id)}>본문으로 돌아가기 ↑</button></p>{l.additionalSections.map(e=><section key={e.heading}><h3>{e.heading}</h3>{e.body.map((p,j)=><p key={j}>{p}</p>)}{e.links.length>0&&<ul className="supplement-links">{e.links.map(a=><li key={a.url}><a href={a.url} target="_blank" rel="noreferrer">{a.title} ↗</a></li>)}</ul>}</section>)}</div>):<p>이 장의 별도 정정 항목은 없습니다.</p>}
        </section>
        <section id="chapter-checks"><span className="eyebrow">직접 작성한 복습 질문 · 교재 원문 아님</span><h2>PPT 내용을 설명해 보기</h2>{chapterLessons.map(l=><details className="chapter-check-group" key={l.id}><summary>{l.title} · 복습 질문 3개</summary>{l.selfChecks.map((q,i)=><div className="self-check-item" key={q.question}><h3>{i+1}. {q.question}</h3><details><summary>정답과 이유 보기</summary><p>{q.answer}</p><p className="muted">{q.explanation}</p></details></div>)}</details>)}</section>
        <section id="chapter-practice"><span className="eyebrow">직접 만든 가상 사례·문제 · PPT 본문과 구분</span><h2>가상 자료로 적용 연습</h2><p>기존 사례와 예상문제는 유지했습니다. 실제 시험 기출이나 교재 연습문제 원문이 아니며, PPT의 모든 항목에 문제가 하나씩 대응하는 구성은 아닙니다.</p>{chapterLessons.map(l=><Practice key={l.id} lesson={l}/>)}</section>
        <Sources refs={[{sourceId:`P${chapterNumber}`,pages:chapterLessons.flatMap(l=>l.sources.flatMap(r=>r.pages))}]}/>
        <div className="actions"><button className="primary" onClick={()=>void run(readChapter(session.userId,topic.id,!done))}><Check size={17}/>{done?'장 전체 읽기 완료 해제':'장 전체 읽기 완료'}</button>
          {topics[chapterNumber]&&<Link className="button" to={`/lessons/chapter/${topics[chapterNumber].id}`}>다음 장 읽기<ArrowRight size={16}/></Link>}<button onClick={()=>jump('chapter-top')}><ChevronUp size={16}/>맨 위로</button></div>
      </article>
      <aside className="lesson-toc chapter-toc panel"><h2>이 장의 목차</h2><nav aria-label="장 목차">{toc}</nav></aside>
    </div>
  </>;
}
