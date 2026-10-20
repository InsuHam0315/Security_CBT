export type TopicId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
export interface PastMeta {
  status: "기출 복원" | "정리자료 재구성";
  occurrences: { sourceId: string; locator: string }[];
  correction?: string;
  references: { title: string; url: string }[];
  material?: { title: string; description: string; columns: string[]; rows: string[][] };
}
export interface Source {
  id: string;
  filename: string;
  role: "primary" | "supplement";
  pages: number;
}
export interface SourceRef {
  sourceId: string;
  pages: number[];
}
export interface Topic {
  id: TopicId;
  title: string;
  subtitle: string;
}
export interface Lesson {
  id: string;
  topic: TopicId;
  title: string;
  pptOutline: string;
  minutes: number;
  intro: string;
  prerequisiteIds: string[];
  walkthrough: string[];
  workedExamples: { caseId: string; calculationId: string; conceptId: string }[];
  microLab?: { code: string; output: string; notes: string[]; kind: string };
  codeKind: "diagram" | "python";
  selfChecks: { question: string; answer: string; explanation: string }[];
  keyPoints: string[];
  tags: string[];
  objectives: string[];
  sections: {
    heading: string; body: string[]; sources: SourceRef[];
    table?: { columns: string[]; rows: string[][] };
    code?: string;
  }[];
  additionalSections: {
    heading: string; body: string[];
    links: { title: string; url: string }[];
  }[];
  terms: string[][];
  code: string;
  codeNotes: string[];
  readOrder: string[];
  mistakes: string[];
  check: { question: string; answer: string };
  caseIds: string[];
  sources: SourceRef[];
  supplements: SourceRef[];
  verification?: string;
}
export type Cell = string | number | null;
export type Row = Record<string, Cell>;
export interface ChartSpec {
  type:
    | "bar"
    | "line"
    | "histogram"
    | "box"
    | "scatter"
    | "heatmap"
    | "dual"
    | "network"
    | "words";
  x: string;
  y: string;
  series?: string[];
  title: string;
  xLabel: string;
  yLabel: string;
  rightLabel?: string;
}
export interface CaseStudy {
  kind: "table" | "flow" | "code";
  id: string;
  topic: TopicId;
  title: string;
  scenario: string;
  unit: string;
  validN: number;
  exclusions: string;
  assumptions: string[];
  synthetic: true;
  numericOrigin: string;
  columns: string[];
  rows: Row[];
  chart?: ChartSpec;
  code: string;
  codeNotes: string[];
  guide: string[];
  lessonId: string;
  sources: SourceRef[];
  supplements: SourceRef[];
  questionIds: string[];
}
export type QuestionKind = "choice" | "numeric" | "short" | "essay";
export type Skill =
  | "표 해석"
  | "그래프 해석"
  | "전처리"
  | "코드 읽기"
  | "모델 결과 해석"
  | "개념 적용" | "조건 판단" | "흐름 해석";
export type Mistake =
  "계산" | "분모" | "단위" | "그래프 읽기" | "코드" | "개념" | "과도한 해석";
export interface Calculation {
  op:
    | "sum"
    | "mean"
    | "median"
    | "count"
    | "countWhere"
    | "ratio"
    | "mae"
    | "cell"
    | "unique"
    | "size"
    | "blocks"
    | "rowSum"
    | "joint"
    | "degree";
  column?: string;
  columns?: string[];
  where?: { column: string; value: Cell };
  numeratorRule?: Calculation;
  denominatorRule?: Calculation;
  factor?: number;
  row?: number;
  actual?: string;
  predicted?: string;
  blockSize?: number;
  multiplier?: number;
  node?: string;
}
export interface Question {
  id: string;
  caseId: string;
  topic: TopicId;
  kind: QuestionKind;
  difficulty: "기초" | "보통" | "심화";
  skill: Skill;
  mistake: Mistake;
  stem: string;
  choices?: { id: string; text: string; reason: string }[];
  correctId?: string;
  numeric?: {
    value: number;
    tolerance: number;
    unit: string;
    rounding: string;
    calculation: Calculation;
  };
  accepted?: string[];
  modelAnswer?: string;
  rubric?: string[];
  explanation: string;
  steps: string[];
  commonError: string;
  lessonId: string;
  sources: SourceRef[];
  origin: "직접 작성한 예상 연습문제" | "사용자 제공 기출 복습" | "사용자 정리 기반 재구성";
  past?: PastMeta;
}
export interface ExamBlueprint {
  id: string;
  title: string;
  description: string;
  caseIds: string[];
  defaultCount: number;
  defaultMinutes: number;
}
export interface LocalUser {
  userId: string;
  loginId: string;
  displayName: string;
  salt: string;
  verifier: string;
  iterations: number;
  createdAt: string;
  updatedAt: string;
}
export interface Session {
  userId: string;
  displayName: string;
  guest: boolean;
}
export type Answer = string;
export interface Owned {
  userId: string;
  createdAt: string;
  updatedAt: string;
}
export interface ExamDraft extends Owned {
  id: string;
  mode: "practice" | "exam";
  title: string;
  questionIds: string[];
  choiceOrders: Record<string, string[]>;
  answers: Record<string, Answer>;
  reviewed: string[];
  checked: string[];
  selfGrades: Record<string, boolean>;
  index: number;
  endsAt: number | null;
  submitted: boolean;
}
export interface Attempt extends Owned {
  id: string;
  title: string;
  mode: "practice" | "exam";
  questionIds: string[];
  answers: Record<string, Answer>;
  grades: Record<string, boolean | null>;
  correct: number;
  total: number;
  pending: number;
  score: number | null;
  durationSeconds: number;
  selfGrades: Record<string, boolean>;
  expired: boolean;
}
export interface WrongNote extends Owned {
  questionId: string;
  attemptId: string;
  answer: string;
  count: number;
  resolved: boolean;
  latestCorrect: boolean;
}
export interface LessonProgress extends Owned {
  lessonId: string;
  completed: boolean;
}
export interface Bookmark extends Owned {
  targetId: string;
  kind: "lesson" | "question";
}
export interface Profile extends Owned {
  textbookChecks: string[];
  schemaVersion: 1;
  attempts: Attempt[];
  wrongNotes: WrongNote[];
  progress: LessonProgress[];
  bookmarks: Bookmark[];
  draft: ExamDraft | null;
  settings: { theme: "dark" | "light"; shuffle: boolean };
  lastLessonId: string | null;
}
