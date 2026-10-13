import { createContext } from "react";
import type { Profile, Session } from "./types";
export type StudyContext = {
  session: Session;
  profile: Profile;
  ready: boolean;
  error: string;
  notice: string;
  busy: boolean;
  setError: (v: string) => void;
  setNotice: (v: string) => void;
  switchSession: (s: Session) => Promise<void>;
  run: (operation: Promise<Profile>) => Promise<Profile | undefined>;
};
// Provider/consumer의 hot reload 사이에도 Context 객체의 정체성을 유지한다.
export const Context = createContext<StudyContext | null>(null);
