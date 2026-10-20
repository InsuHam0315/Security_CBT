import type {
  Answer,
  Attempt,
  Calculation,
  CaseStudy,
  ExamDraft,
  Question,
  Row,
  TopicId,
  ExamBlueprint,
} from "./types";
import { caseMap, allCases, questionMap, questions, allTopics } from "./content";
export function roundQuestions(round: ExamBlueprint): string[] {
  return round.caseIds.flatMap((id) => caseMap[id].questionIds);
}
export function quantile(values: number[], p: number) {
  const s = [...values].sort((a, b) => a - b);
  const pos = (s.length - 1) * p;
  const lo = Math.floor(pos);
  return s[lo] + (s[Math.ceil(pos)] - s[lo]) * (pos - lo);
}
export function calculate(rows: Row[], c: Calculation): number {
  if (c.where) rows = rows.filter((r) => r[c.where!.column] === c.where!.value);
  const nums = rows
    .map((r) => (c.column ? r[c.column] : null))
    .filter((v): v is number => typeof v === "number");
  if (c.factor !== undefined)
    return (
      calculate(rows, { ...c, where: undefined, factor: undefined }) * c.factor
    );
  switch (c.op) {
    case "count":
      return rows.length;
    case "sum":
      return nums.reduce((a, b) => a + b, 0);
    case "mean":
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    case "median":
      return quantile(nums, 0.5);
    case "countWhere":
      return rows.length;
    case "ratio":
      return (
        calculate(rows, c.numeratorRule!) / calculate(rows, c.denominatorRule!)
      );
    case "mae":
      return (
        rows.reduce(
          (a, r) =>
            a + Math.abs(Number(r[c.actual!]) - Number(r[c.predicted!])),
          0,
        ) / rows.length
      );
    case "cell":
      return Number(rows[c.row!][c.column!]);
    case "unique":
      return new Set(rows.map((r) => r[c.column!]).filter((v) => v !== null))
        .size;
    case "size":
      return rows.filter((r) => r[c.column!] !== null).length;
    case "blocks":
      return (
        nums.reduce((a, v) => a + Math.ceil(v / c.blockSize!), 0) *
        (c.multiplier ?? 1)
      );
    case "rowSum":
      return c.columns!.reduce((a, k) => a + Number(rows[c.row!][k]), 0);
    case "joint":
      return rows.filter((r) => c.columns!.every((k) => r[k] !== null)).length;
    case "degree": {
      const [x, y] = c.columns!;
      const nodes = new Set(rows.flatMap((r) => [String(r[x]), String(r[y])]));
      const neighbors = new Set(
        rows
          .filter((r) => r[x] === c.node || r[y] === c.node)
          .map((r) => String(r[x] === c.node ? r[y] : r[x])),
      );
      return neighbors.size / (nodes.size - 1);
    }
  }
}
export function grade(
  q: Question,
  answer: Answer | undefined,
  selfGrade?: boolean,
): boolean | null {
  if (q.kind === "essay") return answer?.trim() ? (selfGrade ?? null) : false;
  if (!answer?.trim()) return false;
  if (q.kind === "choice") return answer === q.correctId;
  if (q.kind === "short")
    return q.accepted!.some((a) => normalize(a) === normalize(answer));
  const clean = answer.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(clean))
    return false;
  const n = Number(clean);
  return (
    Number.isFinite(n) &&
    Math.abs(n - q.numeric!.value) <= q.numeric!.tolerance + Number.EPSILON
  );
}
export const normalize = (s: string) =>
  s.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
export function shuffle<T>(
  items: T[],
  random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296,
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function selectQuestions({
  pool = questions,
  count = 40,
  random = true,
  priority = [],
}: {
  pool?: Question[];
  count?: number;
  random?: boolean;
  priority?: string[];
}): { ids: string[]; available: number } {
  if (!pool.length) return { ids: [], available: 0 };
  const allowed = new Set(pool.map((q) => q.id));
  const groups = allCases.filter((c) =>
    c.questionIds.some((id) => allowed.has(id)),
  );
  const ordered = random
    ? shuffle(groups)
    : [...groups].sort((a, b) => {
        const ai = priority.indexOf(a.id),
          bi = priority.indexOf(b.id);
        return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
      });
  const chosen: CaseStudy[] = [];
  // 범위에 존재하는 각 주제의 사례를 먼저 하나씩. 한 사례의 문항은 항상 연속.
  for (const t of allTopics) {
    const c = ordered.find((c) => c.topic === t.id);
    if (c) chosen.push(c);
  }
  const finalGroups = [
    ...chosen,
    ...ordered.filter((c) => !chosen.includes(c)),
  ];
  const selected: string[] = [];
  for (const c of finalGroups) {
    const ids = c.questionIds.filter((id) => allowed.has(id));
    if (selected.length + ids.length <= count) selected.push(...ids);
  }
  // 목표가 사례 하나보다 작으면 한 사례 안에서만 잘라 반환.
  if (!selected.length)
    selected.push(
      ...finalGroups[0].questionIds
        .filter((id) => allowed.has(id))
        .slice(0, count),
    );
  return { ids: selected, available: pool.length };
}
export function newDraft(
  userId: string,
  mode: "exam" | "practice",
  title: string,
  ids: string[],
  minutes: number,
  shuffleChoices = true,
): ExamDraft {
  const stamp = new Date().toISOString();
  return {
    userId,
    id: crypto.randomUUID(),
    createdAt: stamp,
    updatedAt: stamp,
    mode,
    title,
    questionIds: ids,
    choiceOrders: Object.fromEntries(
      ids.map((id) => [
        id,
        shuffleChoices
          ? shuffle(questionMap[id].choices?.map((c) => c.id) ?? [])
          : (questionMap[id].choices?.map((c) => c.id) ?? []),
      ]),
    ),
    answers: {},
    reviewed: [],
    checked: [],
    selfGrades: {},
    index: 0,
    endsAt: mode === "exam" ? Date.now() + minutes * 60000 : null,
    submitted: false,
  };
}
export function scoreDraft(d: ExamDraft, expired = false): Attempt {
  const grades = Object.fromEntries(
    d.questionIds.map((id) => [
      id,
      grade(questionMap[id], d.answers[id], d.selfGrades[id]),
    ]),
  );
  const correct = Object.values(grades).filter((v) => v === true).length,
    pending = Object.values(grades).filter((v) => v === null).length;
  const total = d.questionIds.length;
  const now = new Date().toISOString();
  return {
    id: d.id,
    userId: d.userId,
    title: d.title,
    mode: d.mode,
    questionIds: d.questionIds,
    answers: d.answers,
    grades,
    correct,
    pending,
    total,
    score: pending ? null : Math.round((correct / total) * 100),
    createdAt: d.createdAt,
    updatedAt: now,
    durationSeconds: Math.max(
      0,
      Math.round((Date.now() - Date.parse(d.createdAt)) / 1000),
    ),
    selfGrades: d.selfGrades,
    expired,
  };
}
export function topicStats(
  attempts: Attempt[],
  field: "topic" | "skill" | "mistake" = "topic",
) {
  const groups: Record<string, { correct: number; total: number }> = {};
  for (const a of attempts)
    for (const id of a.questionIds) {
      const q = questionMap[id];
      if (!q || a.grades[id] === null) continue;
      const k = q[field];
      groups[k] ??= { correct: 0, total: 0 };
      groups[k].total++;
      if (a.grades[id]) groups[k].correct++;
    }
  return groups;
}
export function filters(
  pool: Question[],
  topic: string,
  difficulty: string,
  kind: string,
) {
  return pool.filter(
    (q) =>
      (!topic || q.topic === (topic as TopicId)) &&
      (!difficulty || q.difficulty === difficulty) &&
      (!kind || q.kind === kind),
  );
}
