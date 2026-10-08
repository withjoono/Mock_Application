// 성적 분석 API 타입 정의

// 과목별 점수 데이터
export interface SubjectScore {
  standardScore: string;
  percentile: string;
  grade: string;
  name: string;
}

// 전체 점수 데이터 구조
export interface ScoreData {
  korean: SubjectScore;
  math: SubjectScore;
  inquiry1: SubjectScore;
  inquiry2: SubjectScore;
  english: SubjectScore;
  koreanHistory: SubjectScore;
  secondLang: SubjectScore;
}

// 계산된 합계/평균
export interface ScoreCalculations {
  standardScore: {
    sum: string;
    avg: string;
  };
  percentile: {
    sum: string;
    avg: string;
  };
  grade: {
    sum: string;
    avg: string;
  };
}

// 표준점수 입력 데이터
export interface StandardScoreInput {
  koreanStd?: number;
  mathType?: '확통' | '미적' | '기하';
  mathStd?: number;
  english?: number; // 등급
  history?: number; // 등급
  inquiry1Type?: string;
  inquiry1Std?: number;
  inquiry2Type?: string;
  inquiry2Std?: number;
  secondLang?: {
    type?: string;
    grade?: number;
  };
}

// API 응답 - 백엔드에서 받아올 분석 결과
export interface ScoreAnalysisResponse {
  userId: string;
  scoreData: ScoreData;
  calculations: ScoreCalculations;
  academicDivision: 'NaturalSciences' | 'LiberalArts'; // 이과/문과
  createdAt: string;
}

// 과목 코드 매핑 (S1, S2 등)
export const SUBJECT_CODES = {
  // 국어 (언매/화작)
  S1: { name: '언매', category: 'kor' },
  S2: { name: '화작', category: 'kor' },
  // 수학
  S4: { name: '미적', category: 'math' },
  S5: { name: '기하', category: 'math' },
  S6: { name: '확통', category: 'math' },
  // 영어
  S8: { name: '영어', category: 'english' },
  // 한국사
  S9: { name: '한국사', category: 'history' },
  // 과탐
  S10: { name: '물리학I', category: 'science' },
  S11: { name: '화학I', category: 'science' },
  S12: { name: '생명과학I', category: 'science' },
  S13: { name: '지구과학I', category: 'science' },
  S14: { name: '물리학II', category: 'science' },
  S15: { name: '화학II', category: 'science' },
  S16: { name: '생명과학II', category: 'science' },
  S17: { name: '지구과학II', category: 'science' },
  // 사탐
  S18: { name: '생활과윤리', category: 'society' },
  S19: { name: '윤리와사상', category: 'society' },
  S20: { name: '한국지리', category: 'society' },
  S21: { name: '세계지리', category: 'society' },
  S22: { name: '동아시아사', category: 'society' },
  S23: { name: '세계사', category: 'society' },
  S24: { name: '경제', category: 'society' },
  S25: { name: '정치와법', category: 'society' },
  S26: { name: '사회문화', category: 'society' },
  // 제2외국어
  S27: { name: '독일어', category: 'language' },
  S28: { name: '프랑스어', category: 'language' },
  S29: { name: '스페인어', category: 'language' },
  S30: { name: '중국어', category: 'language' },
  S31: { name: '일본어', category: 'language' },
  S32: { name: '러시아어', category: 'language' },
  S33: { name: '아랍어', category: 'language' },
  S34: { name: '베트남어', category: 'language' },
  S35: { name: '한문', category: 'language' },
} as const;

// 등급 색상
export const GRADE_COLORS = {
  excellent: { bg: '#dbeafe', text: '#1d4ed8' }, // 1-2등급
  good: { bg: '#dcfce7', text: '#15803d' },      // 3-4등급
  average: { bg: '#fef3c7', text: '#b45309' },   // 5-6등급
  poor: { bg: '#fee2e2', text: '#dc2626' },      // 7-9등급
} as const;

// 등급에 따른 색상 반환
export function getGradeColor(grade: string): { bg: string; text: string } {
  const gradeNum = parseInt(grade);
  if (isNaN(gradeNum) || grade === '-') {
    return { bg: '#f3f4f6', text: '#6b7280' };
  }
  if (gradeNum <= 2) return GRADE_COLORS.excellent;
  if (gradeNum <= 4) return GRADE_COLORS.good;
  if (gradeNum <= 6) return GRADE_COLORS.average;
  return GRADE_COLORS.poor;
}

// 분석 바 색상
export const ANALYSIS_BAR_COLORS = {
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f59e0b',
  purple: '#a855f7',
} as const;
