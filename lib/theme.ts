/**
 * T모지 디자인 토큰
 *
 * 브랜드 엠블럼(브론즈)과 앱 아이콘 배경(에스프레소 블랙)에서 출발한 팔레트.
 * - 어두운 면(ink): 홈 화면, 화면 상단 헤더 — 브랜드가 드러나는 곳
 * - 밝은 면(paper/surface): 지원 카드·통계처럼 오래 읽어야 하는 곳
 * - 브론즈: 강조·선택·진행도에만 쓴다. 넓은 면적에 칠하지 않는다.
 *
 * 아래 colors 의 예전 키(primary, onPrimary, surfaceVariant …)는
 * 개발 빌드 전용 데모 화면들이 그대로 쓰고 있어 이름을 유지한다.
 */

const palette = {
  // 어두운 면
  ink: '#17130F',
  inkRaised: '#221C16',
  inkLine: 'rgba(245, 239, 230, 0.10)',
  ivory: '#F5EFE6',
  ivoryMuted: 'rgba(245, 239, 230, 0.64)',
  ivorySubtle: 'rgba(245, 239, 230, 0.40)',

  // 브론즈
  bronze: '#B8946A', // 어두운 면 위의 강조
  bronzeDeep: '#86663F', // 밝은 면 위의 강조 (흰 배경 대비 5:1 이상)
  bronzeTint: '#F4EDE3', // 선택·하이라이트 배경
  bronzeLine: '#E3D5C2',

  // 밝은 면
  paper: '#F3F2EF',
  surface: '#FFFFFF',
  line: '#E7E3DD',
  text: '#1B1712',
  textMuted: '#6E655B',
  textSubtle: '#A1988D',

  // 상태
  positive: '#2F7A57',
  positiveSoft: '#E5F1EA',
  positiveOnDark: '#7CC9A2',
  caution: '#A86E12',
  cautionSoft: '#F8EDD9',
  cautionOnDark: '#E2B565',
  negative: '#B2453A',
  negativeSoft: '#F8E6E3',
};

export const colors = {
  ...palette,

  // ── 데모 화면 호환 키 ──
  primary: palette.bronzeDeep,
  onPrimary: '#FFFFFF',
  background: palette.paper,
  surfaceVariant: palette.bronzeTint,
  outline: palette.line,
  success: palette.positive,
  error: palette.negative,
  google: '#FFFFFF',
  naver: '#03C75A',
  muted: palette.textMuted,
  disabled: '#C9C2B8',
  surfaceMuted: '#F7F6F3',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

/** 글자 크기. 한글은 자간을 살짝 좁혀야 단단해 보인다. */
export const typography = {
  display: 34,
  title: 26,
  heading: 20,
  subheading: 17,
  body: 15,
  small: 13,
  caption: 11,
};

export const tracking = {
  display: -0.8,
  title: -0.5,
  heading: -0.3,
  body: -0.1,
};

/** 숫자는 자릿수가 흔들리지 않게 고정폭 숫자로 */
export const numeric = {
  fontVariant: ['tabular-nums'] as ('tabular-nums')[],
};

export const shadow = {
  card: {
    shadowColor: '#2A1E10',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#2A1E10',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
};

const theme = {
  colors,
  spacing,
  radii,
  typography,
  tracking,
  numeric,
  shadow,
};

export default theme;
