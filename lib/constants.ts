export const INQUIRY_SUBJECT_OPTIONS = [
  { key: '생활과 윤리', label: '생활과 윤리' },
  { key: '윤리와 사상', label: '윤리와 사상' },
  { key: '한국지리', label: '한국지리' },
  { key: '세계지리', label: '세계지리' },
  { key: '동아시아사', label: '동아시아사' },
  { key: '세계사', label: '세계사' },
  { key: '정치와 법', label: '정치와 법' },
  { key: '경제', label: '경제' },
  { key: '사회문화', label: '사회문화' },
  { key: '물리Ⅰ', label: '물리Ⅰ' },
  { key: '화학Ⅰ', label: '화학Ⅰ' },
  { key: '생명과학Ⅰ', label: '생명과학Ⅰ' },
  { key: '지구과학Ⅰ', label: '지구과학Ⅰ' },
  { key: '물리Ⅱ', label: '물리Ⅱ' },
  { key: '화학Ⅱ', label: '화학Ⅱ' },
  { key: '생명과학Ⅱ', label: '생명과학Ⅱ' },
  { key: '지구과학Ⅱ', label: '지구과학Ⅱ' },
] as const;

// 전형명 옵션 (수시)
export const ADMISSION_TYPE_OPTIONS = [
  { key: '학생부교과', label: '학생부교과' },
  { key: '학생부종합', label: '학생부종합' },
  { key: '논술', label: '논술' },
  { key: '실기/실적', label: '실기/실적' },
  { key: '지역균형', label: '지역균형' },
  { key: '추천', label: '추천' },
  { key: '기타', label: '기타' },
] as const;

// 결과 표(세로형) 왼쪽 레이블 정의
export const RESULT_PANEL_SECTIONS = [
  {
    title: '수시 지원 대학',
    rows: [
      { key: 'universityName', label: '대학명' },
      { key: 'admissionType', label: '전형명' },
      { key: 'unitName', label: '모집단위' },
    ],
  },
  {
    title: '수시대학의 정시 내점수',
    rows: [
      { key: 'current_univScore', label: '대학환산점수' },
      { key: 'current_percentile', label: '누적 백분위' },
    ],
  },
  {
    title: '수시대학의 정시 작년 컷',
    rows: [
      { key: 'last_univScore', label: '대학환산점수' },
      { key: 'last_percentile', label: '누적 백분위' },
    ],
  },
  {
    title: '작년컷과의 차이',
    rows: [
      { key: 'diff_univScore', label: '대학환산점수' },
      { key: 'diff_percentile', label: '누적 백분위' },
    ],
  },
  {
    title: '예측컷',
    rows: [
      { key: 'pred_univScore', label: '대학환산점수' },
      { key: 'pred_percentile', label: '누적 백분위' },
    ],
  },
  {
    title: '예측컷과의 차이',
    rows: [
      { key: 'predDiff_univScore', label: '대학별 점수' },
      { key: 'predDiff_percentile', label: '누적 백분위' },
    ],
  },
  {
    title: '수시 응시 유불리',
    rows: [
      { key: 'advantage', label: '세부내역' },
    ],
  },
] as const;