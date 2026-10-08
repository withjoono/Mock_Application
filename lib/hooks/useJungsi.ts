/**
 * 정시 관련 커스텀 훅
 * API 호출 및 상태 관리
 */

import { useState, useCallback } from 'react';
import {
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
  fetchRecentCalculationAPI,
  IMockExamScoreInput,
  IRawScoreInput,
  IStandardScoreInput,
  ICalculateScoresResponse,
  ISavedScore,
  ISaveScoreRequest,
  IUniversityInfo,
  IUniversityFilter,
} from '../api/features/jungsi';

interface UseJungsiState {
  isLoading: boolean;
  error: string | null;
  calculationResult: ICalculateScoresResponse | null;
  savedScores: ISavedScore[];
  universities: IUniversityInfo[];
}

interface UseJungsiReturn extends UseJungsiState {
  // 점수 계산
  calculateScores: (scores: IMockExamScoreInput[], universityIds?: number[]) => Promise<ICalculateScoresResponse | null>;
  calculateWithRawScore: (rawScore: IRawScoreInput, universityIds?: number[]) => Promise<ICalculateScoresResponse | null>;
  calculateWithStandardScore: (standardScore: IStandardScoreInput, universityIds?: number[]) => Promise<ICalculateScoresResponse | null>;

  // 점수 저장/조회
  fetchSavedScores: () => Promise<ISavedScore[]>;
  fetchScoreById: (scoreId: number) => Promise<ISavedScore | null>;
  saveScore: (scoreData: ISaveScoreRequest) => Promise<ISavedScore | null>;
  updateScore: (scoreId: number, scoreData: Partial<ISaveScoreRequest>) => Promise<ISavedScore | null>;
  deleteScore: (scoreId: number) => Promise<boolean>;

  // 재계산
  recalculateScores: (scoreId: number, universityIds?: number[]) => Promise<ICalculateScoresResponse | null>;

  // 대학 조회
  fetchUniversities: (filter?: IUniversityFilter) => Promise<IUniversityInfo[]>;

  // 최근 계산 결과
  fetchRecentCalculation: () => Promise<ICalculateScoresResponse | null>;

  // 에러 초기화
  clearError: () => void;

  // 결과 초기화
  clearCalculationResult: () => void;
}

export const useJungsi = (): UseJungsiReturn => {
  const [state, setState] = useState<UseJungsiState>({
    isLoading: false,
    error: null,
    calculationResult: null,
    savedScores: [],
    universities: [],
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading, error: isLoading ? null : prev.error }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearCalculationResult = useCallback(() => {
    setState(prev => ({ ...prev, calculationResult: null }));
  }, []);

  // 점수 계산 (표준점수 배열)
  const calculateScores = useCallback(async (
    scores: IMockExamScoreInput[],
    universityIds?: number[],
  ): Promise<ICalculateScoresResponse | null> => {
    try {
      setLoading(true);
      const result = await calculateScoresAPI(scores, universityIds);
      setState(prev => ({ ...prev, calculationResult: result, isLoading: false }));
      return result;
    } catch (error: any) {
      setError(error.response?.data?.message || '점수 계산에 실패했습니다.');
      return null;
    }
  }, [setLoading, setError]);

  // 원점수로 계산
  const calculateWithRawScore = useCallback(async (
    rawScore: IRawScoreInput,
    universityIds?: number[],
  ): Promise<ICalculateScoresResponse | null> => {
    try {
      setLoading(true);
      const result = await calculateWithRawScoreAPI(rawScore, universityIds);
      setState(prev => ({ ...prev, calculationResult: result, isLoading: false }));
      return result;
    } catch (error: any) {
      setError(error.response?.data?.message || '점수 계산에 실패했습니다.');
      return null;
    }
  }, [setLoading, setError]);

  // 표준점수로 계산
  const calculateWithStandardScore = useCallback(async (
    standardScore: IStandardScoreInput,
    universityIds?: number[],
  ): Promise<ICalculateScoresResponse | null> => {
    try {
      setLoading(true);
      const result = await calculateWithStandardScoreAPI(standardScore, universityIds);
      setState(prev => ({ ...prev, calculationResult: result, isLoading: false }));
      return result;
    } catch (error: any) {
      setError(error.response?.data?.message || '점수 계산에 실패했습니다.');
      return null;
    }
  }, [setLoading, setError]);

  // 저장된 점수 목록 조회
  const fetchSavedScores = useCallback(async (): Promise<ISavedScore[]> => {
    try {
      setLoading(true);
      const result = await fetchSavedScoresAPI();
      setState(prev => ({ ...prev, savedScores: result.scores, isLoading: false }));
      return result.scores;
    } catch (error: any) {
      setError(error.response?.data?.message || '저장된 점수 조회에 실패했습니다.');
      return [];
    }
  }, [setLoading, setError]);

  // 특정 점수 조회
  const fetchScoreById = useCallback(async (scoreId: number): Promise<ISavedScore | null> => {
    try {
      setLoading(true);
      const result = await fetchScoreByIdAPI(scoreId);
      setLoading(false);
      return result;
    } catch (error: any) {
      setError(error.response?.data?.message || '점수 조회에 실패했습니다.');
      return null;
    }
  }, [setLoading, setError]);

  // 점수 저장
  const saveScore = useCallback(async (scoreData: ISaveScoreRequest): Promise<ISavedScore | null> => {
    try {
      setLoading(true);
      const result = await saveScoreAPI(scoreData);
      setState(prev => ({
        ...prev,
        savedScores: [...prev.savedScores, result],
        isLoading: false,
      }));
      return result;
    } catch (error: any) {
      setError(error.response?.data?.message || '점수 저장에 실패했습니다.');
      return null;
    }
  }, [setLoading, setError]);

  // 점수 수정
  const updateScore = useCallback(async (
    scoreId: number,
    scoreData: Partial<ISaveScoreRequest>,
  ): Promise<ISavedScore | null> => {
    try {
      setLoading(true);
      const result = await updateScoreAPI(scoreId, scoreData);
      setState(prev => ({
        ...prev,
        savedScores: prev.savedScores.map(s => s.id === scoreId ? result : s),
        isLoading: false,
      }));
      return result;
    } catch (error: any) {
      setError(error.response?.data?.message || '점수 수정에 실패했습니다.');
      return null;
    }
  }, [setLoading, setError]);

  // 점수 삭제
  const deleteScore = useCallback(async (scoreId: number): Promise<boolean> => {
    try {
      setLoading(true);
      await deleteScoreAPI(scoreId);
      setState(prev => ({
        ...prev,
        savedScores: prev.savedScores.filter(s => s.id !== scoreId),
        isLoading: false,
      }));
      return true;
    } catch (error: any) {
      setError(error.response?.data?.message || '점수 삭제에 실패했습니다.');
      return false;
    }
  }, [setLoading, setError]);

  // 재계산
  const recalculateScores = useCallback(async (
    scoreId: number,
    universityIds?: number[],
  ): Promise<ICalculateScoresResponse | null> => {
    try {
      setLoading(true);
      const result = await recalculateScoresAPI(scoreId, universityIds);
      setState(prev => ({ ...prev, calculationResult: result, isLoading: false }));
      return result;
    } catch (error: any) {
      setError(error.response?.data?.message || '재계산에 실패했습니다.');
      return null;
    }
  }, [setLoading, setError]);

  // 대학 목록 조회
  const fetchUniversities = useCallback(async (
    filter?: IUniversityFilter,
  ): Promise<IUniversityInfo[]> => {
    try {
      setLoading(true);
      const result = await fetchUniversitiesAPI(filter);
      setState(prev => ({ ...prev, universities: result, isLoading: false }));
      return result;
    } catch (error: any) {
      setError(error.response?.data?.message || '대학 목록 조회에 실패했습니다.');
      return [];
    }
  }, [setLoading, setError]);

  // 최근 계산 결과 조회
  const fetchRecentCalculation = useCallback(async (): Promise<ICalculateScoresResponse | null> => {
    try {
      setLoading(true);
      const result = await fetchRecentCalculationAPI();
      if (result) {
        setState(prev => ({ ...prev, calculationResult: result, isLoading: false }));
      } else {
        setLoading(false);
      }
      return result;
    } catch (error: any) {
      setError(error.response?.data?.message || '최근 계산 결과 조회에 실패했습니다.');
      return null;
    }
  }, [setLoading, setError]);

  return {
    ...state,
    calculateScores,
    calculateWithRawScore,
    calculateWithStandardScore,
    fetchSavedScores,
    fetchScoreById,
    saveScore,
    updateScore,
    deleteScore,
    recalculateScores,
    fetchUniversities,
    fetchRecentCalculation,
    clearError,
    clearCalculationResult,
  };
};

export default useJungsi;
