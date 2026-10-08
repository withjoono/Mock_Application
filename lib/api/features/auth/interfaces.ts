/**
 * Hub 인증 API 타입 (/auth/*)
 */

export interface IApiResponse<T> {
  success: boolean;
  data: T;
}

/** POST /auth/login/email, /auth/refresh 응답 */
export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
  activeServices?: string[];
}

/** GET /auth/me 응답 (hub.auth_member, humps로 camelCase 변환) */
export interface IHubMember {
  id: string;
  email: string;
  name: string | null;
  nickname: string | null;
  phone: string;
  roleType: string;
  memberType: string;
  profileImageUrl: string | null;
  providerType: string | null;
}
