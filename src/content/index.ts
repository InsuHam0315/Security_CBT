import sourceData from "./sources.json";
import topicData from "./topics.json";
import lessonData from "./lessons.json";
import caseData from "./cases.json";
import questionData from "./questions.json";
import blueprintData from "./blueprints.json";
import { pastQuestions, pastCases, pastTopics } from './past';
import type {
  Source,
  Topic,
  Lesson,
  CaseStudy,
  Question,
  ExamBlueprint,
} from "../types";
export const sources = sourceData as Source[];
export const topics = topicData as Topic[];
export const lessons = lessonData as Lesson[];
export const cases = caseData as CaseStudy[];
export const questions = questionData as Question[];
export const blueprints = blueprintData as ExamBlueprint[];
export const lessonMap = Object.fromEntries(lessons.map((l) => [l.id, l]));
export const allQuestions = [...questions, ...pastQuestions];
export const allCases = [...cases, ...pastCases];
export const allTopics = [...topics, ...pastTopics];
export const caseMap = Object.fromEntries(allCases.map((c) => [c.id, c]));
export const questionMap = Object.fromEntries(allQuestions.map((q) => [q.id, q]));
export const sourceMap = Object.fromEntries(sources.map((s) => [s.id, s]));
