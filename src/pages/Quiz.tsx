import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flag,
  Timer,
} from "lucide-react";
import { BookmarkButton, Heading, kindLabel } from "../components/UI";
import { useStudy } from "../context";
import {
  caseMap,
  blueprints,
  cases,
  lessonMap,
  questionMap,
  allTopics,
} from "../content";
import type { Attempt, Question, ExamDraft } from "../types";
import { grade, topicStats } from "../engine";
import {
  evaluateEssay,
  patchDraft,
  submitDraft,
} from "../storage";
import { Materials, Sources } from "../components/Materials";
import { AnswerInput } from "../components/AnswerInput";
import { PastMaterial, PastProvenance } from '../components/PastQuestion';
export function answerText(q: Question, value: string | undefined) {
  return !value?.trim()
    ? "미응답"
    : q.kind === "choice"
      ? (q.choices!.find((c) => c.id === value)?.text ?? "유효하지 않은 선지")
      : value;
}
export function correctText(q: Question) {
  return q.kind === "choice"
    ? q.choices!.find((c) => c.id === q.correctId)!.text
    : q.kind === "numeric"
      ? `${q.numeric!.value} ${q.numeric!.unit}`
      : q.modelAnswer;
}
export function Explanation({ q, answer }: { q: Question; answer?: string }) {
  return (
    <div className="explanation">
      <span className="eyebrow">WHY THIS ANSWER</span>
      <h3>정답 · {correctText(q)}</h3>
      {answer !== undefined && <p>내 답: {answerText(q, answer)}</p>}
      <p>{q.explanation}</p>
      <ol>
        {q.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {q.choices && (
        <details>
          <summary>선지별 이유</summary>
          <ul>
            {q.choices.map((c) => (
              <li key={c.id}>
                <b>{c.text}</b> · {c.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
      {q.kind === "essay" && (
        <>
          <h4>자기 평가 요소</h4>
          <ul>
            {q.rubric!.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </>
      )}
      <p className="mistake-note">흔한 오류: {q.commonError}</p>
      <PastProvenance q={q} explanation />
      {q.lessonId && <Link className="button" to={`/lessons/${q.lessonId}`}>
        연결 강의 · {lessonMap[q.lessonId].title}
        <ArrowRight size={14} />
      </Link>}
      {q.past ? <Link className="button" to="/past-exams">족보 문제집으로</Link> : <Sources refs={q.sources} />}
    </div>
  );
}
export function Quiz() {
  const { profile, session, run } = useStudy(),
    navigate = useNavigate(),
    draft = profile.draft;
  const [now, setNow] = useState(Date.now()),
    [mobileView, setMobileView] = useState<"question" | "data">("question");
  const submitting = useRef(false);
  const finish = async (expired = false) => {
    if (!draft || submitting.current) return;
    submitting.current = true;
    const result = await run(submitDraft(draft.userId, draft.id, expired));
    if (result?.attempts.some((a) => a.id === draft.id))
      navigate(`/results/${draft.id}`);
    else submitting.current = false;
  };
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (draft?.mode === "exam" && draft.endsAt !== null && now >= draft.endsAt)
      void finish(true);
  }, [now, draft?.id]);
  useEffect(() => {
    if (draft?.questionIds[draft.index]?.startsWith('PQ-')) window.scrollTo(0, 0);
  }, [draft?.id, draft?.index]);
  if (!draft)
    return (
      <div className="empty">
        <h1>진행 중인 풀이가 없습니다.</h1>
        <Link className="button primary" to="/cbt">
          문제 선택
        </Link>
        <Link className="button" to="/records">
          학습기록
        </Link>
      </div>
    );
  const q = questionMap[draft.questionIds[draft.index]],
    data = caseMap[q.caseId],
    answer = draft.answers[q.id] ?? "",
    checked = draft.mode === "practice" && draft.checked.includes(q.id),
    result = checked ? grade(q, answer, draft.selfGrades[q.id]) : null,
    remaining =
      draft.endsAt === null
        ? null
        : Math.max(0, Math.ceil((draft.endsAt - now) / 1000));
  const patch = (fn: (d: ExamDraft) => void) =>
    run(patchDraft(draft.userId, draft.id, fn));
  const setAnswer = (v: string) =>
    patch((d) => {
      d.answers[q.id] = v;
      d.checked = d.checked.filter((id) => id !== q.id);
      delete d.selfGrades[q.id];
    }).then(saved => saved?.draft?.id === draft.id && saved.draft.answers[q.id] === v);
  const order = draft.choiceOrders[q.id] ?? q.choices?.map((c) => c.id) ?? [];
  const gradeSelf = (v: boolean) =>
    patch((d) => {
      d.selfGrades[q.id] = v;
    });
  const answered = draft.questionIds.filter((id) =>
    draft.answers[id]?.trim(),
  ).length;
  return (
    <>
      <div className="quiz-header">
        <div>
          <span className="eyebrow">
            {draft.mode === "exam"
              ? "EXAM MODE · 제출 후 해설 공개"
              : "PRACTICE MODE · 확인 후 해설 공개"}
          </span>
          <h1>{draft.title}</h1>
        </div>
        <div
          className={`timer ${remaining !== null && remaining < 60 ? "urgent" : ""}`}
        >
          <Timer size={18} />
          {remaining === null
            ? "시간 제한 없음"
            : `${Math.floor(remaining / 60)
                .toString()
                .padStart(
                  2,
                  "0",
                )}:${(remaining % 60).toString().padStart(2, "0")}`}
        </div>
      </div>
      <div className="quiz-progress">
        <span>
          {answered}/{draft.questionIds.length} 응답 · 자동 저장
        </span>
        <progress max={draft.questionIds.length} value={answered} />
        <span>
          {draft.mode === "exam"
            ? "시간 만료 시 한 번 자동 제출"
            : "전체 제출 후 오답·기록 저장"}
        </span>
      </div>
      {!q.past && <div className="mobile-quiz-tabs">
        <button
          aria-pressed={mobileView === "question"}
          onClick={() => setMobileView("question")}
        >
          문제
        </button>
        <button
          aria-pressed={mobileView === "data"}
          onClick={() => setMobileView("data")}
        >
          공통 자료
        </button>
      </div>}
      <div className={`quiz-layout ${q.past ? 'past-quiz-layout' : ''}`}>
        {!q.past && <div
          className={`quiz-material ${mobileView === "data" ? "show-mobile" : ""}`}
        >
          <Materials key={data.id} data={data} />
          <Sources refs={data.sources} />
        </div>}
        <div
          className={`quiz-question ${q.past || mobileView === "question" ? "show-mobile" : ""}`}
        >
          <section className="panel question-panel">
            <div className="question-top">
              <span className="tag">
                문제 {draft.index + 1} / {draft.questionIds.length}
              </span>
              <BookmarkButton targetId={q.id} kind="question" />
            </div>
            <div className="tags">
              <span className="tag">{q.id}</span>
              <span className="tag">{q.difficulty}</span>
              <span className="tag">{kindLabel[q.kind]}</span>
              <span className="tag">{q.skill}</span>
            </div>
            <h2>{q.stem}</h2>
            <PastProvenance q={q} />
            <PastMaterial q={q} />
            {q.kind === "choice" ? (
              <fieldset className="choices">
                <legend className="sr-only">정답 선택</legend>
                {order.map((id, i) => {
                  const choice = q.choices!.find((c) => c.id === id)!;
                  return (
                    <label
                      key={id}
                      className={`choice ${answer === id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={id}
                        checked={answer === id}
                        onChange={() => setAnswer(id)}
                      />
                      <span className="choice-number">{i + 1}</span>
                      <span>{choice.text}</span>
                    </label>
                  );
                })}
              </fieldset>
            ) : (
              <label className="answer-input">
                {q.kind === "numeric"
                  ? `${q.numeric!.unit} · ${q.numeric!.rounding} · 허용 오차 ±${q.numeric!.tolerance}`
                  : q.kind === "essay"
                    ? q.past ? "질문의 모든 항목과 계산 근거를 적어 보세요. 제출 후 채점 요소로 자기 평가합니다." : "근거와 해석 한계를 2~4문장으로 적어 보세요."
                    : "지정된 용어로 짧게 입력하세요."}
                <AnswerInput key={`${draft.userId}:${draft.id}:${q.id}`}
                  kind={q.kind} savedValue={answer} onSave={setAnswer} />
              </label>
            )}
            <div className="question-actions">
              <button
                aria-pressed={draft.reviewed.includes(q.id)}
                onClick={() =>
                  patch((d) => {
                    d.reviewed = d.reviewed.includes(q.id)
                      ? d.reviewed.filter((id) => id !== q.id)
                      : [...d.reviewed, q.id];
                  })
                }
              >
                <Flag size={15} />
                {draft.reviewed.includes(q.id)
                  ? "검토 표시 해제"
                  : "나중에 검토"}
              </button>
              {draft.mode === "practice" && (
                <button
                  className="primary"
                  disabled={!answer.trim()}
                  onClick={() =>
                    patch((d) => {
                      if (!d.checked.includes(q.id)) d.checked.push(q.id);
                    })
                  }
                >
                  답안 확인
                  <Check size={16} />
                </button>
              )}
            </div>
            {checked && (
              <>
                <p
                  className={`grade-status ${result === true ? "correct" : result === false ? "incorrect" : ""}`}
                >
                  {result === null
                    ? "서술 답안 · 자기 평가 대기"
                    : result
                      ? "✓ 정답"
                      : "× 오답"}
                </p>
                <Explanation q={q} answer={answer} />
                {q.kind === "essay" && (
                  <div className="actions">
                    <button
                      onClick={() => gradeSelf(true)}
                      aria-pressed={draft.selfGrades[q.id] === true}
                    >
                      채점 요소를 충족했어요
                    </button>
                    <button
                      onClick={() => gradeSelf(false)}
                      aria-pressed={draft.selfGrades[q.id] === false}
                    >
                      다시 복습할게요
                    </button>
                  </div>
                )}
              </>
            )}
            <div className="prev-next">
              <button
                disabled={draft.index === 0}
                onClick={() =>
                  patch((d) => {
                    d.index--;
                  })
                }
              >
                <ArrowLeft size={16} />
                이전
              </button>
              <button
                disabled={draft.index === draft.questionIds.length - 1}
                onClick={() =>
                  patch((d) => {
                    d.index++;
                  })
                }
              >
                다음
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
          <section className="panel palette-panel">
            <h3>문제 번호</h3>
            <div className="palette">
              {draft.questionIds.map((id, i) => (
                <button
                  key={id}
                  aria-label={`${i + 1}번 ${draft.answers[id]?.trim() ? "응답" : "미응답"}${draft.reviewed.includes(id) ? " 검토" : ""}`}
                  aria-current={draft.index === i ? "step" : undefined}
                  className={`${draft.answers[id]?.trim() ? "answered" : ""} ${draft.reviewed.includes(id) ? "reviewed" : ""} ${i === draft.index ? "current" : ""}`}
                  onClick={() =>
                    patch((d) => {
                      d.index = i;
                    })
                  }
                >
                  {i + 1}
                  {draft.reviewed.includes(id) && <Flag size={9} />}
                </button>
              ))}
            </div>
            <p className="muted">
              빈 칸=미응답 · 채움=응답 · ⚑=검토 · 테두리=현재
            </p>
            <button
              className="primary submit"
              disabled={submitting.current}
              onClick={() => void finish(false)}
            >
              전체 제출 · 미응답 {draft.questionIds.length - answered}개
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
export function Results() {
  const { id } = useParams(),
    { profile, session, run } = useStudy();
  const a = profile.attempts.find((a) => a.id === id);
  const [filter, setFilter] = useState("all");
  if (!a)
    return (
      <div className="empty">
        <h1>이 사용자에게 저장된 응시가 없습니다.</h1>
        <Link to="/records">내 기록</Link>
      </div>
    );
  const visible = a.questionIds.filter(
    (qid) =>
      filter === "all" ||
      (filter === "wrong" && a.grades[qid] === false) ||
      (filter === "pending" && a.grades[qid] === null),
  );
  const stats = topicStats([a]);
  const round = blueprints.find((b) => a.title.startsWith(b.title));
  return (
    <>
      <Heading
        eyebrow="RESULT & REFLECTION"
        title={a.title}
        description={`${a.expired ? "시간 만료로 제출 · " : ""}미응답은 오답. 서술 답안은 자기 평가 결과로 확정합니다.`}
      />
      <section className="result-summary glass">
        <div>
          <span>최종 점수</span>
          <strong>{a.score === null ? "평가 대기" : `${a.score}점`}</strong>
        </div>
        <div>
          <span>정답</span>
          <strong>
            {a.correct} / {a.total}
          </strong>
        </div>
        <div>
          <span>자기 평가 대기</span>
          <strong>{a.pending}문항</strong>
        </div>
        <div>
          <span>풀이 시간</span>
          <strong>
            {Math.floor(a.durationSeconds / 60)}분 {a.durationSeconds % 60}초
          </strong>
        </div>
      </section>
      <div className="actions">
        <Link className="button" to="/wrong">
          오답노트
        </Link>
        <Link className="button" to="/records">
          내 기록
        </Link>
        <Link className="button primary" to={a.questionIds.some(id=>questionMap[id].past)?'/past-exams':'/cbt'}>
          문제집 선택
        </Link>
        {round && <Link className="button" to={`${a.mode === "exam" ? "/mock" : "/cbt"}/${round.id}`}>같은 회차 다시 풀기</Link>}
      </div>
      <section className="panel"><h2>이번 응시의 주제별 결과</h2>{allTopics.filter(t=>a.questionIds.some(id=>questionMap[id].topic===t.id)).map((t) => <div className="weakness-row" key={t.id}><span>{t.title}</span>{stats[t.id] ? <><b>{stats[t.id].correct}/{stats[t.id].total} 정답</b><Link to={a.questionIds.some(id=>questionMap[id].past)?'/past-exams?view=all':`/lessons?topic=${t.id}`}>범위 복습 →</Link></> : <small>채점된 응답 없음</small>}</div>)}<p className="muted">자기 평가 대기 응답은 평가를 마친 뒤 포함됩니다.</p></section>
      <div className="filters">
        <label>
          결과 보기
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">전체</option>
            <option value="wrong">오답</option>
            <option value="pending">자기 평가 대기</option>
          </select>
        </label>
      </div>
      {visible.map((qid) => {
        const q = questionMap[qid],
          g = a.grades[qid];
        return (
          <article className="panel result-question" key={qid}>
            <div className="question-top">
              <span
                className={`tag ${g ? "correct" : g === false ? "incorrect" : ""}`}
              >
                {g === null ? "자기 평가 대기" : g ? "✓ 정답" : "× 오답"} ·{" "}
                {qid}
              </span>
              <BookmarkButton targetId={qid} kind="question" />
            </div>
            <h2>{q.stem}</h2>
            {q.past ? <PastMaterial q={q}/> : <details>
              <summary>공통 자료 다시 보기 · {caseMap[q.caseId].title}</summary>
              <Materials data={caseMap[q.caseId]} />
            </details>}
            <Explanation q={q} answer={a.answers[qid] ?? ""} />
            {q.kind === "essay" && a.answers[qid]?.trim() && (
              <div className="actions">
                <button
                  aria-pressed={a.selfGrades[qid] === true}
                  onClick={() =>
                    void run(evaluateEssay(session.userId, a.id, qid, true))
                  }
                >
                  채점 요소를 충족했어요
                </button>
                <button
                  aria-pressed={a.selfGrades[qid] === false}
                  onClick={() =>
                    void run(evaluateEssay(session.userId, a.id, qid, false))
                  }
                >
                  다시 복습할게요
                </button>
              </div>
            )}
          </article>
        );
      })}
      {!visible.length && <p className="empty">이 조건의 문항이 없습니다.</p>}
    </>
  );
}
