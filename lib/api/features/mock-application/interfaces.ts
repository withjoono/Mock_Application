/**
 * 모의지원 (ma_*) API 타입
 * Hub-Backend /mock-application/* 응답 기준 (humps 인터셉터로 camelCase 변환됨)
 */

export type MaSeasonType = 'MOCK_JUNE' | 'MOCK_SEPT' | 'SUSI' | 'JUNGSI';
export type GunType = '가' | '나' | '다';

export interface IApiResponse<T> {
  success: boolean;
  data: T;
}

/** 시즌 (앱 홈 카드) */
export interface IMaSeason {
  id: number;
  year: number;
  seasonType: MaSeasonType;
  title: string;
  openAt: string;
  closeAt: string;
  resultOpenAt: string | null;
  isActive: boolean;
  /** 서버 계산: 현재 지원 가능 여부 */
  isOpen: boolean;
  /** SUSI=6, 그 외(가/나/다)=3 */
  maxSlots: number;
}

/** 수시 모의지원 1건 (슬롯 1~6) */
export interface IMaSusiApplication {
  id: number;
  memberId: string;
  seasonId: number;
  slotNo: number;
  recruitmentUnitId: number;
  universityName: string | null;
  recruitmentName: string | null;
  admissionName: string | null;
  status: string;
  scoreSnapshot: Record<string, any> | null;
  myGrade: string | null;
  grade50Cut: string | null;
  grade70Cut: string | null;
  riskLevel: number | null;
  predictedSuccess: boolean | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 정시·모평 모의지원 1건 (가/나/다 군별 1회) */
export interface IMaJungsiApplication {
  id: number;
  memberId: string;
  seasonId: number;
  gunType: GunType;
  regularAdmissionId: number;
  /** 실제 사용한 jungsi.js_admission.year */
  targetDataYear: number;
  universityName: string | null;
  recruitmentName: string | null;
  admissionName: string | null;
  status: string;
  scoreSnapshot: Record<string, any> | null;
  convertedScore: string | null;
  standardScoreSum: number | null;
  cumulativePercentile: string | null;
  riskScore: number | null;
  minCut: string | null;
  maxCut: string | null;
  predictedSuccess: boolean | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /mock-application/my 응답 */
export interface IMyApplicationsResponse {
  season: IMaSeason;
  type: 'SUSI' | 'JUNGSI';
  maxSlots: number;
  gunTypes?: GunType[];
  applications: (IMaSusiApplication | IMaJungsiApplication)[];
}

/** 수시 모의지원 생성 요청 (인터셉터가 snake_case로 변환해 전송) */
export interface ICreateSusiApplicationRequest {
  seasonId: number;
  slotNo: number;
  recruitmentUnitId: number;
  universityName?: string;
  recruitmentName?: string;
  admissionName?: string;
  scoreSnapshot?: Record<string, any>;
  myGrade?: number;
  grade50Cut?: number;
  grade70Cut?: number;
  riskLevel?: number;
}

/** 정시·모평 모의지원 생성 요청 */
export interface ICreateJungsiApplicationRequest {
  seasonId: number;
  gunType: GunType;
  regularAdmissionId: number;
  universityName?: string;
  recruitmentName?: string;
  admissionName?: string;
  scoreSnapshot?: Record<string, any>;
  convertedScore?: number;
  standardScoreSum?: number;
  cumulativePercentile?: number;
  riskScore?: number;
  minCut?: number;
  maxCut?: number;
}

/** 도수분포 구간 */
export interface IDistributionBin {
  binStart: number;
  binEnd: number;
  count: number;
}

/** GET /mock-application/stats 응답 */
export interface IMaStats {
  open: boolean;
  /** 비로그인 점수를 저장하지 않고 계산한 미리보기인지 여부 */
  preview?: boolean;
  resultOpenAt?: string;
  /** 통계의 모집인원·충원 이력 기준 학년도 */
  dataYear?: number;
  applicantCount?: number;
  /** 순위 산출에 포함된 점수 입력 지원자 수 */
  scoredApplicantCount?: number;
  recruitmentNumber?: number | null;
  /** 지원자 수 / 모집인원 */
  competitionRatio?: number | null;
  /** 현재 사용자의 입력 점수 기준 공동 순위 */
  myRank?: number | null;
  /** 모집인원과 같은 최초합 예상 마감 순위 */
  initialPassRank?: number | null;
  /** 모집인원 + 최근 충원합격 인원을 반영한 예상 마감 순위 */
  expectedAdditionalPassRank?: number | null;
  scoreAvg?: number | null;
  scoreBest?: number | null;
  distribution?: IDistributionBin[];
}

export type MaStatsTargetType = 'SUSI_RU' | 'JUNGSI_ADM';

/** 수시 모집단위 검색 결과 (GET /mock-application/search/susi) */
export interface ISusiSearchResult {
  id: number; // susi.susi_unit.id
  universityName: string;
  recruitmentName: string;
  admissionName: string;
  recruitmentNumber: number | null;
}

/** 정시·모평 모집단위 검색 결과 (GET /mock-application/search/jungsi) */
export interface IJungsiSearchResult {
  id: number; // js_admission.id
  dataYear: number;
  universityName: string | null;
  recruitmentName: string;
  admissionName: string;
  gunType: GunType;
  recruitmentNumber: number | null;
  minCut: string | null;
  maxCut: string | null;
}
