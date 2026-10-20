import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { cases, allCases, lessons, lessonMap, questionMap, allTopics as topics } from "../content";
import { useStudy } from "../context";
import { topicStats } from "../engine";
import { updateProfile } from "../storage";
import { Heading, BookmarkButton } from "../components/UI";
import { DataChart } from "../components/Chart";
import { Materials } from "../components/Materials";
import { Explanation, answerText } from "./Quiz";
import { PastMaterial } from '../components/PastQuestion';

const date = (s: string) => new Date(s).toLocaleString("ko-KR", {timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"});
const views = {overview: "학습기록", progress: "강의별 진도", attempts: "응시 이력·점수", weakness: "취약점 분석", bookmarks: "내 북마크"};

export function Records() {
  const { profile, session } = useStudy();
  const rawView = new URLSearchParams(useLocation().search).get("view") ?? "overview";
  const view = rawView in views ? rawView as keyof typeof views : "overview";
  const show = (key: keyof typeof views) => view === "overview" || view === key;
  const stats = topicStats(profile.attempts), skills = topicStats(profile.attempts, "skill"), mistakes = topicStats(profile.attempts, "mistake");
  const completed = profile.progress.filter((p) => p.completed).length;
  const trend = profile.attempts.filter((a) => a.score !== null).slice(-10).map((a, i) => ({응시: i + 1, 점수: a.score}));
  const chartCase = {...cases[0], chart: {type: "line" as const, x: "응시", y: "점수", title: "확정 점수 추이", xLabel: "최근 확정 응시 순서", yLabel: "점수 (100점 기준)"}, rows: trend};
  return <>
    <Heading eyebrow="MY LEARNING RECORD" title={`${session.displayName}의 ${views[view]}`} description="현재 사용자의 진도·응시·오답·북마크를 확인합니다. 채점하지 않은 서술 응답은 자기 평가 대기로 남습니다." />
    <div className="actions record-view-tabs">{Object.entries(views).map(([key, label]) => <Link key={key} className={`button ${view === key ? "primary" : ""}`} to={key === "overview" ? "/records" : `/records?view=${key}`} aria-current={view === key ? "page" : undefined}>{label}</Link>)}</div>
    <section className="stat-grid">{[["누적 응시", `${profile.attempts.length}회`], ["읽기 완료", `${completed}/${lessons.length}`], ["복습할 오답", `${profile.wrongNotes.filter((w) => !w.resolved).length}개`], ["북마크", `${profile.bookmarks.length}개`]].map(([label, value]) => <div className="stat-card glass" key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
    {show("progress") && <section className="panel"><h2>강의별 진도</h2><progress max={lessons.length} value={completed} />
      <div className="progress-list">{lessons.map((l) => {
        const progress = profile.progress.find((p) => p.lessonId === l.id);
        return <div className="progress-row" key={l.id}><span className="tag">{l.id}</span><Link to={`/lessons/${l.id}`}>{l.title}</Link><span className={`tag ${progress?.completed ? "correct" : ""}`}>{progress?.completed ? "✓ 읽기 완료" : progress || profile.lastLessonId === l.id ? "읽는 중" : "아직 읽지 않음"}</span></div>;
      })}</div>
    </section>}
    {show("attempts") && <><section className="panel"><h2>점수 추이</h2>{trend.length ? <DataChart data={chartCase} /> : <p className="empty">확정된 점수가 아직 없습니다.</p>}</section>
      <section className="panel"><div className="section-title"><h2>응시 이력</h2><span>{profile.attempts.length}회</span></div>{profile.attempts.length ? <div className="table-scroll"><table><thead><tr><th>응시</th><th>날짜 (한국)</th><th>정답/전체</th><th>점수</th><th>결과</th></tr></thead><tbody>{[...profile.attempts].reverse().map((a) => <tr key={a.id}><td>{a.title}<small>{a.mode === "exam" ? "시험 모드" : "연습 모드"}</small></td><td>{date(a.updatedAt)}</td><td>{a.correct}/{a.total}</td><td>{a.score === null ? `평가 대기 ${a.pending}개` : `${a.score}점`}</td><td><Link to={`/results/${a.id}`}>결과 보기 →</Link></td></tr>)}</tbody></table></div> : <p className="empty">아직 응시 기록이 없습니다. 종합 회차를 풀고 제출하면 여기에 저장됩니다.</p>}</section>
    </>}
    {show("weakness") && <><section className="panel"><h2>주제별 정답률</h2>{topics.map((t) => <div className="weakness-row" key={t.id}><span>{t.title}</span>{stats[t.id] ? <><b>{Math.round(stats[t.id].correct / stats[t.id].total * 100)}%</b><small>{stats[t.id].correct}/{stats[t.id].total} · 누적 채점 응답</small></> : <small>아직 응시하지 않음</small>}</div>)}</section>
      <div className="records-layout">{[["학습 기능별 취약점", skills], ["실수 유형별 취약점", mistakes]].map(([label, data]) => <section className="panel" key={String(label)}><h2>{String(label)}</h2>{Object.entries(data as typeof skills).length ? Object.entries(data as typeof skills).map(([key, stat]) => <div className="weakness-row" key={key}><span>{key}</span><b>{stat.total - stat.correct}회 오답</b><small>{stat.correct}/{stat.total} 정답 · 자기 평가 포함</small></div>) : <p className="empty">채점된 응답이 없습니다.</p>}</section>)}</div>
    </>}
    {show("bookmarks") && <section className="panel"><h2>북마크</h2>{profile.bookmarks.length ? <><Link className="button" to="/practice?bookmarks=1">북마크 문제 복습</Link><div className="bookmark-list">{profile.bookmarks.map((b) => <div className="linked-case" key={b.kind + b.targetId}><div><span className="tag">{b.kind === "lesson" ? "강의" : "문제"} · {b.targetId}</span><strong>{b.kind === "lesson" ? lessonMap[b.targetId]?.title : questionMap[b.targetId]?.stem}</strong></div><Link className="button" to={b.kind === "lesson" ? `/lessons/${b.targetId}` : `/practice?question=${b.targetId}`}>{b.kind === "lesson" ? "읽기" : "다시 풀기"}<ArrowRight size={14} /></Link></div>)}</div></> : <p className="empty">강의와 문제의 북마크 버튼으로 저장하세요.</p>}</section>}
    <div className="actions"><Link className="button" to="/account?view=backup">백업·복원</Link><Link className="button" to="/wrong">오답 복습</Link>{profile.draft && <Link className="button primary" to="/quiz">이어서 풀기</Link>}</div>
  </>;
}

export function WrongNotes() {
  const { profile, session, run } = useStudy();
  const view = new URLSearchParams(useLocation().search).get("view") ?? "unresolved";
  const [search, setSearch] = useState(""), [topic, setTopic] = useState(""), [mistake, setMistake] = useState("");
  const [status, setStatus] = useState(view === "resolved" ? "resolved" : view === "all" || view === "repeat" ? "all" : "unresolved");
  const title = view === "resolved" ? "해결한 오답" : view === "repeat" ? "반복해서 틀린 문제" : view === "all" ? "모든 오답" : "복습할 오답";
  const visible = profile.wrongNotes.filter((w) => {
    const q = questionMap[w.questionId];
    return q && (status === "all" || (status === "resolved" ? w.resolved : !w.resolved)) && (view !== "repeat" || w.count > 1) && (!topic || q.topic === topic) && (!mistake || q.mistake === mistake) && `${q.id} ${q.stem} ${q.explanation}`.toLowerCase().includes(search.toLowerCase());
  });
  return <>
    <Heading eyebrow="WRONG ANSWER NOTE" title={title} description="같은 문제의 오답 횟수와 최근 결과를 모아 봅니다. 해설과 연결 강의를 확인한 뒤 다시 풀어 보세요." />
    <div className="actions"><Link className="button" to="/wrong">복습할 오답</Link><Link className="button" to="/wrong?view=all">모든 오답</Link><Link className="button" to="/wrong?view=resolved">해결한 오답</Link><Link className="button" to="/wrong?view=repeat">반복 오답</Link><Link className="button primary" to="/practice?wrong=1">오답 다시 풀기</Link></div>
    <div className="filters"><label>오답 검색<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="문제 ID·내용 검색" /></label><label>주제<select value={topic} onChange={(e) => setTopic(e.target.value)}><option value="">모든 주제</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label><label>실수 유형<select value={mistake} onChange={(e) => setMistake(e.target.value)}><option value="">모든 유형</option>{["계산", "단위", "코드", "개념", "과도한 해석"].map((m) => <option key={m}>{m}</option>)}</select></label><label>해결 상태<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="unresolved">복습 필요</option><option value="resolved">해결한 문제</option><option value="all">모두 보기</option></select></label></div>
    {visible.map((w) => {
      const q = questionMap[w.questionId], data = allCases.find((c) => c.id === q.caseId)!;
      return <article className="panel wrong-card" key={w.questionId}><div className="question-top"><div className="tags"><span className="tag">{q.id}</span><span className="tag">{q.mistake}</span><span className="tag">오답 {w.count}회</span><span className="tag">{w.resolved ? "✓ 해결" : "복습 필요"}</span></div><BookmarkButton targetId={q.id} kind="question" /></div><h2>{q.stem}</h2><p>최근 오답: {answerText(q, w.answer)} · {date(w.updatedAt)}</p><details><summary>사례 자료와 해설 펼치기</summary>{q.past ? <PastMaterial q={q}/> : <Materials data={data} />}<Explanation q={q} answer={w.answer} /></details><div className="actions"><Link className="button primary" to={`/practice?question=${q.id}`}>재풀이<ArrowRight size={15} /></Link>{q.lessonId && <Link className="button" to={`/lessons/${q.lessonId}`}><BookOpen size={16} />연결 강의</Link>}<button onClick={() => void run(updateProfile(session.userId, (p) => {const n = p.wrongNotes.find((n) => n.questionId === q.id); if (n) {n.resolved = !n.resolved; n.updatedAt = new Date().toISOString();}}))}>{w.resolved ? "복습 필요로 표시" : "해결 표시"}</button></div></article>;
    })}
    {!visible.length && <div className="empty panel"><h2>이 조건의 오답이 없습니다.</h2><p>{profile.wrongNotes.length ? "해결 상태나 검색 조건을 바꿔 확인하세요." : "제출한 풀이의 오답이 여기에 모입니다."}</p><Link className="button primary" to="/cbt">종합 회차 연습</Link></div>}
  </>;
}
