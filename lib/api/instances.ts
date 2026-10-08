/**
 * Axios 인스턴스 설정
 * - publicClient: 인증 불필요 (로그인, 회원가입 등)
 * - authClient: 인증 필요 (모든 인증된 API)
 * - springPublicClient: Spring 백엔드 공개 API
 * - springAuthClient: Spring 백엔드 인증 API
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { config } from './config';
import {
  getCachedAccessToken,
  getCachedRefreshToken,
  setAccessToken,
  setTokens,
  clearTokens,
  updateTokenCache,
  clearTokenCache,
} from './token-manager';
import { ERROR_CODES } from './error-codes';

// 로그아웃 콜백 (외부에서 주입)
let onLogout: (() => void) | null = null;

export const setLogoutHandler = (handler: () => void) => {
  onLogout = handler;
};

/**
 * Public API Client (인증 불필요) - NestJS 백엔드
 */
export const publicClient = axios.create({
  baseURL: config.apiUrlNest,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Authenticated API Client (인증 필요) - NestJS 백엔드
 */
export const authClient = axios.create({
  baseURL: config.apiUrlNest,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Hub Public API Client (인증 불필요) - Hub 백엔드 (SSO·모의지원)
 */
export const hubPublicClient = axios.create({
  baseURL: config.apiUrlHub,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Hub Authenticated API Client (인증 필요) - Hub 백엔드 (SSO·모의지원)
 */
export const hubAuthClient = axios.create({
  baseURL: config.apiUrlHub,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Spring Public API Client (인증 불필요) - Spring 백엔드
 */
export const springPublicClient = axios.create({
  baseURL: config.apiUrlSpring,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Spring Authenticated API Client (인증 필요) - Spring 백엔드
 */
export const springAuthClient = axios.create({
  baseURL: config.apiUrlSpring,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 케이스 변환 인터셉터 - Request (snake_case로 변환)
 */
const requestCaseInterceptor = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  if (config.data) {
    config.data = decamelizeKeys(config.data);
  }
  if (config.params) {
    config.params = decamelizeKeys(config.params);
  }
  return config;
};

/**
 * 케이스 변환 인터셉터 - Response (camelCase로 변환)
 */
const responseCaseInterceptor = (response: any) => {
  if (response.data && typeof response.data === 'object') {
    response.data = camelizeKeys(response.data);
  }
  return response;
};

/**
 * 케이스 변환 에러 인터셉터
 */
const responseCaseErrorInterceptor = (error: AxiosError) => {
  if (error.response?.data) {
    error.response.data = camelizeKeys(error.response.data);
  }
  return Promise.reject(error);
};

/**
 * 인증 Request 인터셉터
 */
const authRequestInterceptor = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  // 케이스 변환
  if (config.data) {
    config.data = decamelizeKeys(config.data);
  }
  if (config.params) {
    config.params = decamelizeKeys(config.params);
  }

  // Access Token 추가
  const accessToken = getCachedAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
};

/**
 * 토큰 갱신 API 호출 — Hub POST /auth/refresh
 * 주의: Hub DTO가 camelCase(refreshToken)를 기대하므로
 * decamelize 인터셉터가 없는 bare axios로 호출한다.
 */
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = getCachedRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const response = await axios.post(
      `${config.apiUrlHub}/auth/refresh`,
      { refreshToken },
      { timeout: config.timeout },
    );

    // SuccessResponseInterceptor 래핑: { success, data: { accessToken, refreshToken, ... } }
    const result = response.data?.data ?? response.data;
    if (result?.accessToken) {
      await setAccessToken(result.accessToken);
      if (result.refreshToken) {
        // 리프레시 토큰 회전(rotation) 반영
        await setTokens(result.accessToken, result.refreshToken);
        updateTokenCache(result.accessToken, result.refreshToken);
      } else {
        updateTokenCache(result.accessToken);
      }
      return result.accessToken;
    }

    return null;
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    return null;
  }
};

/**
 * 로그아웃 처리
 */
const handleLogout = async () => {
  await clearTokens();
  clearTokenCache();
  onLogout?.();
};

/**
 * 인증 에러 Response 인터셉터 (토큰 갱신 포함)
 */
const authResponseErrorInterceptor = async (error: AxiosError) => {
  const originalRequest = error.config as any;

  // 에러 응답 데이터를 camelCase로 변환
  if (error.response?.data) {
    error.response.data = camelizeKeys(error.response.data);
  }

  // 401 에러 처리
  if (error.response?.status === 401) {
    const errorData = error.response.data as any;
    const errorCode = errorData?.detailCode;

    // C401: 토큰 만료 → 갱신 시도
    if (errorCode === ERROR_CODES.TOKEN_EXPIRED && !originalRequest._retry) {
      originalRequest._retry = true;

      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        // 새 토큰으로 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios.request(originalRequest);
      } else {
        // 갱신 실패 → 로그아웃
        await handleLogout();
        return Promise.reject(error);
      }
    }

    // C999: 유효하지 않은 토큰 → 로그아웃
    if (errorCode === ERROR_CODES.INVALID_TOKEN) {
      await handleLogout();
      return Promise.reject(error);
    }

    // C5050: 세션 만료 → 로그아웃
    if (errorCode === ERROR_CODES.SESSION_EXPIRED) {
      await handleLogout();
      return Promise.reject(error);
    }
  }

  return Promise.reject(error);
};

// Public Client 인터셉터 설정
publicClient.interceptors.request.use(requestCaseInterceptor, (error) => Promise.reject(error));
publicClient.interceptors.response.use(responseCaseInterceptor, responseCaseErrorInterceptor);

// Auth Client 인터셉터 설정
authClient.interceptors.request.use(authRequestInterceptor, (error) => Promise.reject(error));
authClient.interceptors.response.use(responseCaseInterceptor, authResponseErrorInterceptor);

// Hub Public Client 인터셉터 설정
hubPublicClient.interceptors.request.use(requestCaseInterceptor, (error) => Promise.reject(error));
hubPublicClient.interceptors.response.use(responseCaseInterceptor, responseCaseErrorInterceptor);

// Hub Auth Client 인터셉터 설정
hubAuthClient.interceptors.request.use(authRequestInterceptor, (error) => Promise.reject(error));
hubAuthClient.interceptors.response.use(responseCaseInterceptor, authResponseErrorInterceptor);

// Spring Public Client 인터셉터 설정
springPublicClient.interceptors.request.use(requestCaseInterceptor, (error) => Promise.reject(error));
springPublicClient.interceptors.response.use(responseCaseInterceptor, responseCaseErrorInterceptor);

// Spring Auth Client 인터셉터 설정
springAuthClient.interceptors.request.use(authRequestInterceptor, (error) => Promise.reject(error));
springAuthClient.interceptors.response.use(responseCaseInterceptor, authResponseErrorInterceptor);
