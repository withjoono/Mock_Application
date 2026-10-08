/**
 * API 에러 코드 정의
 */

export const ERROR_CODES = {
  // 인증 관련
  TOKEN_EXPIRED: 'C401',
  INVALID_TOKEN: 'C999',
  SESSION_EXPIRED: 'C5050',
  UNAUTHORIZED: 'C401',

  // 클라이언트 에러
  BAD_REQUEST: 'C400',
  NOT_FOUND: 'C404',
  VALIDATION_ERROR: 'C422',

  // 서버 에러
  INTERNAL_SERVER_ERROR: 'C500',
  SERVICE_UNAVAILABLE: 'C503',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiError {
  success: false;
  message: string;
  detailCode?: ErrorCode;
  details?: Record<string, any>;
}

export const isApiError = (error: any): error is ApiError => {
  return error && typeof error === 'object' && 'success' in error && error.success === false;
};
