/**
 * 모의지원 (ma_*) API 함수 — Hub-Backend /mock-application/*
 * 비즈니스 규칙: 수시 시즌당 6회(슬롯 1~6), 정시·6/9월 모평 가/나/다 군별 1회(총 3회)
 */

import { hubAuthClient } from '../../instances';
import {
  IApiResponse,
  IMaSeason,
  IMaSusiApplication,
  IMaJungsiApplication,
  IMyApplicationsResponse,
  ICreateSusiApplicationRequest,
  ICreateJungsiApplicationRequest,
  IMaStats,
  MaStatsTargetType,
  ISusiSearchResult,
  IJungsiSearchResult,
  GunType,
} from './interfaces';

/** 활성 시즌 목록 (홈 시즌 카드) */
export const fetchSeasonsAPI = async (): Promise<IMaSeason[]> => {
  const response = await hubAuthClient.get<IApiResponse<IMaSeason[]>>(
    '/mock-application/seasons',
  );
  return response.data.data;
};

/** 내 모의지원 현황 (시즌별) */
export const fetchMyApplicationsAPI = async (
  seasonId: number,
): Promise<IMyApplicationsResponse> => {
  const response = await hubAuthClient.get<IApiResponse<IMyApplicationsResponse>>(
    '/mock-application/my',
    { params: { seasonId } },
  );
  return response.data.data;
};

/** 수시 모의지원 제출 */
export const createSusiApplicationAPI = async (
  payload: ICreateSusiApplicationRequest,
): Promise<IMaSusiApplication> => {
  const response = await hubAuthClient.post<IApiResponse<IMaSusiApplication>>(
    '/mock-application/susi',
    payload,
  );
  return response.data.data;
};

/** 수시 모의지원 취소 */
export const deleteSusiApplicationAPI = async (id: number): Promise<void> => {
  await hubAuthClient.delete(`/mock-application/susi/${id}`);
};

/** 정시·모평 모의지원 제출 */
export const createJungsiApplicationAPI = async (
  payload: ICreateJungsiApplicationRequest,
): Promise<IMaJungsiApplication> => {
  const response = await hubAuthClient.post<IApiResponse<IMaJungsiApplication>>(
    '/mock-application/jungsi',
    payload,
  );
  return response.data.data;
};

/** 정시·모평 모의지원 취소 */
export const deleteJungsiApplicationAPI = async (id: number): Promise<void> => {
  await hubAuthClient.delete(`/mock-application/jungsi/${id}`);
};

/** 수시 모집단위 검색 */
export const searchSusiTargetsAPI = async (
  keyword: string,
): Promise<ISusiSearchResult[]> => {
  const response = await hubAuthClient.get<IApiResponse<ISusiSearchResult[]>>(
    '/mock-application/search/susi',
    { params: { keyword } },
  );
  return response.data.data;
};

/** 정시·모평 모집단위 검색 (군 필터 가능) */
export const searchJungsiTargetsAPI = async (
  keyword: string,
  seasonId: number,
  gunType?: GunType,
): Promise<IJungsiSearchResult[]> => {
  const response = await hubAuthClient.get<IApiResponse<IJungsiSearchResult[]>>(
    '/mock-application/search/jungsi',
    { params: gunType ? { keyword, seasonId, gunType } : { keyword, seasonId } },
  );
  return response.data.data;
};

/** 모집단위별 지원 현황 (경쟁률·분포) */
export const fetchStatsAPI = async (
  seasonId: number,
  targetType: MaStatsTargetType,
  targetId: number,
): Promise<IMaStats> => {
  const response = await hubAuthClient.get<IApiResponse<IMaStats>>(
    '/mock-application/stats',
    { params: { seasonId, targetType, targetId } },
  );
  return response.data.data;
};
