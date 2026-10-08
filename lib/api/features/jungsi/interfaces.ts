/**
 * 정시 관련 TypeScript 인터페이스
 * 웹앱과 동일한 구조 유지
 */

// 과목 카테고리
export type SubjectCategory = 'kor' | 'math' | 'eng' | 'history' | 'society' | 'science' | 'lang';

// 수능 성적 입력
export interface IMockExamScoreInput {
  subjectCategory: SubjectCategory;
  subjectName: string;
  standardScore: string;
  grade: number;
  percentile: number;
}

// 원점수 입력 (백엔드 DTO 형식)
export interface IRawScoreInput {
  majorType: 'arts' | 'science';
  koreanElective: '언어와 매체' | '화법과 작문';
  mathElective: '확률과 통계' | '미적분' | '기하';
  korean: number;
  koreanElectiveScore: number;
  math: number;
  mathElectiveScore: number;
  english: number;
  history: number;
  inquiry1: string;
  inquiry1Score: number;
  inquiry2: string;
  inquiry2Score: number;
  secondLanguage?: string;
  secondLanguageScore?: number;
}

// 표준점수 입력
export interface IStandardScoreInput {
  majorType: 'arts' | 'science';
  koreanElective: '언어와 매체' | '화법과 작문';
  mathElective: '확률과 통계' | '미적분' | '기하';
  koreanStandardScore: number;
  mathStandardScore: number;
  englishGrade: number;
  historyGrade: number;
  inquiry1: string;
  inquiry1StandardScore: number;
  inquiry2: string;
  inquiry2StandardScore: number;
  secondLanguage?: string;
  secondLanguageGrade?: number;
}

// 대학별 계산 결과
export interface IUniversityCalculatedScore {
  universityId: number;
  universityName: string;
  departmentId: number;
  departmentName: string;
  admissionType: string;
  calculatedScore: number;
  maxScore: number;
  percentile: number;
  rank?: number;
  totalApplicants?: number;
  passChance: 'high' | 'medium' | 'low' | 'very_low';
  cutoffScore?: number;
  lastYearCutoff?: number;
  competitionRate?: number;
}

// 점수 계산 응답
export interface ICalculateScoresResponse {
  memberId: number;
  calculatedAt: string;
  totalUniversities: number;
  successCount: number;
  failedCount: number;
  scores: IUniversityCalculatedScore[];
}

// 저장된 점수
export interface ISavedScore {
  id: number;
  memberId: number;
  scoreType: 'raw' | 'standard';
  koreanElective: string;
  mathElective: string;
  majorType: string;
  korean: number;
  koreanElectiveScore: number;
  math: number;
  mathElectiveScore: number;
  english: number;
  history: number;
  inquiry1: string;
  inquiry1Score: number;
  inquiry2: string;
  inquiry2Score: number;
  secondLanguage?: string;
  secondLanguageScore?: number;
  createdAt: string;
  updatedAt: string;
}

// 점수 저장 요청
export interface ISaveScoreRequest {
  scoreType: 'raw' | 'standard';
  majorType: 'arts' | 'science';
  koreanElective: string;
  mathElective: string;
  korean: number;
  koreanElectiveScore: number;
  math: number;
  mathElectiveScore: number;
  english: number;
  history: number;
  inquiry1: string;
  inquiry1Score: number;
  inquiry2: string;
  inquiry2Score: number;
  secondLanguage?: string;
  secondLanguageScore?: number;
}

// 모의지원 결과
export interface IMockApplicationResult {
  universityId: number;
  universityName: string;
  departmentId: number;
  departmentName: string;
  admissionGroup: 'ga' | 'na' | 'da'; // 가군, 나군, 다군
  rank: number;
  totalApplicants: number;
  passChance: 'high' | 'medium' | 'low' | 'very_low';
  recommendedAction: string;
}

// API 응답 래퍼
export interface IApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 점수 목록 응답
export interface IScoresListResponse {
  scores: ISavedScore[];
  total: number;
}

// 대학 필터 옵션
export interface IUniversityFilter {
  region?: string;
  admissionType?: string;
  minScore?: number;
  maxScore?: number;
  departmentCategory?: string;
}

// 대학 정보
export interface IUniversityInfo {
  id: number;
  name: string;
  region: string;
  type: string;
  admissionTypes: string[];
  departments: IDepartmentInfo[];
}

// 학과 정보
export interface IDepartmentInfo {
  id: number;
  name: string;
  category: string;
  quota: number;
  admissionGroup: 'ga' | 'na' | 'da';
}
