import bank from './bank.json';
import type { CaseStudy, Question, Topic } from '../../types';

export interface PastPaper { id: string; title: string; description: string; questionIds: string[]; category: string }
export interface PastReview { id: string; sourceId: string; locator: string; title: string; issue: string; resolution: string; replacement: string | null }
export const pastQuestions = bank.questions as Question[];
export const pastCases = bank.cases as CaseStudy[];
export const pastPapers = bank.papers as PastPaper[];
export const pastReviews = bank.reviews as PastReview[];
export const pastSources = bank.sources;
export const pastSourceMap = Object.fromEntries(pastSources.map(s => [s.id,s]));
export const pastAudit = bank.fileAudit;
export const pastReviewedAt = bank.reviewedAt;
export const pastTopics: Topic[] = [
  {id:'E',title:'족보 · 암호·전자서명·블록체인',subtitle:'기출 및 교재 7~8장 정리'},
  {id:'F',title:'족보 · 보안 솔루션',subtitle:'방화벽·IDS/IPS·VPN·인증'},
  {id:'G',title:'족보 · 포렌식 용어',subtitle:'증거 관련 학습 용어'},
  {id:'H',title:'족보 · IoT·인공지능',subtitle:'교재 10장 정리'},
];
