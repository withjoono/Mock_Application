/**
 * 정시 관련 API 함수
 * 웹앱과 동일한 API 구조 유지
 */

import { authClient } from '../../instances';
import {
  IMockExamScoreInput,
  ICalculateScoresResponse,
  ISavedScore,
  ISaveScoreRequest,
  IScoresListResponse,
  IApiResponse,
  IUniversityFilter,
  IUniversityInfo,
  IRawScoreInput,
  IStandardScoreInput,
} from './interfaces';

/**
 * 점수 계산 API
 * @param mockExamScores 수능 성적 입력 배열
 * @param universityIds 선택한 대학 ID 목록 (선택사항)
 */
export const calculateScoresAPI = async (
  mockExamScores: IMockExamScoreInput[],
  universityIds?: number[],
): Promise<ICalculateScoresResponse> => {
  const response = await authClient.post<IApiResponse<ICalculateScoresResponse>>(
    '/jungsi/calculate',
    { mockExamScores, universityIds },
  );
  return response.data.data;
};

/**
 * 원점수로 계산 API
 * @param rawScore 원점수 입력
 * @param universityIds 선택한 대학 ID 목록 (선택사항)
 */
export const calculateWithRawScoreAPI = async (
  rawScore: IRawScoreInput,
  universityIds?: number[],
): Promise<ICalculateScoresResponse> => {
  const response = await authClient.post<IApiResponse<ICalculateScoresResponse>>(
    '/jungsi/calculate/raw',
    { ...rawScore, universityIds },
  );
  return response.data.data;
};

/**
 * 표준점수로 계산 API
 * @param standardScore 표준점수 입력
 * @param universityIds 선택한 대학 ID 목록 (선택사항)
 */
export const calculateWithStandardScoreAPI = async (
  standardScore: IStandardScoreInput,
  universityIds?: number[],
): Promise<ICalculateScoresResponse> => {
  const response = await authClient.post<IApiResponse<ICalculateScoresResponse>>(
    '/jungsi/calculate/standard',
    { ...standardScore, universityIds },
  );
  return response.data.data;
};

/**
 * 저장된 점수 조회 API
 */
export const fetchSavedScoresAPI = async (): Promise<IScoresListResponse> => {
  const response = await authClient.get<IApiResponse<IScoresListResponse>>('/jungsi/scores');
  return response.data.data;
};

/**
 * 특정 점수 조회 API
 * @param scoreId 점수 ID
 */
export const fetchScoreByIdAPI = async (scoreId: number): Promise<ISavedScore> => {
  const response = await authClient.get<IApiResponse<ISavedScore>>(`/jungsi/scores/${scoreId}`);
  return response.data.data;
};

/**
 * 점수 저장 API
 * @param scoreData 점수 데이터
 */
export const saveScoreAPI = async (scoreData: ISaveScoreRequest): Promise<ISavedScore> => {
  const response = await authClient.post<IApiResponse<ISavedScore>>('/jungsi/scores', scoreData);
  return response.data.data;
};

/**
 * 점수 수정 API
 * @param scoreId 점수 ID
 * @param scoreData 점수 데이터
 */
export const updateScoreAPI = async (
  scoreId: number,
  scoreData: Partial<ISaveScoreRequest>,
): Promise<ISavedScore> => {
  const response = await authClient.patch<IApiResponse<ISavedScore>>(
    `/jungsi/scores/${scoreId}`,
    scoreData,
  );
  return response.data.data;
};

/**
 * 점수 삭제 API
 * @param scoreId 점수 ID
 */
export const deleteScoreAPI = async (scoreId: number): Promise<void> => {
  await authClient.delete(`/jungsi/scores/${scoreId}`);
};

/**
 * 재계산 API (저장된 점수로 다시 계산)
 * @param scoreId 점수 ID
 * @param universityIds 선택한 대학 ID 목록 (선택사항)
 */
export const recalculateScoresAPI = async (
  scoreId: number,
  universityIds?: number[],
): Promise<ICalculateScoresResponse> => {
  const response = await authClient.post<IApiResponse<ICalculateScoresResponse>>(
    `/jungsi/recalculate/${scoreId}`,
    { universityIds },
  );
  return response.data.data;
};

/**
 * 대학 목록 조회 API
 * @param filter 필터 옵션
 */
export const fetchUniversitiesAPI = async (
  filter?: IUniversityFilter,
): Promise<IUniversityInfo[]> => {
  const response = await authClient.get<IApiResponse<IUniversityInfo[]>>('/jungsi/universities', {
    params: filter,
  });
  return response.data.data;
};

/**
 * 대학 상세 정보 조회 API
 * @param universityId 대학 ID
 */
export const fetchUniversityDetailAPI = async (
  universityId: number,
): Promise<IUniversityInfo> => {
  const response = await authClient.get<IApiResponse<IUniversityInfo>>(
    `/jungsi/universities/${universityId}`,
  );
  return response.data.data;
};

/**
 * 최근 계산 결과 조회 API
 */
export const fetchRecentCalculationAPI = async (): Promise<ICalculateScoresResponse | null> => {
  try {
    const response = await authClient.get<IApiResponse<ICalculateScoresResponse>>(
      '/jungsi/calculation/recent',
    );
    return response.data.data;
  } catch (error) {
    return null;
  }
};

/**
 * 계산 결과 저장 API
 * @param calculationResult 계산 결과
 */
export const saveCalculationResultAPI = async (
  calculationResult: ICalculateScoresResponse,
): Promise<void> => {
  await authClient.post('/jungsi/calculation/save', calculationResult);
};
