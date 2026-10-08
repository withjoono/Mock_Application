/**
 * 토큰 관리 모듈 (React Native)
 * expo-secure-store(Keychain/Keystore)를 사용한 토큰 저장/조회
 * - 웹(react-native-web)에서는 SecureStore 미지원 → AsyncStorage 폴백
 * - 기존 AsyncStorage 토큰은 최초 1회 SecureStore로 마이그레이션
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const isSecureStoreAvailable = Platform.OS !== 'web';

// ── 저장소 추상화 ──────────────────────────────────────────

const storageGet = async (key: string): Promise<string | null> => {
  if (isSecureStoreAvailable) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
};

const storageSet = async (key: string, value: string): Promise<void> => {
  if (isSecureStoreAvailable) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
};

const storageRemove = async (key: string): Promise<void> => {
  if (isSecureStoreAvailable) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(key);
};

/** 구버전 AsyncStorage 토큰 → SecureStore 1회 마이그레이션 */
const migrateLegacyTokens = async (): Promise<void> => {
  if (!isSecureStoreAvailable) return;
  try {
    const [legacyAccess, legacyRefresh] = await Promise.all([
      AsyncStorage.getItem(ACCESS_TOKEN_KEY),
      AsyncStorage.getItem(REFRESH_TOKEN_KEY),
    ]);
    if (legacyAccess || legacyRefresh) {
      const [secureAccess, secureRefresh] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      ]);
      // SecureStore가 비어 있을 때만 이전 (이미 있으면 신뢰)
      if (!secureAccess && legacyAccess) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, legacyAccess);
      }
      if (!secureRefresh && legacyRefresh) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, legacyRefresh);
      }
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    }
  } catch (error) {
    console.error('토큰 마이그레이션 실패:', error);
  }
};

// ── 공개 API (기존 시그니처 유지) ──────────────────────────

/**
 * Access Token 조회
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await storageGet(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Access Token 조회 실패:', error);
    return null;
  }
};

/**
 * Refresh Token 조회
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await storageGet(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Refresh Token 조회 실패:', error);
    return null;
  }
};

/**
 * 토큰 저장
 */
export const setTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  try {
    await Promise.all([
      storageSet(ACCESS_TOKEN_KEY, accessToken),
      storageSet(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  } catch (error) {
    console.error('토큰 저장 실패:', error);
    throw error;
  }
};

/**
 * Access Token만 업데이트 (토큰 갱신 시)
 */
export const setAccessToken = async (accessToken: string): Promise<void> => {
  try {
    await storageSet(ACCESS_TOKEN_KEY, accessToken);
  } catch (error) {
    console.error('Access Token 저장 실패:', error);
    throw error;
  }
};

/**
 * 토큰 삭제 (로그아웃 시)
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await Promise.all([
      storageRemove(ACCESS_TOKEN_KEY),
      storageRemove(REFRESH_TOKEN_KEY),
    ]);
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
    throw error;
  }
};

/**
 * 토큰 존재 여부 확인
 */
export const hasTokens = async (): Promise<boolean> => {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  return !!accessToken && !!refreshToken;
};

/**
 * Access Token 존재 여부 확인
 */
export const hasAccessToken = async (): Promise<boolean> => {
  const accessToken = await getAccessToken();
  return !!accessToken;
};

/**
 * 동기적 토큰 캐시 (인터셉터용)
 * 비동기 저장소를 동기적으로 사용하기 위한 메모리 캐시
 */
let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

/**
 * 토큰 캐시 초기화 (앱 시작 시 호출)
 */
export const initializeTokenCache = async (): Promise<void> => {
  await migrateLegacyTokens();
  cachedAccessToken = await getAccessToken();
  cachedRefreshToken = await getRefreshToken();
};

/**
 * 캐시된 Access Token 조회 (동기)
 */
export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * 캐시된 Refresh Token 조회 (동기)
 */
export const getCachedRefreshToken = (): string | null => {
  return cachedRefreshToken;
};

/**
 * 캐시 업데이트 (토큰 저장/갱신 시 호출)
 */
export const updateTokenCache = (accessToken: string | null, refreshToken?: string | null): void => {
  cachedAccessToken = accessToken;
  if (refreshToken !== undefined) {
    cachedRefreshToken = refreshToken;
  }
};

/**
 * 캐시 초기화 (로그아웃 시 호출)
 */
export const clearTokenCache = (): void => {
  cachedAccessToken = null;
  cachedRefreshToken = null;
};
