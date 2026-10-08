// 모의지원 분석 API 타입 정의

export interface MockApplicationBasicInfo {
  universityCode: string;
  universityName: string;
  admissionType: string;
  recruitmentUnit: string;
  recruitmentCount: number;
  competitionRate: number;
  additionalPassRank: number;
  totalPassCount: number;
  mockApplicantCount: number;
}

export interface Statistics {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  safePassThreshold: number | null;
  passThreshold: number | null;
}

export interface FrequencyDistributionItem {
  scoreLower: number;
  scoreUpper: number;
  applicantCount: number;
  cumulativeCount: number;
  passStatus: '안정합격' | '추가합격' | '합격가능' | '불합격';
}

export interface NormalDistributionPoint {
  x: number;
  y: number;
}

export interface NormalDistributionCurve {
  xMin: number;
  xMax: number;
  points: NormalDistributionPoint[];
}

export interface MyScoreAnalysis {
  score: number;
  rank: number;
  percentile: number;
  passStatus: string;
  scoreRange: {
    scoreLower: number;
    scoreUpper: number;
  };
  comparedToMean: number;
}

export interface MockApplicationAnalysisResponse {
  basicInfo: MockApplicationBasicInfo;
  statistics: Statistics;
  frequencyDistribution: FrequencyDistributionItem[];
  normalDistributionCurve?: NormalDistributionCurve;
  myScoreAnalysis?: MyScoreAnalysis;
}

export interface MockApplicationAnalysisRequest {
  universityCode: string;
  universityName: string;
  recruitmentUnit: string;
  admissionType?: string;
  myScore?: number;
}

// 합격 상태별 색상
export const PASS_STATUS_COLORS = {
  '안정합격': '#22c55e', // green-500
  '추가합격': '#3b82f6', // blue-500
  '합격가능': '#f59e0b', // amber-500
  '불합격': '#ef4444', // red-500
} as const;

// 합격 상태별 배경색
export const PASS_STATUS_BG_COLORS = {
  '안정합격': '#dcfce7', // green-100
  '추가합격': '#dbeafe', // blue-100
  '합격가능': '#fef3c7', // amber-100
  '불합격': '#fee2e2', // red-100
} as const;
