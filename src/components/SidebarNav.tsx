import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, ChartNoAxesCombined, Check, ChevronDown, CircleUserRound, ClipboardList, FlaskConical, House, Layers, Target, Timer } from "lucide-react";
import { blueprints, cases, lessons, topics } from "../content";
import { useStudy } from "../context";

type Item = { label: string; to: string; completed?: boolean };
function current(to: string, path: string, search: string) {
  const [target, query = ""] = to.split("?");
  if (target !== path) return false;
  const actual = new URLSearchParams(search), expected = new URLSearchParams(query);
  return [...actual].every(([k, v]) => expected.get(k) === v) && [...expected].every(([k, v]) => actual.get(k) === v);
}

export function SidebarNav() {
  const location = useLocation();
  const { profile } = useStudy();
  const groups = [
    { id: "home", label: "홈", path: "/", Icon: House, items: [{label: "학습 대시보드", to: "/"}, {label: "학습 순서·시험 범위", to: "/guide"}, {label: "교재 연습문제 복습", to: "/textbook"}, {label: "자료·슬라이드 출처", to: "/sources"}] },
    { id: "lessons", label: "강의실", path: "/lessons", Icon: BookOpen, items: [{label: "전체 강의", to: "/lessons"}] },
    { id: "reading", label: "사례 자료", path: "/reading", Icon: ChartNoAxesCombined, items: [{label: "전체 자료", to: "/reading"}, {label: "표 중심 자료", to: "/reading?kind=table"}, {label: "흐름·메시지 자료", to: "/reading?kind=flow"}, {label: "코드 자료", to: "/reading?kind=code"}, ...cases.map((c) => ({label: `${c.id} · ${c.title}`, to: `/reading?case=${c.id}`}))] },
    { id: "cbt", label: "사례형 CBT", path: "/cbt", Icon: FlaskConical, items: [{label: "종합 연습 전체 회차", to: "/cbt"}, ...blueprints.map((b) => ({label: b.title, to: `/cbt/${b.id}`}))] },
    { id: "mock", label: "모의고사", path: "/mock", Icon: Timer, items: [{label: "종합모의고사 전체 회차", to: "/mock"}, ...blueprints.map((b) => ({label: b.title, to: `/mock/${b.id}`}))] },
    { id: "wrong", label: "오답노트", path: "/wrong", Icon: ClipboardList, items: [{label: "복습할 오답", to: "/wrong"}, {label: "모든 오답", to: "/wrong?view=all"}, {label: "해결한 오답", to: "/wrong?view=resolved"}, {label: "반복해서 틀린 문제", to: "/wrong?view=repeat"}, {label: "오답 다시 풀기", to: "/practice?wrong=1"}] },
    { id: "records", label: "학습기록", path: "/records", Icon: Layers, items: [{label: "기록 개요", to: "/records"}, {label: "강의별 진도", to: "/records?view=progress"}, {label: "응시 이력·점수", to: "/records?view=attempts"}, {label: "취약점 분석", to: "/records?view=weakness"}, {label: "내 북마크", to: "/records?view=bookmarks"}] },
    { id: "review", label: "시험 직전 정리", path: "/review", Icon: Target, items: [{label: "전체 핵심 정리", to: "/review"}, ...topics.map((t) => ({label: t.title, to: `/review?topic=${t.id}`})), {label: "자료 해석 체크리스트", to: "/review?view=checklist"}] },
    { id: "account", label: "계정·백업", path: "/account", Icon: CircleUserRound, items: [{label: "로컬 로그인·프로필", to: "/account"}, {label: "로컬 회원가입", to: "/account?view=register"}, {label: "학습 기록 백업·복원", to: "/account?view=backup"}] },
  ];
  const active = ["/guide", "/textbook", "/sources"].includes(location.pathname) ? "home"
    : location.pathname === "/quiz" ? (profile.draft?.mode === "exam" ? "mock" : "cbt")
    : location.pathname.startsWith("/results") ? "records"
    : location.pathname === "/practice" ? (location.search.includes("wrong=1") ? "wrong" : "records")
    : groups.find((g) => g.path !== "/" && location.pathname.startsWith(g.path))?.id ?? "home";
  const [open, setOpen] = useState<Record<string, boolean>>({[active]: true});
  useEffect(() => { setOpen((p) => ({...p, [active]: true})); }, [active, location.pathname, location.search]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const child = document.querySelector('.sidebar-nav a[aria-current="page"]');
      const group = child?.closest('.nav-group');
      const parent = group?.querySelector('.nav-parent');
      const target = parent?.getAttribute('href') === child?.getAttribute('href')
        ? group?.querySelector('.nav-heading') : child;
      target?.scrollIntoView({block: "nearest"});
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.search]);
  const renderItem = (item: Item) => <Link key={item.to} to={item.to} className={`nav-child ${current(item.to, location.pathname, location.search) ? "active" : ""}`} aria-current={current(item.to, location.pathname, location.search) ? "page" : undefined}>
    <span>{item.label}</span>{item.completed && <Check size={13} aria-label="읽기 완료" />}
  </Link>;
  return <nav className="sidebar-nav" aria-label="주요 메뉴">
    {groups.map(({id, label, path, Icon, items}) => <div className={`nav-group ${active === id ? "current-group" : ""}`} key={id}>
      <div className="nav-heading">
        <Link className={`nav-parent ${active === id ? "active" : ""}`} to={path} onClick={() => setOpen((p) => ({...p, [id]: true}))}><Icon size={19} /><span>{label}</span>{id === "wrong" && profile.wrongNotes.some((w) => !w.resolved) && <span className="nav-count">{profile.wrongNotes.filter((w) => !w.resolved).length}</span>}</Link>
        <button className="nav-toggle" aria-label={`${label} 세부 페이지 ${open[id] ? "접기" : "펼치기"}`} aria-expanded={!!open[id]} aria-controls={`nav-${id}`} onClick={() => setOpen((p) => ({...p, [id]: !p[id]}))}><ChevronDown size={17} /></button>
      </div>
      <div className="nav-children" id={`nav-${id}`} hidden={!open[id]}>
        {items.map(renderItem)}
        {id === "lessons" && topics.map((t) => renderItem({label: t.title, to: `/lessons/chapter/${t.id}`, completed: lessons.filter(l=>l.topic===t.id).every(l=>profile.progress.some(p=>p.lessonId===l.id&&p.completed))}))}
      </div>
    </div>)}
  </nav>;
}
