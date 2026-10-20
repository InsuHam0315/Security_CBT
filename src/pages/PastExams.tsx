import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { allTopics, questionMap } from '../content';
import { pastAudit, pastPapers, pastQuestions, pastReviews, pastSourceMap, pastSources } from '../content/past';
import { newDraft } from '../engine';
import { updateProfile } from '../storage';
import { useStudy } from '../context';
import { Heading, kindLabel } from '../components/UI';

export function PastExams() {
  const {paperId}=useParams(), [params]=useSearchParams(), navigate=useNavigate();
  const {profile,session,run,setError}=useStudy();
  const [search,setSearch]=useState(''),[topic,setTopic]=useState(''),[origin,setOrigin]=useState('');
  const [mode,setMode]=useState<'practice'|'exam'>('practice'),[minutes,setMinutes]=useState(60),[mix,setMix]=useState(false),[starting,setStarting]=useState(false);
  const view=params.get('view')??'', paper=pastPapers.find(p=>p.id===paperId);
  if(paperId&&!paper) return <section className="empty panel"><h1>문제집을 찾을 수 없습니다.</h1><Link to="/past-exams">족보 문제집</Link></section>;
  const visible=(paper?paper.questionIds.map(id=>questionMap[id]):pastQuestions).filter(q=>(!topic||q.topic===topic)&&(!origin||q.past?.status===origin)&&`${q.id} ${q.stem}`.toLowerCase().includes(search.toLowerCase()));
  async function start() {
    if(starting||!visible.length)return;
    if(mode==='exam'&&(!Number.isInteger(minutes)||minutes<1||minutes>240)){setError('시험 시간은 1~240분의 정수로 입력하세요.');return;}
    setStarting(true);
    const draft=newDraft(session.userId,mode,`족보 · ${paper?.title??'선택 범위 복습'}`,visible.map(q=>q.id),minutes,mix);
    const saved=await run(updateProfile(session.userId,p=>{p.draft=draft;}));
    setStarting(false);if(saved)navigate('/quiz');
  }
  const filters=<div className="filters">
    <label>문제 검색<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="문제 ID·내용"/></label>
    <label>주제<select value={topic} onChange={e=>setTopic(e.target.value)}><option value="">모든 주제</option>{allTopics.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
    <label>문제 구분<select value={origin} onChange={e=>setOrigin(e.target.value)}><option value="">기출·재구성 전체</option><option>기출 복원</option><option>정리자료 재구성</option></select></label>
  </div>;
  const setup=<section className="panel past-setup">
    <h2>{visible.length}문항 {paper?'풀기':'선택 범위 풀기'}</h2>
    <p>객관식·단답은 자동 채점합니다. 서술·계산 과정 문제는 검토한 모범답안과 채점 요소로 자기 평가합니다. 확인이 필요한 원문은 점수에 포함하지 않습니다.</p>
    <div className="checks"><label>풀이 방식<select aria-label="풀이 방식" value={mode} onChange={e=>setMode(e.target.value as 'practice'|'exam')}><option value="practice">연습 · 문항별 해설 확인</option><option value="exam">시험 · 제출 후 해설 확인</option></select></label>
      {mode==='exam'&&<label>시험 시간 (분)<input aria-label="족보 시험 시간 (분)" type="number" min={1} max={240} value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/></label>}
      <label className="checkbox-label"><input type="checkbox" checked={mix} onChange={e=>setMix(e.target.checked)}/>선지 순서 섞기</label>
    </div>
    {profile.draft&&<p className="notice">진행 중: {profile.draft.title}. 시작하면 진행 중 풀이가 교체됩니다. <Link to="/quiz">이어서 풀기 →</Link></p>}
    <button className="primary" disabled={starting||!visible.length} onClick={()=>void start()}>{starting?'준비 중…':profile.draft?'진행 중 풀이를 교체하고 족보 시작':'족보 풀이 시작'}<ArrowRight size={16}/></button>
  </section>;
  return <>
    {paper&&<Link className="back-link" to="/past-exams">← 족보 전체 문제집</Link>}
    <Heading eyebrow="REVIEWED PAST PAPERS" title={paper?.title??'족보 문제집'} description={paper?.description??'제공 자료를 검토해 기출 복원·정리자료 재구성을 구분했습니다. 답안은 출처에 적힌 학생 답을 그대로 채택하지 않고 개념과 조건을 확인해 설명합니다.'}/>
    <div className="actions catalogue-tabs"><Link className="button" to="/past-exams">문제집 선택</Link><Link className="button" to="/past-exams?view=all">고유 문제 전체</Link><Link className="button" to="/past-exams?view=review">검토·수정 기록</Link></div>
    {!paper&&view!=='review'&&<div className="notice">고유 {pastQuestions.length}문항 · 기출 복원 {pastQuestions.filter(q=>q.past?.status==='기출 복원').length} · 정리자료 재구성 {pastQuestions.filter(q=>q.past?.status==='정리자료 재구성').length}. 여러 시험·정리에 반복된 문제는 합쳤습니다. 기말·교재 6~10장도 포함되어 현재 PPT 1~4장 범위와 다릅니다. OWASP는 2025 최종판 기준 수정 문제만 수록했습니다.</div>}
    {view==='review'&&!paper?<>
      <section className="panel"><h2>자료 확인과 정답 검토</h2><p>전체 {pastAudit.total}개 파일(HWP {pastAudit.hwp}, TXT {pastAudit.text}, 이미지 {pastAudit.images}, ZIP {pastAudit.zip})을 확인했습니다. {pastAudit.note}</p><p>문제 조건이 확인되는 항목은 검토한 정답으로 수정했습니다. 조건·선지가 없는 원형을 임의로 복원하지 않았으며, 수정 가능한 개념은 완전한 새 문제로 연결했습니다. 모범답안은 교수님의 공식 채점표가 아닙니다.</p></section>
      {pastReviews.map(r=><article className="panel past-review" key={r.id}><span className="tag">채점 제외 원문 / 검토 기록</span><h2>{r.title}</h2><p className="muted">{pastSourceMap[r.sourceId].title} · {r.locator}</p><p><b>검토 이유:</b> {r.issue}</p><p><b>처리:</b> {r.resolution}</p>{r.replacement&&<Link className="button" to={`/practice?question=${r.replacement}`}>수정·대체 문제 풀기<ArrowRight size={15}/></Link>}</article>)}
      <section className="panel"><h2>출처 묶음</h2>{pastSources.map(s=><div key={s.id}><h3>{s.title} · {s.files}개 파일</h3><p>{s.description}</p></div>)}</section>
    </>:!paper&&view!=='all'?<div className="round-grid">{pastPapers.map(p=><article className="panel round-card" key={p.id}><span className="tag">{p.category}</span><h2><Link to={`/past-exams/${p.id}`}>{p.title}</Link></h2><p>{p.description}</p><p>{p.questionIds.length}문항 · 다른 세트와 중복 가능</p><Link className="button primary" to={`/past-exams/${p.id}`}><BookOpen size={16}/>문제집 열기</Link></article>)}</div>:<>
      {filters}{setup}
      <section className="panel"><h2>이번 범위의 문제 {visible.length}개</h2><p className="muted">아래에는 제목만 표시합니다. 정답과 수정 해설은 풀이 화면에서 답안을 확인하거나 제출한 뒤 공개됩니다.</p><ol className="past-question-list">{visible.map(q=><li key={q.id}><span className="tag">{q.past?.status} · {kindLabel[q.kind]}</span><p>{q.stem}</p><Link to={`/practice?question=${q.id}`}>이 문제만 풀기 →</Link></li>)}</ol>{!visible.length&&<p className="empty">검색 조건에 맞는 문제가 없습니다.</p>}</section>
    </>}
  </>;
}
