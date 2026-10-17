import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, BookOpen, Timer } from "lucide-react";
import { blueprints, caseMap, questionMap, questions, topics } from "../content";
import { useStudy } from "../context";
import { newDraft, roundQuestions, selectQuestions } from "../engine";
import { updateProfile } from "../storage";
import { Heading } from "../components/UI";

export function QuizStart({ mock = false }: { mock?: boolean }) {
  const { roundId } = useParams();
  const { search } = useLocation();
  const { profile, session, run, setError } = useStudy();
  const navigate = useNavigate();
  const base = mock ? "/mock" : "/cbt";
  const round = blueprints.find((b) => b.id === roundId);
  const [minutes, setMinutes] = useState(round?.defaultMinutes ?? 75);
  const [mix, setMix] = useState(profile.settings.shuffle);
  const [starting, setStarting] = useState(false);
  if (search && ["case", "question", "bookmarks"].some((k) => new URLSearchParams(search).has(k)))
    return <Navigate replace to={`/practice${search}`} />;
  if (roundId && !round)
    return <div className="empty panel"><h1>이 회차를 찾을 수 없습니다.</h1><Link to={base}>전체 회차 보기</Link></div>;
  const start = async () => {
    if (!round || starting) return;
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
      setError("시험 시간은 1~240분의 정수로 입력하세요.");
      return;
    }
    setStarting(true);
    const draft = newDraft(session.userId, mock ? "exam" : "practice",
      `${round.title} · ${mock ? "시험" : "연습"}`, roundQuestions(round), minutes, mix);
    const saved = await run(updateProfile(session.userId, (p) => { p.draft = draft; p.settings.shuffle = mix; }));
    setStarting(false);
    if (saved) navigate("/quiz");
  };
  return <>
    {round && <Link className="back-link" to={base}>← 전체 회차</Link>}
    <Heading eyebrow={mock ? "COMPREHENSIVE EXAM" : "COMPREHENSIVE PRACTICE"}
      title={round?.title ?? (mock ? "종합모의고사" : "회차별 종합문제 연습")}
      description={mock ? "전 범위를 섞은 고정 문제 세트입니다. 제출 후 점수와 해설을 확인합니다." : "모의고사와 같은 종합 세트를 연습합니다. 문항별 답안 확인으로 근거와 해설을 읽을 수 있습니다."} />
    {profile.draft && <div className="notice resume-banner"><Timer size={18} /><span>진행 중: {profile.draft.title}. 새 응시를 시작하면 진행 중 풀이가 교체됩니다.</span><Link className="button" to="/quiz">이어서 풀기</Link></div>}
    {!round ? <>
      <div className="notice">사용자가 확인한 1~4장 범위 · 고유 사례 32개·문항 160개 · 5회×50=250 출제 자리 중 90자리는 회차 간 재출제입니다. 회차 안에는 중복이 없습니다. 교재 원문 문제집과 구분됩니다.</div>
      <div className="round-grid">{blueprints.map((b, i) => {
        const attempts = profile.attempts.filter((a) => a.title.startsWith(b.title) && a.mode === (mock ? "exam" : "practice"));
        const recent = attempts.at(-1);
        return <article className="panel round-card" key={b.id}>
          <div className="round-card-top"><span className="round-number">{String(i + 1).padStart(2, "0")}</span><span className="tag">전 범위 종합</span></div>
          <h2><Link to={`${base}/${b.id}`}>{b.title}</Link></h2>
          <p>{b.description}</p>
          <div className="round-facts"><span>{b.defaultCount}문항 · {b.caseIds.length}개 자료</span><span>{mock ? `${b.defaultMinutes}분 기본` : "시간 제한 없음"}</span></div>
          <p className="muted">{recent ? `최근 ${recent.score === null ? "자기 평가 대기" : `${recent.score}점`} · ${attempts.length}회 응시` : "아직 응시하지 않은 회차입니다."}</p>
          <div className="actions"><Link className="button primary" to={`${base}/${b.id}`}>{mock ? "시험 준비" : "연습 준비"}<ArrowRight size={16} /></Link><Link className="button" to={`${mock ? "/cbt" : "/mock"}/${b.id}`}>{mock ? "연습 모드" : "시험 모드"}</Link></div>
        </article>;
      })}</div>
      <p className="muted">50문항·75분은 사이트의 학습용 구성입니다. 시험 모드의 시간은 회차 준비 화면에서 조절할 수 있습니다.</p>
    </> : <section className="panel round-setup">
      <div className="mode-links"><Link className={`button ${!mock ? "primary" : ""}`} to={`/cbt/${round.id}`} aria-current={!mock ? "page" : undefined}>연습 모드</Link><Link className={`button ${mock ? "primary" : ""}`} to={`/mock/${round.id}`} aria-current={mock ? "page" : undefined}>시험 모드</Link></div>
      <div className="round-facts"><strong>{round.defaultCount}문항</strong><span>공통 자료 {round.caseIds.length}개</span><span>전 범위 · 고정 구성</span></div>
      <p>{mock ? "시간 제한이 있으며 답과 해설은 전체 제출 후 공개됩니다." : "문제마다 답안을 확인하고 해설을 읽을 수 있습니다. 시간 제한은 없습니다."} 미응답은 오답으로 채점하고, 서술 답안은 자기 평가 후 점수를 확정합니다.</p>
      <div className="checks">{mock && <label>시험 시간 (분)<input aria-label="시험 시간 (분)" type="number" min={1} max={240} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /></label>}<label className="checkbox-label"><input type="checkbox" checked={mix} onChange={(e) => setMix(e.target.checked)} />선지 순서 섞기</label></div>
      <div className="notice">문제 구성과 사례 순서는 고정됩니다. 같은 공통 자료에 연결된 문항은 연속해서 제시됩니다.</div>
      <button className="primary" disabled={starting} onClick={() => void start()}>{starting ? "준비 중…" : profile.draft ? `진행 중 풀이를 교체하고 ${mock ? "시험" : "연습"} 시작` : `${mock ? "시험" : "연습"} 시작`}<ArrowRight size={16} /></button>
      <details className="round-materials"><summary>이번 회차의 공통 자료 {round.caseIds.length}개 보기</summary><ol>{round.caseIds.map((id) => <li key={id}>{caseMap[id].title} <small>5문항</small></li>)}</ol></details>
    </section>}
  </>;
}

export function FocusPracticeStart() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const { profile, session, run } = useStudy();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  let pool = questions;
  const cid = params.get("case"), qid = params.get("question");
  const chapter = topics.find(t=>t.id===params.get("topic"));
  const bookmarks = params.get("bookmarks") === "1", wrong = params.get("wrong") === "1";
  if (cid) pool = pool.filter((q) => q.caseId === cid);
  if (qid) pool = pool.filter((q) => q.id === qid);
  if (chapter) pool = pool.filter(q=>q.topic===chapter.id);
  if (bookmarks) pool = pool.filter((q) => profile.bookmarks.some((b) => b.kind === "question" && b.targetId === q.id));
  if (wrong) pool = pool.filter((q) => profile.wrongNotes.some((w) => !w.resolved && w.questionId === q.id));
  if (!cid && !qid && !bookmarks && !wrong && !chapter) pool = [];
  const title = bookmarks ? "북마크 문제 복습" : wrong ? "오답 다시 풀기" : qid ? "선택 문제 복습" : chapter ? `${chapter.title} · 예상문제 복습` : "자료 확인 문제";
  const ids = selectQuestions({pool, count: pool.length, random: false}).ids;
  const start = async () => {
    if (!ids.length || starting) return;
    setStarting(true);
    const draft = newDraft(session.userId, "practice", title, ids, 75, profile.settings.shuffle);
    const saved = await run(updateProfile(session.userId, (p) => {p.draft = draft;}));
    setStarting(false);
    if (saved) navigate("/quiz");
  };
  return <>
    <Heading eyebrow="REVIEW PRACTICE" title={title} description="강의·자료·오답·북마크에서 연결한 문제를 확인합니다. 종합 회차는 회차별 문제 목록에서 선택할 수 있습니다." />
    {profile.draft && <div className="notice">진행 중인 {profile.draft.title}가 있습니다. 시작하면 이 풀이가 교체됩니다. <Link to="/quiz">이어서 풀기 →</Link></div>}
    <section className="panel setup"><h2>{ids.length}문항 복습</h2>
      {cid && caseMap[cid] && <p>{caseMap[cid].title}</p>}
      {qid && questionMap[qid] && <p>{questionMap[qid].stem}</p>}
      <p>{ids.length ? "문항별 답안 확인으로 해설을 읽고, 전체 제출하면 복습 결과가 기록됩니다." : "복습할 문제가 없습니다. 강의·문제에서 북마크하거나 종합 회차를 먼저 풀어 보세요."}</p>
      <div className="actions"><button className="primary" disabled={!ids.length || starting} onClick={() => void start()}>복습 시작<ArrowRight size={16} /></button><Link className="button" to="/cbt">종합 회차 선택</Link>{cid && caseMap[cid] && <Link className="button" to={`/lessons/${caseMap[cid].lessonId}`}><BookOpen size={16} />연결 강의</Link>}</div>
    </section>
  </>;
}
