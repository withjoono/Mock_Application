import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { initializeTokenCache, getCachedAccessToken, setLogoutHandler } from '../api';
import {
  loginWithEmailAPI,
  fetchMeAPI,
  logoutAPI,
  withdrawAccountAPI,
  IHubMember,
} from '../api/features/auth';

interface AuthContextType {
  user: IHubMember | null;
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** 이메일 로그인 — 실패 시 에러 메시지 반환, 성공 시 null */
  loginWithEmail: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  /** 회원 탈퇴 (복구 불가) — 실패 시 에러 메시지 반환, 성공 시 null */
  withdrawAccount: () => Promise<string | null>;
  /** 토큰이 있을 때 내 정보 재조회 */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IHubMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getCachedAccessToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await fetchMeAPI();
      setUser(me);
    } catch {
      // 토큰 만료 등 — 인터셉터가 갱신/로그아웃 처리
      setUser(null);
    }
  }, []);

  // 앱 시작: AsyncStorage 토큰 복원 → 세션 검증
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initializeTokenCache();
        if (getCachedAccessToken()) {
          try {
            const me = await fetchMeAPI();
            if (mounted) setUser(me);
          } catch {
            if (mounted) setUser(null);
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    // 인터셉터의 강제 로그아웃(토큰 갱신 실패 등) 시 상태 동기화
    setLogoutHandler(() => setUser(null));

    return () => {
      mounted = false;
    };
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      try {
        await loginWithEmailAPI(email.trim(), password);
        const me = await fetchMeAPI();
        setUser(me);
        return null;
      } catch (e: any) {
        const message =
          e?.response?.data?.message ||
          (e?.response?.status === 401
            ? '이메일 또는 비밀번호가 일치하지 않습니다.'
            : '로그인에 실패했습니다. 네트워크를 확인해주세요.');
        return Array.isArray(message) ? message.join('\n') : String(message);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutAPI();
    setUser(null);
  }, []);

  const withdrawAccount = useCallback(async (): Promise<string | null> => {
    try {
      await withdrawAccountAPI();
      setUser(null);
      return null;
    } catch (e: any) {
      return (
        e?.response?.data?.message || '탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.'
      );
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.id || null,
        isLoading,
        isAuthenticated: !!user,
        loginWithEmail,
        logout,
        withdrawAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
