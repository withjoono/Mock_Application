/**
 * Hub 인증 API — 모의지원앱은 Hub를 토큰 발급자로 직접 사용
 * (별도 백엔드가 없으므로 위성앱 SSO 교환 대신 Hub 로그인 API 직행)
 */

import { hubPublicClient, hubAuthClient } from '../../instances';
import {
  setTokens,
  clearTokens,
  updateTokenCache,
  clearTokenCache,
} from '../../token-manager';
import { IApiResponse, ILoginResponse, IHubMember } from './interfaces';

/** 이메일 로그인 — 성공 시 토큰을 저장소+캐시에 반영 */
export const loginWithEmailAPI = async (
  email: string,
  password: string,
): Promise<ILoginResponse> => {
  const response = await hubPublicClient.post<IApiResponse<ILoginResponse>>(
    '/auth/login/email',
    { email, password },
  );
  const result = response.data.data;
  await setTokens(result.accessToken, result.refreshToken);
  updateTokenCache(result.accessToken, result.refreshToken);
  return result;
};

/** 내 정보 조회 (토큰 검증 겸용) */
export const fetchMeAPI = async (): Promise<IHubMember> => {
  const response = await hubAuthClient.get<IApiResponse<IHubMember>>('/auth/me');
  return response.data.data;
};

/** 로그아웃 — 서버 토큰 무효화 + 로컬 토큰 제거 */
export const logoutAPI = async (): Promise<void> => {
  try {
    await hubAuthClient.post('/auth/logout');
  } catch {
    // 서버 로그아웃 실패해도 로컬 토큰은 제거
  } finally {
    await clearTokens();
    clearTokenCache();
  }
};

/**
 * 회원 탈퇴 — 개인정보 익명화 + 계정 정지 + 모의지원 데이터 삭제 (복구 불가)
 * 성공 시 로컬 토큰도 제거
 */
export const withdrawAccountAPI = async (): Promise<void> => {
  await hubAuthClient.delete('/account/me');
  await clearTokens();
  clearTokenCache();
};
