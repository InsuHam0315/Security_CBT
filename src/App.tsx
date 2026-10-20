import { Heading, BookmarkButton } from "./components/UI";
import { useEffect, useState } from "react";
import {
  HashRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  ChartNoAxesCombined,
  Check,
  CircleUserRound,
  ClipboardList,
  Database,
  FlaskConical,
  GraduationCap,
  House,
  Layers,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  ShieldCheck,
  Target,
  Timer,
  TriangleAlert,
  X,
} from "lucide-react";
import { StudyProvider, useStudy } from "./context";
import {
  cases,
  caseMap,
  lessons,
  lessonMap,
  questions,
  topics,
} from "./content";
import {
  guestSession,
  readLesson,
  toggleBookmark,
  updateProfile,
} from "./storage";
import { topicStats } from "./engine";
import { Code, Materials, Sources } from "./components/Materials";
import { Classroom } from "./pages/Classroom";
import { Auth, Records, WrongNotes } from "./pages/Records";
import { Quiz, Results } from "./pages/Quiz";
import { QuizStart, FocusPracticeStart } from "./pages/QuizStart";
import { SidebarNav } from "./components/SidebarNav";
import { Guide } from "./pages/Guide";
import { Textbook, SourceGuide } from "./pages/Textbook";
import { PastExams } from './pages/PastExams';
import { pastQuestions } from './content/past';
import "./style.css";
function Shell() {
  const {
    session,
    profile,
    ready,
    error,
    notice,
    busy,
    run,
    switchSession,
    setError,
  } = useStudy();
  const [mobile, setMobile] = useState(false);
  const [sidebarClosed,setSidebarClosed] = useState(()=>{
    try { return localStorage.getItem('computer-security-cbt:sidebar-closed') === 'true'; }
    catch { return false; }
  });
  function closeSidebar() {
    if (matchMedia('(max-width: 760px)').matches) { setMobile(false); return; }
    setSidebarClosed(true);
    requestAnimationFrame(()=>document.getElementById('sidebar-reopen')?.focus());
  }
  useEffect(()=>{
    try { localStorage.setItem('computer-security-cbt:sidebar-closed',String(sidebarClosed)); }
    catch { /* Navigation still works when browser storage is unavailable. */ }
  },[sidebarClosed]);
  const location = useLocation();
  useEffect(() => {
    setMobile(false);
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  useEffect(() => {
    if (!mobile) return;
    const previous=document.activeElement as HTMLElement|null;
    const aside=document.querySelector<HTMLElement>('.sidebar');
    aside?.querySelector<HTMLElement>('a')?.focus();
    const close=(event:KeyboardEvent)=>{
      if(event.key==='Escape')setMobile(false);
      if(event.key==='Tab'){
        const items=[...aside!.querySelectorAll<HTMLElement>('a,button')].filter(el=>el.getClientRects().length>0);
        if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus();}
        else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0]?.focus();}
      }
    };
    window.addEventListener('keydown',close);
    return ()=>{window.removeEventListener('keydown',close);previous?.focus();};
  }, [mobile]);
  const completed = topics.filter(t=>lessons.filter(l=>l.topic===t.id).every(l=>profile.progress.some(p=>p.lessonId===l.id&&p.completed))).length;
  if (!ready)
    return (
      <div className="loading">
        <Database />
        <p>학습 기록을 불러오는 중…</p>
      </div>
    );
  return (
    <div className={`app-shell ${sidebarClosed ? 'sidebar-closed' : ''}`}>
      <a className="skip" href="#main">
        본문으로 건너뛰기
      </a>
      {mobile && <button className="sidebar-backdrop" aria-label="메뉴 닫기" onClick={() => setMobile(false)} />}
      <aside id="study-sidebar" className={`sidebar glass ${mobile ? "open" : ""}`} inert={sidebarClosed && !mobile}>
        <div className="sidebar-brand-row">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <ShieldCheck size={22} />
          </span>
          <span>
            컴퓨터보안 학습실<small>SECURITY STUDY LAB</small>
          </span>
        </Link>
        <button className="sidebar-collapse icon-btn" title="왼쪽 메뉴 접기" aria-label="왼쪽 메뉴 접기" aria-expanded={mobile||!sidebarClosed} aria-controls="study-sidebar" onClick={closeSidebar}><PanelLeftClose size={19}/></button>
        </div>
        <p className="sidebar-label">LEARN · READ · PRACTICE</p>
        <SidebarNav />
        <div className="sidebar-bottom">
          <div className="mini-progress">
            <span>강의 진행</span>
            <b>
              {completed} / 4장
            </b>
          </div>
          <progress max={4} value={completed} />
          <p>증거를 읽고, 조건으로 답하기.</p>
          <Link to="/account">
            <CircleUserRound size={17} />
            {session.displayName} · 로컬 프로필
          </Link>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar glass">
          <div className="topbar-left">
            {sidebarClosed && <button id="sidebar-reopen" className="desktop-menu icon-btn" title="왼쪽 메뉴 펼치기" aria-label="왼쪽 메뉴 펼치기" aria-expanded={false} aria-controls="study-sidebar" onClick={()=>{setSidebarClosed(false);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('.sidebar-collapse')?.focus());}}><PanelLeftOpen size={21}/></button>}
            <button
              className="mobile-menu icon-btn"
              aria-label="메뉴 열기"
              aria-expanded={mobile}
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X /> : <Menu />}
            </button>
            <span className="crumb">
              SECURITY <span>/</span> 시험 대비 학습
            </span>
          </div>
          <div className="topbar-actions">
            <span className="save-state" role="status">
              {busy
                ? "저장 중…"
                : notice
                  ? "저장 상태 확인됨"
                  : "브라우저 로컬 기록"}
            </span>
            <button
              className="icon-btn"
              aria-label="테마 전환"
              onClick={() =>
                void run(
                  updateProfile(session.userId, (p) => {
                    p.settings.theme =
                      p.settings.theme === "dark" ? "light" : "dark";
                  }),
                )
              }
            >
              {profile.settings.theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>
            <Link className="user-chip" to="/account">
              <span className="avatar">{session.displayName[0]}</span>
              {session.displayName}
              <small>{session.guest ? "게스트" : "로컬"}</small>
            </Link>
            {!session.guest && (
              <button
                className="icon-btn"
                aria-label="로그아웃"
                onClick={() =>
                  void switchSession(guestSession()).catch((e) =>
                    setError(e.message),
                  )
                }
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {error && (
            <div className="error-banner" role="alert">
              <TriangleAlert size={18} />
              {error}
              <button aria-label="오류 닫기" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          <div className="sr-only" role="status" aria-live="polite">
            {notice}
          </div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/textbook" element={<Textbook />} />
            <Route path="/sources" element={<SourceGuide />} />
            <Route path="/past-exams/:paperId?" element={<PastExams key={location.pathname+location.search+session.userId}/>} />
            <Route path="/lessons/*" element={<Classroom />} />
            <Route
              path="/reading"
              element={<Reading key={location.search} />}
            />
            <Route
              path="/cbt/:roundId?"
              element={
                <QuizStart key={"cbt" + session.userId + location.pathname + location.search} />
              }
            />
            <Route
              path="/mock/:roundId?"
              element={<QuizStart key={"mock" + session.userId + location.pathname} mock />}
            />
            <Route path="/practice" element={<FocusPracticeStart key={session.userId + location.search} />} />
            <Route path="/quiz" element={<Quiz key={session.userId} />} />
            <Route
              path="/results/:id"
              element={<Results key={session.userId} />}
            />
            <Route path="/wrong" element={<WrongNotes key={session.userId + location.search} />} />
            <Route path="/records" element={<Records />} />
            <Route path="/review" element={<Review />} />
            <Route path="/account" element={<Auth key={session.userId + location.search} />} />
            <Route
              path="*"
              element={
                <div className="empty">
                  <h1>페이지를 찾을 수 없습니다.</h1>
                  <Link to="/">홈으로</Link>
                </div>
              }
            />
          </Routes>
        </main>
        <footer>
          PPT 기반 예상문제 · 별도 족보 문제집은 출처·수정 여부 표시{" "}
          <span>강의 슬라이드·족보 원본은 공개 저장소에 포함하지 않습니다</span>
        </footer>
      </div>
    </div>
  );
}
function Home() {
  const { session, profile } = useStudy();
  const complete = topics.filter(t=>lessons.filter(l=>l.topic===t.id).every(l=>profile.progress.some(p=>p.lessonId===l.id&&p.completed))).length,
    wrong = profile.wrongNotes.filter((w) => !w.resolved),
    recent = profile.attempts.at(-1);
  const stats = topicStats(profile.attempts);
  const next =
    profile.lastLessonId ??
    lessons.find(
      (l) => !profile.progress.some((p) => p.lessonId === l.id && p.completed),
    )?.id ??
    lessons[0].id;
  return (
    <>
      <div className="welcome">
        <span className="eyebrow">YOUR STUDY SPACE</span>
        <p>{session.displayName}님, 오늘도 한 개의 근거부터.</p>
        <span className="tag">사용자 확인 범위: 1~4장</span>
      </div>
      <section className="hero glass">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="live-dot" /> 정보 보안 개론 · 1~4장</div>
          <h1>어디에서 신뢰하고,<br /><em>무엇을 검증할까요?</em></h1>
          <p>개념을 이해하고 권한·로그·통신 흐름에서 근거를 찾으세요.<br />교재 연습문제 복습과 종합 사례 풀이를 연결합니다.</p>
          <div className="actions"><Link className="button primary" to={`/lessons/${next}`}>이어서 학습<ArrowRight size={17} /></Link><Link className="button" to="/textbook">교재 연습문제 복습</Link></div>
          <div className="hero-facts"><span>4장 · 장별 한 페이지</span><span>{cases.length}사례</span><span>{questions.length}고유 문항</span></div>
        </div>
        <div className="hero-visual security-visual">
          <span className="eyebrow">TRUST BOUNDARY</span><h2>로그인 성공 ≠ 접근 허용</h2>
          <div className="trust-node">01 · 인증 <b>누구인가?</b></div><span aria-hidden="true">↓</span>
          <div className="trust-node">02 · 인가 <b>이 자료를 볼 수 있는가?</b></div><span aria-hidden="true">↓</span>
          <div className="trust-node">03 · 기록 <b>누가 무엇을 했는가?</b></div>
          <Link className="visual-link" to="/reading?case=SC28">문서 ID 사례로 확인<ArrowRight size={16}/></Link>
        </div>
      </section>
      {session.guest && (
        <div className="guest-note">
          <CircleUserRound size={18} />
          <p>
            게스트로 바로 학습할 수 있어요. 로컬 계정은 같은 브라우저에서
            사용자별 기록을 나눠 보관합니다.
          </p>
          <Link to="/account">
            로그인 / 가입
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <section className="stat-grid">
        {[
          [
            "읽은 강의",
            `${complete} / 4장`,
            "이해의 출발점",
            BookOpen,
          ],
          [
            "최근 점수",
            recent?.score === null
              ? "자기 평가 대기"
              : recent
                ? `${recent.score}점`
                : "기록 없음",
            "저장된 최근 응시",
            ChartNoAxesCombined,
          ],
          [
            "응시 기록",
            `${profile.attempts.length}회`,
            "연습과 모의고사",
            Timer,
          ],
          [
            "복습할 오답",
            `${wrong.length}문항`,
            "해결 표시 전 항목",
            ClipboardList,
          ],
        ].map(([label, value, sub, Icon]) => {
          const I = Icon as typeof BookOpen;
          return (
            <div className="stat-card glass" key={String(label)}>
              <I size={19} />
              <span>{String(label)}</span>
              <strong>{String(value)}</strong>
              <small>{String(sub)}</small>
            </div>
          );
        })}
      </section>
      <section className="panel past-home"><span className="eyebrow">REVIEWED PAST PAPERS</span><h2>족보 문제집 · {pastQuestions.length}개 고유 문제</h2><p>기출 복원과 교재 정리 기반 재구성을 구분하고, 잘못 적힌 답·불완전한 조건을 검토했습니다. 암호·보안 솔루션 등 1~4장 밖의 기말 내용도 포함합니다.</p><div className="actions"><Link className="button primary" to="/past-exams">족보 문제집 열기<ArrowRight size={16}/></Link><Link className="button" to="/past-exams?view=review">검토·수정 기록</Link></div></section>
      <section className="learning-flow">
        <div className="section-title">
          <h2>이렇게 공부해 보세요</h2>
          <span>강의 → 자료 읽기 → 풀이 → 복습</span>
        </div>
        <div className="flow-grid">
          {[
            [
              "01",
              "개념을 이해하기",
              "쉽게 풀어 쓴 설명과 줄별 코드 해설",
              "/lessons",
            ],
            [
              "02",
              "자료에서 근거 찾기",
              "메시지·권한·검증 조건을 읽는 실습",
              "/reading",
            ],
            [
              "03",
              "사례로 연결하기",
              "전 범위를 섞은 회차별 종합 문제",
              "/cbt",
            ],
            [
              "04",
              "틀린 이유 돌아보기",
              "연결 강의로 돌아가 오해 바로잡기",
              "/wrong",
            ],
          ].map(([n, t, d, path]) => (
            <Link className="flow-card" key={n} to={path}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </section>
      <div className="home-bottom">
        <section>
          <div className="section-title">
            <h2>시험 범위, 한눈에</h2>
            <Link to="/lessons">
              전체 강의
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="topic-grid">
            {topics.map((t) => {
              const ls = lessons.filter((l) => l.topic === t.id),
                done = ls.filter((l) =>
                  profile.progress.some(
                    (p) => p.lessonId === l.id && p.completed,
                  ),
                ).length;
              return (
                <Link
                  key={t.id}
                  className="topic-card panel"
                  to={`/lessons/chapter/${t.id}`}
                >
                  <span className="topic-letter">{t.id}</span>
                  <div>
                    <h3>{t.title}</h3>
                    <p>{t.subtitle}</p>
                    <progress value={done} max={ls.length} />
                    <small>
                      {done}/{ls.length} 단원 ·{" "}
                      {stats[t.id]
                        ? `${Math.round((stats[t.id].correct / stats[t.id].total) * 100)}% 정답률`
                        : "아직 응시하지 않음"}
                    </small>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        <aside className="today panel">
          <div className="section-title">
            <h2>오늘의 학습</h2>
            <GraduationCap size={22} />
          </div>
          {profile.draft && (
            <Link className="today-row" to="/quiz">
              <Timer size={18} />
              <div>
                <strong>진행 중 풀이</strong>
                <p>
                  {profile.draft.title} ·{" "}
                  {Object.keys(profile.draft.answers).length}/
                  {profile.draft.questionIds.length} 응답
                </p>
              </div>
              <ArrowRight size={16} />
            </Link>
          )}
          <Link className="today-row" to={`/lessons/${next}`}>
            <BookOpen size={18} />
            <div>
              <strong>{lessonMap[next].title}</strong>
              <p>이어서 읽을 강의</p>
            </div>
            <ArrowRight size={16} />
          </Link>
          {wrong.length ? (
            <Link className="today-row" to="/wrong">
              <ClipboardList size={18} />
              <div>
                <strong>복습할 오답 {wrong.length}개</strong>
                <p>신뢰 경계·권한·검증 조건을 확인하세요</p>
              </div>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <p className="empty small">
              아직 오답이 없습니다.
              <br />
              사례형 CBT로 첫 기록을 만들어 보세요.
            </p>
          )}
          <div className="notice">
            종합모의고사 1~5회차 · 회차별 50문항. 시험 시간은 기본 75분에서 조절할 수 있습니다.
          </div>
        </aside>
      </div>
    </>
  );
}
function Reading() {
  const location = useLocation(), navigate = useNavigate();
  const initial = new URLSearchParams(location.search).get("case");
  const [step, setStep] = useState(0);
  const kind = new URLSearchParams(location.search).get("kind") ?? "";
  const cid = initial ?? "";
  const data = caseMap[cid];
  if (!initial) {
    const visible = cases.filter((c) => kind === "flow" ? c.kind === "flow" : kind === "code" ? c.kind === "code" : kind === "table" ? c.kind === "table" : true);
    return <>
      <Heading eyebrow="DATA READING LAB" title={kind === "flow" ? "흐름 자료 읽기" : kind === "code" ? "코드 자료 읽기" : kind === "table" ? "표 중심 자료 읽기" : "자료를 읽고, 근거를 찾기."} description="수업 범위에 맞춘 가상 자료입니다. 각 자료에서 주체·단위·규칙·메시지 순서와 해석의 한계를 확인하세요." />
      <div className="actions catalogue-tabs">{[["", "전체 자료"], ["table", "표 중심"], ["flow", "흐름·메시지"], ["code", "코드"]].map(([k, label]) => <Link key={k} className={`button ${kind === k ? "primary" : ""}`} to={k ? `/reading?kind=${k}` : "/reading"} aria-current={kind === k ? "page" : undefined}>{label}</Link>)}</div>
      <p className="muted">{visible.length}개 자료</p>
      <div className="case-grid">{visible.map((c) => <article key={c.id} className="panel case-card"><div className="tags"><span className="tag">{c.id}</span><span className="tag">{c.kind === "flow" ? "흐름" : "표"}{c.kind === "code" ? " · 코드" : ""}</span></div><h2>{c.title}</h2><p>{c.scenario}</p><Link className="button" to={`/reading?case=${c.id}`}>자료 읽기<ArrowRight size={15} /></Link></article>)}</div>
    </>;
  }
  if (!data) return <div className="empty panel"><h1>자료를 찾을 수 없습니다.</h1><Link to="/reading">전체 자료 보기</Link></div>;
  return (
    <>
      <Heading
        eyebrow="DATA READING LAB"
        title="증거가 말하는 범위까지."
        description="규칙과 메시지를 따라가며 검증 조건과 해석의 한계를 확인하세요."
      />
      <Link className="back-link" to="/reading">← 전체 자료</Link>
      <div className="reading-select">
        <label>
          사례 선택
          <select
            value={cid}
            onChange={(e) => {
              navigate(`/reading?case=${e.target.value}`);
              setStep(0);
            }}
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} · {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="reading-layout">
        <Materials key={cid} data={data} interactive />
        <aside className="reading-guide panel">
          <span className="eyebrow">READ IN FIVE STEPS</span>
          <h2>어떤 순서로 읽을까요?</h2>
          {[
            "상황·관찰 대상",
            "열·입력·출력",
            "가정·검증 조건",
            "작동 과정",
            "해석의 한계",
          ].map((t, i) => (
            <button
              key={t}
              className={step === i ? "selected" : ""}
              onClick={() => setStep(i)}
            >
              <span>{i + 1}</span>
              {t}
            </button>
          ))}
          <p className="guide-text">{data.guide[step]}</p>
          <Link className="button primary" to={`/practice?case=${cid}`}>
            이 자료 확인 문제
            <ArrowRight size={15} />
          </Link>
          <Link className="button" to={`/lessons/${data.lessonId}`}>
            연결 강의
          </Link>
          <Sources refs={data.sources} supplements={data.supplements} />
        </aside>
      </div>
    </>
  );
}
function Review() {
  const params = new URLSearchParams(useLocation().search);
  const selectedTopic = params.get("topic"), checklist = params.get("view") === "checklist";
  const visible = topics.filter((t) => !selectedTopic || t.id === selectedTopic);
  return (
    <>
      <Heading
        eyebrow="LAST-MINUTE REVIEW"
        title={checklist ? "자료 해석 체크리스트" : selectedTopic ? `${visible[0]?.title ?? "선택 범위"} · 시험 직전 정리` : "시험 직전, 기준을 다시 확인."}
        description="용어보다 비교 기준을 기억하세요. 각 정리에서 대표 문제로 바로 연결됩니다."
      />
      {!checklist && <div className="review-grid">
        {visible.map((t) => (
          <section className="panel review-card" key={t.id}>
            <span className="topic-letter">{t.id}</span>
            <h2>{t.title}</h2>
            {lessons
              .filter((l) => l.topic === t.id)
              .map((l) => (
                <details key={l.id}>
                  <summary>{l.title}</summary>
                  <div className="table-scroll">
                    <table>
                      <tbody>
                        {l.terms.map((r, i) => (
                          <tr key={i}>
                            {r.map((v, j) => (
                              <td key={j}>{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Code code={l.code} />
                  <ul>
                    {l.mistakes.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  <div className="actions">
                    <Link className="button" to={`/lessons/${l.id}`}>
                      강의
                    </Link>
                    <Link
                      className="button primary"
                      to={`/practice?case=${l.caseIds[0]}`}
                    >
                      대표 문제
                    </Link>
                  </div>
                </details>
              ))}
          </section>
        ))}
      </div>}
      <section className="panel">
        <h2>마지막 5단계</h2>
        <ol>
          <li>대상: 보호하는 자산과 요청하는 주체는 누구인가?</li>
          <li>경계: 어떤 입력·신원·응답을 신뢰하고 있는가?</li>
          <li>조건: 규칙 순서·권한·단위·상태가 명시되었는가?</li>
          <li>대응: 원인에 맞는 검사이며 처리 전에 실행되는가?</li>
          <li>한계: 단일 로그·코드만으로 공격 성공·신원을 확정하지 않았는가?</li>
        </ol>
      </section>
    </>
  );
}
export default function App() {
  return (
    <HashRouter>
      <StudyProvider>
        <Shell />
      </StudyProvider>
    </HashRouter>
  );
}
