/**
 * 모의지원 (ma_*) 커스텀 훅
 * - 시즌 목록 (시즌 기반 홈)
 * - 시즌별 내 지원 현황 (수시 6슬롯 / 정시·모평 가나다 3슬롯)
 * - 지원 제출/취소, 모집단위별 현황(경쟁률·분포)
 */

import { useState, useCallback } from 'react';
import {
  fetchSeasonsAPI,
  fetchMyApplicationsAPI,
  createSusiApplicationAPI,
  deleteSusiApplicationAPI,
  createJungsiApplicationAPI,
  deleteJungsiApplicationAPI,
  fetchStatsAPI,
  IMaSeason,
  IMyApplicationsResponse,
  ICreateSusiApplicationRequest,
  ICreateJungsiApplicationRequest,
  IMaSusiApplication,
  IMaJungsiApplication,
  IMaStats,
  MaStatsTargetType,
} from '../api/features/mock-application';

interface UseMockApplicationState {
  isLoading: boolean;
  error: string | null;
  seasons: IMaSeason[];
  myApplications: IMyApplicationsResponse | null;
}

const getErrorMessage = (e: any): string =>
  e?.response?.data?.message || e?.message || '요청에 실패했습니다.';

export const useMockApplication = () => {
  const [state, setState] = useState<UseMockApplicationState>({
    isLoading: false,
    error: null,
    seasons: [],
    myApplications: null,
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading, error: isLoading ? null : prev.error }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  /** 활성 시즌 목록 */
  const fetchSeasons = useCallback(async (): Promise<IMaSeason[]> => {
    setLoading(true);
    try {
      const seasons = await fetchSeasonsAPI();
      setState((prev) => ({ ...prev, seasons, isLoading: false }));
      return seasons;
    } catch (e) {
      setError(getErrorMessage(e));
      return [];
    }
  }, [setLoading, setError]);

  /** 시즌별 내 지원 현황 */
  const fetchMyApplications = useCallback(
    async (seasonId: number): Promise<IMyApplicationsResponse | null> => {
      setLoading(true);
      try {
        const myApplications = await fetchMyApplicationsAPI(seasonId);
        setState((prev) => ({ ...prev, myApplications, isLoading: false }));
        return myApplications;
      } catch (e) {
        setError(getErrorMessage(e));
        return null;
      }
    },
    [setLoading, setError],
  );

  /** 수시 모의지원 제출 (슬롯 1~6) */
  const submitSusiApplication = useCallback(
    async (payload: ICreateSusiApplicationRequest): Promise<IMaSusiApplication | null> => {
      setLoading(true);
      try {
        const created = await createSusiApplicationAPI(payload);
        await fetchMyApplicationsAPI(payload.seasonId).then((myApplications) =>
          setState((prev) => ({ ...prev, myApplications, isLoading: false })),
        );
        return created;
      } catch (e) {
        setError(getErrorMessage(e));
        return null;
      }
    },
    [setLoading, setError],
  );

  /** 정시·모평 모의지원 제출 (가/나/다 군별 1회) */
  const submitJungsiApplication = useCallback(
    async (payload: ICreateJungsiApplicationRequest): Promise<IMaJungsiApplication | null> => {
      setLoading(true);
      try {
        const created = await createJungsiApplicationAPI(payload);
        await fetchMyApplicationsAPI(payload.seasonId).then((myApplications) =>
          setState((prev) => ({ ...prev, myApplications, isLoading: false })),
        );
        return created;
      } catch (e) {
        setError(getErrorMessage(e));
        return null;
      }
    },
    [setLoading, setError],
  );

  /** 모의지원 취소 */
  const cancelApplication = useCallback(
    async (type: 'SUSI' | 'JUNGSI', id: number, seasonId: number): Promise<boolean> => {
      setLoading(true);
      try {
        if (type === 'SUSI') {
          await deleteSusiApplicationAPI(id);
        } else {
          await deleteJungsiApplicationAPI(id);
        }
        const myApplications = await fetchMyApplicationsAPI(seasonId);
        setState((prev) => ({ ...prev, myApplications, isLoading: false }));
        return true;
      } catch (e) {
        setError(getErrorMessage(e));
        return false;
      }
    },
    [setLoading, setError],
  );

  /** 모집단위별 지원 현황 (경쟁률·분포) */
  const fetchStats = useCallback(
    async (
      seasonId: number,
      targetType: MaStatsTargetType,
      targetId: number,
    ): Promise<IMaStats | null> => {
      try {
        return await fetchStatsAPI(seasonId, targetType, targetId);
      } catch (e) {
        setError(getErrorMessage(e));
        return null;
      }
    },
    [setError],
  );

  const clearError = useCallback(() => setError(null), [setError]);

  return {
    ...state,
    fetchSeasons,
    fetchMyApplications,
    submitSusiApplication,
    submitJungsiApplication,
    cancelApplication,
    fetchStats,
    clearError,
  };
};
