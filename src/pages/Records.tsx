import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Download, LogOut, Upload } from "lucide-react";
import { Heading } from "../components/UI";
import { useStudy } from "../context";
import {
  exportBackup,
  guestSession,
  importBackup,
  login,
  localAuthIssue,
  migrateGuest,
  register,
  validateBackup,
} from "../storage";
export function Auth() {
  const view = new URLSearchParams(useLocation().search).get("view");
  const { session, profile, switchSession, run, setError, setNotice } =
    useStudy();
  const [mode, setMode] = useState<"login" | "register">(view === "register" ? "register" : "login"),
    [loginId, setLoginId] = useState(""),
    [name, setName] = useState(""),
    [password, setPassword] = useState(""),
    [migrate, setMigrate] = useState(false),
    [working, setWorking] = useState(false),
    [policy, setPolicy] = useState<"merge" | "replace">("merge"),
    [backup, setBackup] = useState<string | null>(null);
  const authIssue = localAuthIssue();
  useEffect(() => {
    if (view === "register") setMode("register");
    else if (!view) setMode("login");
  }, [view]);
  const authenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorking(true);
    setError("");
    const input = password;
    setPassword("");
    try {
      const s =
        mode === "register"
          ? await register(loginId, name, input)
          : await login(loginId, input);
      if (migrate) await migrateGuest(s.userId);
      await switchSession(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([exportBackup(profile)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-learning-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice("현재 사용자의 학습 백업을 내보냈습니다.");
  };
  const choose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    try {
      if (f.size > 10_000_000) throw new Error("백업은 10MB 이하여야 합니다.");
      const t = await f.text();
      validateBackup(t);
      setBackup(t);
      setNotice("백업 구조를 확인했습니다. 적용 버튼으로 복원하세요.");
    } catch (e) {
      setBackup(null);
      setError((e as Error).message);
    }
    e.target.value = "";
  };
  const restore = async () => {
    if (!backup) return;
    const result = await run(importBackup(session.userId, backup, policy));
    if (result) setBackup(null);
  };
  return (
    <>
      <Heading
        eyebrow="LOCAL PROFILE"
        title={
          view === "backup" ? "학습 기록 백업·복원" : session.guest
            ? "나의 학습 공간을 만들어요."
            : `${session.displayName}의 로컬 계정`
        }
        description="계정은 현재 브라우저에서 학습 기록을 나누는 개인 프로필입니다. 다른 기기와 자동 동기화되지 않습니다."
      />
      <div className="account-layout account-single">
        {view !== "backup" && <section className="panel account-card">
          <h2>{session.guest ? "로그인 / 회원가입" : "계정 전환"}</h2>
          <p>
            현재 사용자: <b>{session.displayName}</b>
          </p>
          {authIssue && <div className="notice" role="note">
            <p>{authIssue}</p>
            {window.location.protocol === "http:" && <a className="button" href={window.location.href.replace(/^http:/, "https:")}>HTTPS로 열기</a>}
          </div>}
          <div className="segmented">
            <button
              aria-pressed={mode === "login"}
              onClick={() => setMode("login")}
            >
              로그인
            </button>
            <button
              aria-pressed={mode === "register"}
              onClick={() => setMode("register")}
            >
              회원가입
            </button>
          </div>
          <form onSubmit={(e) => void authenticate(e)}>
            <label>
              아이디
              <input
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                aria-describedby="login-id-hint"
                disabled={!!authIssue}
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="영문·숫자·_·- 3~32자"
              />
            </label>
            <p className="muted" id="login-id-hint">아이디는 영문·숫자·_·- 3~32자입니다. 이메일 주소는 사용할 수 없습니다.</p>
            {mode === "register" && (
              <label>
                표시 이름
                <input
                  autoComplete="nickname"
                  disabled={!!authIssue}
                  required
                  maxLength={30}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="학습 화면에 보일 이름"
                />
              </label>
            )}
            <label>
              비밀번호
              <input
                type="password"
                disabled={!!authIssue}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                required
                minLength={mode === "register" ? 8 : 1}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "8자 이상" : "비밀번호"}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={migrate}
                onChange={(e) => setMigrate(e.target.checked)}
              />
              게스트 학습 기록을 이 계정에 합치기
            </label>
            <button className="primary" disabled={working || !!authIssue} type="submit">
              {working
                ? "확인 중…"
                : mode === "register"
                  ? "로컬 계정 만들기"
                  : "로그인"}
              <ArrowRight size={16} />
            </button>
          </form>
          <div className="actions">
            {session.guest ? (
              <Link className="button" to="/">
                게스트로 계속 학습
              </Link>
            ) : (
              <button
                onClick={() =>
                  void switchSession(guestSession()).catch((e) =>
                    setError(e.message),
                  )
                }
              >
                <LogOut size={16} />
                로그아웃
              </button>
            )}
            <Link className="button" to="/records">
              내 기록
            </Link>
          </div>
          <p className="muted">
            비밀번호 원문을 저장하지 않습니다. 이 로컬 기능은 서버 인증이나
            기록의 암호화 격리가 아닙니다.
          </p>
        </section>}
        {view === "backup" && <section className="panel backup-card">
          <h2>학습 기록 백업</h2>
          <p>
            현재 사용자 <b>{session.displayName}</b>의
            응시·오답·진도·북마크·초안·설정만 JSON으로 내보냅니다. 계정 목록,
            비밀번호와 검증값은 포함하지 않습니다.
          </p>
          <button onClick={download}>
            <Download size={16} />내 기록 내보내기
          </button>
          <hr />
          <label>
            복원 정책
            <select
              value={policy}
              onChange={(e) => setPolicy(e.target.value as "merge" | "replace")}
            >
              <option value="merge">합치기 · ID가 같으면 최신 항목</option>
              <option value="replace">덮어쓰기 · 현재 학습 기록 교체</option>
            </select>
          </label>
          <label className="file-input">
            <Upload size={18} />
            백업 파일 선택
            <input
              type="file"
              accept="application/json,.json"
              aria-label="백업 파일 선택"
              onChange={(e) => void choose(e)}
            />
          </label>
          {backup && (
            <div className="notice">
              <p>
                구조·버전·콘텐츠 참조 검사를 통과했습니다. 응시 {validateBackup(backup).attempts.length}개 · 진도 {validateBackup(backup).progress.length}개 · 북마크 {validateBackup(backup).bookmarks.length}개 · 교재 복습 {validateBackup(backup).textbookChecks.length}장. 파일 속 사용자 ID에 관계없이{" "}
                <b>{session.displayName}</b>에게만 적용됩니다.
              </p>
              <button className="primary" onClick={() => void restore()}>
                {policy === "merge"
                  ? "현재 사용자에 합치기"
                  : "현재 학습 기록 덮어쓰기"}
              </button>
              <button onClick={() => setBackup(null)}>취소</button>
            </div>
          )}
          <p className="muted">
            합치기는 응시 ID·문제 ID·북마크 키로 중복을 막고 최신 항목을
            유지합니다. 현재 초안이 있으면 가져온 초안보다 우선합니다.
            덮어쓰기는 현재 학습 기록 전체를 바꾸므로 먼저 내보내기 하세요.
          </p>
          <div className="notice">
            브라우저 저장소를 삭제하면 계정과 학습 기록이 사라질 수 있습니다.
            로컬 주소와 배포 주소는 서로 다른 저장소입니다. 같은 주소·포트를
            계속 사용하세요.
          </div>
        </section>}
      </div>
    </>
  );
}
export { Records, WrongNotes } from "./RecordViews";
