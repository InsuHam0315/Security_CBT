import { Context } from "./study-context";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Profile, Session } from "./types";
import {
  changed,
  emptyProfile,
  getProfile,
  guestSession,
  readSession,
  saveSession,
} from "./storage";
export function StudyProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(guestSession()),
    [profile, setProfile] = useState(emptyProfile("guest")),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [pending, setPending] = useState(0);
  const owner = useRef("guest"),
    loadCounter = useRef(0);
  const reload = useCallback(async () => {
    const id = owner.current,
      seq = ++loadCounter.current;
    try {
      const p = await getProfile(id);
      if (owner.current === id && seq === loadCounter.current) setProfile(p);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    let alive = true;
    readSession()
      .then(async (s) => {
        const p = await getProfile(s.userId);
        if (!alive) return;
        owner.current = s.userId;
        setSession(s);
        setProfile(p);
        setReady(true);
      })
      .catch((e) => {
        setError((e as Error).message);
        setReady(true);
      });
    const listener = (e: Event) => {
      if ((e as CustomEvent).detail === owner.current) void reload();
    };
    changed.addEventListener("profile", listener);
    return () => {
      alive = false;
      changed.removeEventListener("profile", listener);
    };
  }, [reload]);
  const switchSession = async (s: Session) => {
    const p = await getProfile(s.userId);
    saveSession(s);
    owner.current = s.userId;
    loadCounter.current++;
    setSession(s);
    setProfile(p);
    setError("");
    setNotice(`${s.displayName}의 학습 기록을 불러왔습니다.`);
  };
  const run = async (operation: Promise<Profile>) => {
    const id = owner.current;
    setPending((x) => x + 1);
    setError("");
    try {
      const p = await operation;
      if (id === owner.current && p.userId === id) {
        setProfile(p);
        setNotice("브라우저에 저장했습니다.");
        return p;
      }
      return undefined;
    } catch (e) {
      if (id === owner.current)
        setError(
          (e as Error).message || "저장 실패: 기록이 저장되지 않았습니다.",
        );
      return undefined;
    } finally {
      setPending((x) => Math.max(0, x - 1));
    }
  };
  useEffect(() => {
    document.documentElement.dataset.theme = profile.settings.theme;
  }, [profile.settings.theme]);
  return (
    <Context.Provider
      value={{
        session,
        profile,
        ready,
        error,
        notice,
        busy: pending > 0,
        setError,
        setNotice,
        switchSession,
        run,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStudy() {
  const value = useContext(Context);
  if (!value) throw new Error("StudyProvider가 필요합니다.");
  return value;
}
