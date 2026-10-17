import { Link } from "react-router-dom";
import type { Lesson } from "../types";
import { caseMap, lessonMap, questionMap } from "../content";
import { correctText } from "../pages/Quiz";
import { Code, Materials } from "./Materials";

export function LessonPrimer({ lesson }: { lesson: Lesson }) {
  return (
    <section id="start" className="lesson-primer">
      <span className="eyebrow">START HERE</span>
      <h2>이 강의의 핵심</h2>
      <p>{lesson.intro}</p>
      {lesson.prerequisiteIds.length ? (
        <>
          <h3>함께 확인할 강의</h3>
          <div className="prerequisite-links">
            {lesson.prerequisiteIds.map((id) => (
              <Link key={id} to={`/lessons/${id}`}>
                <span className="tag">{id}</span>{lessonMap[id].title}
              </Link>
            ))}
          </div>
        </>
      ) : null}
      <p className="study-route">수업 개념·비교 → 코드·도식 해석 → 사례 풀이 → 자가 점검 → 종합 회차 연습</p>
    </section>
  );
}

export function WorkedExamples({ lesson }: { lesson: Lesson }) {
  return (
    <section id={`worked-${lesson.id}`}>
      <span className="eyebrow">WORKED EXAMPLES</span>
      <h2>직접 만든 가상 사례 풀이</h2>
      {lesson.walkthrough.map((p, i) => <p key={i}>{p}</p>)}
      {lesson.workedExamples.map((example, i) => {
        const data = caseMap[example.caseId];
        const calc = questionMap[example.calculationId];
        const concept = questionMap[example.conceptId];
        return (
          <details key={data.id} className="worked-example" open={i === 0}>
            <summary>{data.id} · {data.title} · 풀이 펼치기</summary>
            <Materials data={data} interactive={false} />
            <div className="worked-solution">
              <h3>사례를 판단하기 전에</h3>
              <p>원본 표의 한 행: <strong>{data.unit}</strong> · 원본 N={data.validN}. 아래 계산은 각 문제에 제시된 조건을 적용합니다.</p>
              <h3>{calc.stem}</h3>
              <ol>{calc.steps.map((step, n) => <li key={n}>{step}</li>)}</ol>
              <p className="answer-line">답: {correctText(calc)}</p>
              <p>{calc.explanation}</p>
              <h3>선택지의 근거까지 읽기</h3>
              <p>{concept.stem}</p>
              <ul className="choice-reasons">
                {concept.choices?.map((choice) => (
                  <li key={choice.id}>
                    <strong>{choice.id === concept.correctId ? "✓ 정답" : "다른 보기"} · {choice.text}</strong>
                    <p>{choice.reason}</p>
                  </li>
                ))}
              </ul>
              <p className="notice">주의: {calc.commonError} {concept.commonError}</p>
              <Link className="button" to={`/practice?case=${data.id}`}>이 자료 확인 문제 →</Link>
            </div>
          </details>
        );
      })}
    </section>
  );
}

export function LessonLab({ lesson }: { lesson: Lesson }) {
  if (!lesson.microLab) return null;
  return (
    <section id={`lab-${lesson.id}`}>
      <span className="eyebrow">INPUT → OUTPUT</span>
      <h2>추가 예제 · 가상 입력의 출력 확인</h2>
      <p>{lesson.microLab.kind} · 강의 개념을 작은 가상 입력으로 재구성했습니다. 검산 문서에서 실행 조건과 결과를 확인할 수 있습니다.</p>
      <p className="muted">먼저 각 변수와 연산 뒤에 남는 값을 예상한 뒤 출력과 비교하세요.</p>
      <Code code={lesson.microLab.code} notes={lesson.microLab.notes} />
      <details className="lab-output">
        <summary>실행 결과 확인</summary>
        <pre tabIndex={0} aria-label={`${lesson.id} 코드 실행 결과`}><code>{lesson.microLab.output}</code></pre>
      </details>
    </section>
  );
}

export function LessonSelfChecks({ lesson }: { lesson: Lesson }) {
  return (
    <section id="self-checks">
      <span className="eyebrow">RECALL & EXPLAIN</span>
      <h2>답을 가리고 자가 점검</h2>
      <p>자신의 말로 답한 뒤 정답과 이유를 펼쳐 비교하세요. 이해가 어려운 항목은 위 설명과 풀이를 다시 읽고 사례형 CBT로 확인합니다.</p>
      {lesson.selfChecks.map((item, i) => (
        <div key={item.question} className="self-check-item">
          <h3>{i + 1}. {item.question}</h3>
          <details>
            <summary>정답과 이유 보기 · {i + 1}번</summary>
            <p className="answer-line">{item.answer}</p>
            <p>{item.explanation}</p>
          </details>
        </div>
      ))}
    </section>
  );
}

export function LessonSummary({ lesson }: { lesson: Lesson }) {
  return (
    <section id="summary" className="lesson-summary">
      <h2>이 강의에서 설명할 수 있어야 하는 것</h2>
      <ul>{lesson.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>
      <p>정의를 말하고, 작은 예제에 적용하고, 결과의 한계를 설명할 수 있으면 다음 강의로 이어가세요.</p>
    </section>
  );
}
