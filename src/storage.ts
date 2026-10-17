import { z } from "zod";
import type {
  Attempt,
  Bookmark,
  ExamDraft,
  LessonProgress,
  LocalUser,
  Profile,
  Session,
  TopicId,
  WrongNote,
} from "./types";
import { grade, scoreDraft } from "./engine";
import { lessons, lessonMap, questionMap } from "./content";

export const DB_NAME = "computer-security-cbt:v1";
export const SESSION_KEY = "computer-security-cbt:tab-session:v1";
const GUEST_ID = "guest";
let dbPromise: Promise<IDBDatabase> | undefined;
export const changed = new EventTarget();
const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("computer-security-cbt:changes")
    : null;
channel?.addEventListener("message", (e) =>
  changed.dispatchEvent(new CustomEvent("profile", { detail: e.data })),
);
const announce = (userId: string) => {
  changed.dispatchEvent(new CustomEvent("profile", { detail: userId }));
  channel?.postMessage(userId);
};
export function openDB() {
  if (!dbPromise)
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        const u = d.createObjectStore("users", { keyPath: "userId" });
        u.createIndex("loginId", "loginId", { unique: true });
        d.createObjectStore("profiles", { keyPath: "userId" });
      };
      req.onsuccess = () => {
        req.result.onversionchange = () => {
          req.result.close();
          dbPromise = undefined;
        };
        resolve(req.result);
      };
      req.onerror = () => {
        dbPromise = undefined;
        reject(
          new Error(
            "브라우저 저장소를 열 수 없습니다. 설정과 저장 용량을 확인하세요.",
          ),
        );
      };
      req.onblocked = () =>
        reject(
          new Error(
            "다른 탭이 저장소 업데이트를 막고 있습니다. 해당 탭을 닫고 다시 시도하세요.",
          ),
        );
    });
  return dbPromise;
}
export function emptyProfile(userId: string): Profile {
  const stamp = new Date().toISOString();
  return {
    schemaVersion: 1,
    textbookChecks: [],
    userId,
    createdAt: stamp,
    updatedAt: stamp,
    attempts: [],
    wrongNotes: [],
    progress: [],
    bookmarks: [],
    draft: null,
    settings: { theme: "dark", shuffle: true },
    lastLessonId: null,
  };
}
function request<T>(r: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function completion(t: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onabort = () =>
      reject(
        t.error ??
          new Error("저장 작업이 취소됐습니다. 기록은 저장되지 않았습니다."),
      );
  });
}
export async function getProfile(userId: string) {
  const d = await openDB();
  const t = d.transaction("profiles", "readonly");
  const p = await request<Profile | undefined>(
    t.objectStore("profiles").get(userId),
  );
  if (p && p.schemaVersion !== 1)
    throw new Error("지원하지 않는 기록 버전입니다. 원본 백업을 보존하세요.");
  return p ?? emptyProfile(userId);
}
// 트랜잭션 안에서는 비동기 연산을 하지 않고 최신 값을 읽은 뒤 동기적으로 수정한다.
export async function updateProfile(
  userId: string,
  mutate: (p: Profile) => void,
): Promise<Profile> {
  const d = await openDB();
  const t = d.transaction("profiles", "readwrite");
  const done = completion(t);
  const s = t.objectStore("profiles");
  let output: Profile = emptyProfile(userId);
  const r = s.get(userId);
  r.onsuccess = () => {
    try {
      output = r.result ?? emptyProfile(userId);
      if (output.schemaVersion !== 1)
        throw new Error("지원하지 않는 기록 버전");
      mutate(output);
      output.userId = userId;
      output.updatedAt = new Date().toISOString();
      s.put(output);
    } catch {
      t.abort();
    }
  };
  await done;
  announce(userId);
  return output;
}
const hex = (b: Uint8Array) =>
  Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
export function localAuthIssue(): string | null {
  return globalThis.isSecureContext === false || !globalThis.crypto?.subtle
    ? "회원가입·로그인은 HTTPS 연결에서만 사용할 수 있습니다. HTTPS 주소에서 다시 열어 주세요."
    : null;
}
function requireLocalAuth() {
  const issue = localAuthIssue();
  if (issue) throw new Error(issue);
}
async function derive(password: string, salt: string, iterations: number) {
  requireLocalAuth();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const saltBuffer = new Uint8Array(
    salt.match(/../g)!.map((s) => parseInt(s, 16)),
  );
  const result = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBuffer, iterations },
    key,
    256,
  );
  return hex(new Uint8Array(result));
}
export async function register(
  loginId: string,
  displayName: string,
  password: string,
): Promise<Session> {
  requireLocalAuth();
  loginId = loginId.trim().toLowerCase();
  displayName = displayName.trim();
  if (!/^[a-z0-9_-]{3,32}$/.test(loginId))
    throw new Error("아이디는 영문 소문자·숫자·_·- 3~32자입니다.");
  if (displayName.length < 1 || displayName.length > 30)
    throw new Error("표시 이름은 1~30자입니다.");
  if (password.length < 8 || password.length > 128)
    throw new Error("비밀번호는 8~128자입니다.");
  const salt = hex(crypto.getRandomValues(new Uint8Array(16))),
    iterations = 600000;
  const verifier = await derive(password, salt, iterations),
    stamp = new Date().toISOString();
  const u: LocalUser = {
    userId: crypto.randomUUID(),
    loginId,
    displayName,
    salt,
    verifier,
    iterations,
    createdAt: stamp,
    updatedAt: stamp,
  };
  const d = await openDB(),
    t = d.transaction(["users", "profiles"], "readwrite");
  const done = completion(t);
  t.objectStore("users").add(u);
  t.objectStore("profiles").add(emptyProfile(u.userId));
  try {
    await done;
  } catch (e) {
    if ((e as DOMException)?.name === "ConstraintError")
      throw new Error("이미 사용 중인 아이디입니다.");
    throw e;
  }
  return { userId: u.userId, displayName: u.displayName, guest: false };
}
export async function login(
  loginId: string,
  password: string,
): Promise<Session> {
  requireLocalAuth();
  if (!loginId.trim() || !password)
    throw new Error("아이디와 비밀번호를 입력하세요.");
  const d = await openDB(),
    t = d.transaction("users", "readonly");
  const u = await request<LocalUser | undefined>(
    t.objectStore("users").index("loginId").get(loginId.trim().toLowerCase()),
  );
  if (!u) throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  const candidate = await derive(password, u.salt, u.iterations);
  let diff = 0;
  for (let i = 0; i < u.verifier.length; i++)
    diff |= u.verifier.charCodeAt(i) ^ candidate.charCodeAt(i);
  if (diff) throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  return { userId: u.userId, displayName: u.displayName, guest: false };
}
export function guestSession(): Session {
  return { userId: GUEST_ID, displayName: "게스트", guest: true };
}
export function saveSession(s: Session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}
export async function readSession(): Promise<Session> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return guestSession();
    const s = JSON.parse(raw) as Session;
    if (s.guest) return guestSession();
    const d = await openDB(),
      t = d.transaction("users", "readonly");
    const u = await request<LocalUser | undefined>(
      t.objectStore("users").get(s.userId),
    );
    return u
      ? { userId: u.userId, displayName: u.displayName, guest: false }
      : guestSession();
  } catch {
    return guestSession();
  }
}
export async function patchDraft(
  owner: string,
  id: string,
  mutate: (draft: ExamDraft) => void,
) {
  return updateProfile(owner, (p) => {
    if (
      p.draft?.id !== id ||
      p.draft.submitted ||
      (p.draft.mode === "exam" &&
        p.draft.endsAt !== null &&
        Date.now() >= p.draft.endsAt)
    )
      return;
    mutate(p.draft);
    p.draft.updatedAt = new Date().toISOString();
  });
}
function applyWrong(p: Profile, a: Attempt) {
  for (const id of a.questionIds) {
    const g = a.grades[id];
    if (g === null) continue;
    const old = p.wrongNotes.find((w) => w.questionId === id);
    if (g === false) {
      const stamp = new Date().toISOString();
      if (old) {
        old.count++;
        old.answer = a.answers[id] ?? "";
        old.attemptId = a.id;
        old.resolved = false;
        old.latestCorrect = false;
        old.updatedAt = stamp;
      } else
        p.wrongNotes.push({
          questionId: id,
          userId: p.userId,
          createdAt: stamp,
          updatedAt: stamp,
          attemptId: a.id,
          answer: a.answers[id] ?? "",
          count: 1,
          resolved: false,
          latestCorrect: false,
        });
    } else if (old) {
      old.latestCorrect = true;
      old.resolved = true;
      old.updatedAt = a.updatedAt;
    }
  }
}
export async function submitDraft(
  owner: string,
  id: string,
  expired = false,
): Promise<Profile> {
  return updateProfile(owner, (p) => {
    if (p.attempts.some((a) => a.id === id)) return;
    const d = p.draft;
    if (!d || d.id !== id || d.submitted) return;
    const timedOut =
      d.mode === "exam" && d.endsAt !== null && Date.now() >= d.endsAt;
    const a = scoreDraft(d, expired || timedOut);
    p.attempts.push(a);
    applyWrong(p, a);
    p.draft = null;
  });
}
export async function evaluateEssay(
  owner: string,
  attemptId: string,
  qid: string,
  correct: boolean,
) {
  return updateProfile(owner, (p) => {
    const a = p.attempts.find((a) => a.id === attemptId);
    if (
      !a ||
      !a.questionIds.includes(qid) ||
      questionMap[qid]?.kind !== "essay"
    )
      return;
    const previous = a.grades[qid];
    a.selfGrades[qid] = correct;
    a.grades[qid] = grade(questionMap[qid], a.answers[qid], correct);
    a.correct = Object.values(a.grades).filter((g) => g === true).length;
    a.pending = Object.values(a.grades).filter((g) => g === null).length;
    a.score = a.pending ? null : Math.round((a.correct / a.total) * 100);
    a.updatedAt = new Date().toISOString();
    if (previous === null) applyWrong(p, { ...a, questionIds: [qid] });
    else {
      const w = p.wrongNotes.find((w) => w.questionId === qid);
      if (w) {
        w.latestCorrect = correct;
        w.resolved = correct;
        w.updatedAt = a.updatedAt;
      } else if (!correct) applyWrong(p, { ...a, questionIds: [qid] });
    }
  });
}
export async function toggleBookmark(
  owner: string,
  targetId: string,
  kind: "lesson" | "question",
) {
  return updateProfile(owner, (p) => {
    const i = p.bookmarks.findIndex(
      (b) => b.targetId === targetId && b.kind === kind,
    );
    if (i >= 0) p.bookmarks.splice(i, 1);
    else {
      const s = new Date().toISOString();
      p.bookmarks.push({
        targetId,
        kind,
        userId: owner,
        createdAt: s,
        updatedAt: s,
      });
    }
  });
}
export async function readLesson(
  owner: string,
  id: string,
  completed?: boolean,
) {
  return updateProfile(owner, (p) => {
    p.lastLessonId = id;
    if (completed === undefined) return;
    const old = p.progress.find((x) => x.lessonId === id),
      s = new Date().toISOString();
    if (old) {
      old.completed = completed;
      old.updatedAt = s;
    } else
      p.progress.push({
        lessonId: id,
        completed,
        userId: owner,
        createdAt: s,
        updatedAt: s,
      });
  });
}

export async function readChapter(owner: string, topic: TopicId, completed: boolean) {
  const members=lessons.filter(l=>l.topic===topic);
  if (!members.length) throw new Error('강의 범위를 찾을 수 없습니다.');
  return updateProfile(owner,p=>{
    const now=new Date().toISOString();
    for (const l of members) {
      const old=p.progress.find(x=>x.lessonId===l.id);
      if (old) { old.completed=completed; old.updatedAt=now; }
      else p.progress.push({userId:owner,lessonId:l.id,completed,createdAt:now,updatedAt:now});
    }
    p.lastLessonId=members[0].id;
  });
}

const stamp = z.string().datetime();
const id = z.string().min(1).max(160);
const owned = { userId: id, createdAt: stamp, updatedAt: stamp };
const strings = z.record(z.string(), z.string().max(10000));
const bools = z.record(z.string(), z.boolean());
const draftSchema = z
  .object({
    ...owned,
    id,
    mode: z.enum(["practice", "exam"]),
    title: z.string().max(200),
    questionIds: z.array(id).max(300),
    choiceOrders: z.record(z.string(), z.array(id).max(8)),
    answers: strings,
    reviewed: z.array(id).max(300),
    checked: z.array(id).max(300),
    selfGrades: bools,
    index: z.number().int().min(0),
    endsAt: z.number().finite().nullable(),
    submitted: z.boolean(),
  })
  .strict();
const attemptSchema = z
  .object({
    ...owned,
    id,
    title: z.string().max(200),
    mode: z.enum(["practice", "exam"]),
    questionIds: z.array(id).max(300),
    answers: strings,
    grades: z.record(z.string(), z.boolean().nullable()),
    correct: z.number().int().min(0),
    total: z.number().int().min(0),
    pending: z.number().int().min(0),
    score: z.number().min(0).max(100).nullable(),
    durationSeconds: z.number().min(0),
    selfGrades: bools,
    expired: z.boolean(),
  })
  .strict();
const profileSchema = z
  .object({
    ...owned,
    schemaVersion: z.literal(1),
    textbookChecks: z.array(z.enum(["A", "B", "C", "D"])).max(4).default([]),
    attempts: z.array(attemptSchema).max(10000),
    wrongNotes: z
      .array(
        z
          .object({
            ...owned,
            questionId: id,
            attemptId: id,
            answer: z.string().max(10000),
            count: z.number().int().min(1),
            resolved: z.boolean(),
            latestCorrect: z.boolean(),
          })
          .strict(),
      )
      .max(1000),
    progress: z
      .array(
        z.object({ ...owned, lessonId: id, completed: z.boolean() }).strict(),
      )
      .max(1000),
    bookmarks: z
      .array(
        z
          .object({
            ...owned,
            targetId: id,
            kind: z.enum(["lesson", "question"]),
          })
          .strict(),
      )
      .max(1000),
    draft: draftSchema.nullable(),
    settings: z
      .object({ theme: z.enum(["dark", "light"]), shuffle: z.boolean() })
      .strict(),
    lastLessonId: id.nullable(),
  })
  .strict();
const backupSchema = z
  .object({
    app: z.literal("computer-security-cbt"),
    schemaVersion: z.literal(1),
    exportedAt: stamp,
    profile: profileSchema,
  })
  .strict();
export function exportBackup(p: Profile) {
  return JSON.stringify(
    {
      app: "computer-security-cbt",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      profile: p,
    },
    null,
    2,
  );
}
export function validateBackup(json: string): Profile {
  if (new TextEncoder().encode(json).byteLength > 10_000_000)
    throw new Error("백업 파일은 10MB 이하여야 합니다.");
  let p: Profile;
  try {
    p = backupSchema.parse(JSON.parse(json)).profile as Profile;
  } catch {
    throw new Error(
      "백업 형식 또는 버전이 올바르지 않습니다. 기존 기록은 유지됩니다.",
    );
  }
  const validQ = (ids: string[]) =>
    ids.length > 0 &&
    new Set(ids).size === ids.length &&
    ids.every((id) => !!questionMap[id]);
  const validAnswerKeys = (keys: Record<string, unknown>, ids: string[]) =>
    Object.keys(keys).every((id) => ids.includes(id));
  const validAnswers = (answers: Record<string,string>) => Object.entries(answers).every(([id, answer]) =>
    questionMap[id]?.kind !== "choice" || !answer || questionMap[id].choices!.some(c=>c.id===answer));
  const ownedItems = [...p.attempts, ...p.wrongNotes, ...p.progress, ...p.bookmarks, ...(p.draft ? [p.draft] : [])];
  if (ownedItems.some(x=>x.userId!==p.userId)) throw new Error("백업에 다른 사용자의 기록이 섞여 있습니다.");
  if (p.wrongNotes.some(w=>!p.attempts.some(a=>a.id===w.attemptId && a.questionIds.includes(w.questionId))))
    throw new Error("백업의 오답 응시 참조가 잘못됐습니다.");
  for (const a of p.attempts) {
    if (
      !validQ(a.questionIds) ||
      !validAnswerKeys(a.answers, a.questionIds) ||
      !validAnswerKeys(a.selfGrades, a.questionIds)
      || !validAnswers(a.answers) || Object.keys(a.selfGrades).some(id=>questionMap[id]?.kind!=="essay")
    )
      throw new Error("백업의 응시 참조가 잘못됐습니다.");
    a.grades = Object.fromEntries(
      a.questionIds.map((id) => [
        id,
        grade(questionMap[id], a.answers[id], a.selfGrades[id]),
      ]),
    );
    a.correct = Object.values(a.grades).filter((g) => g === true).length;
    a.pending = Object.values(a.grades).filter((g) => g === null).length;
    a.total = a.questionIds.length;
    a.score = a.pending ? null : Math.round((a.correct / a.total) * 100);
  }
  if (
    p.progress.some((x) => !lessonMap[x.lessonId]) ||
    p.bookmarks.some((b) =>
      b.kind === "lesson" ? !lessonMap[b.targetId] : !questionMap[b.targetId],
    ) ||
    p.wrongNotes.some((w) => !questionMap[w.questionId]) ||
    (p.lastLessonId && !lessonMap[p.lastLessonId])
  )
    throw new Error("백업의 강의·문제 참조가 잘못됐습니다.");
  if (p.draft) {
    const d = p.draft;
    if (
      !validQ(d.questionIds) ||
      d.index >= d.questionIds.length ||
      d.submitted ||
      (d.mode === "exam" ? d.endsAt === null : d.endsAt !== null) ||
      !validAnswerKeys(d.answers, d.questionIds) ||
      !validAnswerKeys(d.selfGrades, d.questionIds) ||
      !validAnswerKeys(d.choiceOrders, d.questionIds) ||
      !validAnswers(d.answers) || Object.keys(d.selfGrades).some(id=>questionMap[id]?.kind!=="essay") ||
      (d.mode === "exam" && (d.checked.length>0 || Object.keys(d.selfGrades).length>0)) ||
      p.attempts.some(a=>a.id===d.id) ||
      [...d.reviewed, ...d.checked].some((id) => !d.questionIds.includes(id))
    )
      throw new Error("백업의 진행 중 시험이 잘못됐습니다.");
    for (const qid of d.questionIds) {
      const choiceIds = questionMap[qid].choices?.map((c) => c.id) ?? [];
      const order = d.choiceOrders[qid] ?? [];
      if (
        order.length !== choiceIds.length ||
        new Set(order).size !== order.length ||
        order.some((x) => !choiceIds.includes(x))
      )
        throw new Error("백업의 선지 순서가 잘못됐습니다.");
    }
  }
  if (
    new Set(p.attempts.map((a) => a.id)).size !== p.attempts.length ||
    new Set(p.wrongNotes.map((w) => w.questionId)).size !==
      p.wrongNotes.length ||
    new Set(p.progress.map((x) => x.lessonId)).size !== p.progress.length ||
    new Set(p.bookmarks.map((x) => x.kind + ":" + x.targetId)).size !==
      p.bookmarks.length
  )
    throw new Error("백업에 중복 기록이 있습니다.");
  return p;
}
function rebind(p: Profile, owner: string) {
  p.userId = owner;
  for (const list of [p.attempts, p.wrongNotes, p.progress, p.bookmarks])
    for (const x of list) x.userId = owner;
  if (p.draft) p.draft.userId = owner;
  return p;
}
function merge<T extends { updatedAt: string }>(
  old: T[],
  incoming: T[],
  key: (v: T) => string,
) {
  const m = new Map(old.map((x) => [key(x), x]));
  for (const x of incoming) {
    const prev = m.get(key(x));
    if (!prev || x.updatedAt > prev.updatedAt) m.set(key(x), x);
  }
  return [...m.values()];
}
export async function importBackup(
  owner: string,
  json: string,
  policy: "merge" | "replace",
) {
  const incoming = rebind(validateBackup(json), owner);
  return updateProfile(owner, (p) => {
    if (policy === "replace") {
      Object.assign(p, incoming);
      return;
    }
    p.attempts = merge(p.attempts, incoming.attempts, (a) => a.id);
    p.progress = merge(p.progress, incoming.progress, (x) => x.lessonId);
    p.bookmarks = merge(
      p.bookmarks,
      incoming.bookmarks,
      (x) => x.kind + ":" + x.targetId,
    );
    p.wrongNotes = merge(
      p.wrongNotes,
      incoming.wrongNotes,
      (x) => x.questionId,
    );
    if (!p.draft) p.draft = incoming.draft;
    p.lastLessonId ??= incoming.lastLessonId;
    p.textbookChecks = [...new Set([...p.textbookChecks, ...incoming.textbookChecks])];
  });
}
export async function migrateGuest(owner: string) {
  if (owner === GUEST_ID) return;
  const guest = await getProfile(GUEST_ID);
  return importBackup(owner, exportBackup(guest), "merge");
}
