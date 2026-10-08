/**
 * 정시 API 모듈 진입점
 */

// API 함수
export {
  calculateScoresAPI,
  calculateWithRawScoreAPI,
  calculateWithStandardScoreAPI,
  fetchSavedScoresAPI,
  fetchScoreByIdAPI,
  saveScoreAPI,
  updateScoreAPI,
  deleteScoreAPI,
  recalculateScoresAPI,
  fetchUniversitiesAPI,
  fetchUniversityDetailAPI,
  fetchRecentCalculationAPI,
  saveCalculationResultAPI,
} from './apis';

// 인터페이스
export type {
  SubjectCategory,
  IMockExamScoreInput,
  IRawScoreInput,
  IStandardScoreInput,
  IUniversityCalculatedScore,
  ICalculateScoresResponse,
  ISavedScore,
  ISaveScoreRequest,
  IMockApplicationResult,
  IApiResponse,
  IScoresListResponse,
  IUniversityFilter,
  IUniversityInfo,
  IDepartmentInfo,
} from './interfaces';
