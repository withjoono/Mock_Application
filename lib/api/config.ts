/**
 * API 환경 설정
 * 개발/프로덕션 환경 설정
 */

import Constants from 'expo-constants';

const ENV = {
  development: {
    apiUrlNest: 'http://localhost:3001',
    apiUrlSpring: 'http://localhost:8080',
    apiUrlHub: 'http://localhost:4000', // Hub-Backend (SSO·모의지원 ma_*)
  },
  staging: {
    apiUrlNest: 'https://staging-api.example.com',
    apiUrlSpring: 'https://staging-spring.example.com',
    apiUrlHub: 'https://ts-back-nest-479305.du.r.appspot.com',
  },
  production: {
    apiUrlNest: 'https://api.example.com',
    apiUrlSpring: 'https://spring.example.com',
    apiUrlHub: 'https://ts-back-nest-479305.du.r.appspot.com',
  },
};

type Environment = 'development' | 'staging' | 'production';

const getEnvironment = (): Environment => {
  // EAS 빌드 프로필의 env(EXPO_PUBLIC_ENV) 우선, 레거시 releaseChannel 폴백
  const envVar = process.env.EXPO_PUBLIC_ENV;
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;
  const channel = envVar || releaseChannel;

  if (channel === 'production') return 'production';
  if (channel === 'staging') return 'staging';
  return 'development';
};

export const env = ENV[getEnvironment()];

export const config = {
  ...env,
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
};
