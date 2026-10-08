# ma_* 테이블 스키마 설계안 — 모의지원앱 (MockApplication)

> 작성일: 2026-06-05
> 참조: Hub-Backend `schema.prisma`, Susi(`ss_*`/susi 스키마), Jungsi(`js_*`/jungsi 스키마)
> 전제: Cloud SQL `geobukschool_prod` 단일 DB, PostgreSQL 스키마 격리, Prisma multiSchema

> ## ⚠️ 구현 노트 (2026-06-05 실제 구현 시 변경된 사항)
>
> 실제 구현(Hub-Backend `schema.prisma` + `prisma/migrations/20260605000003_create_mock_application_tables` + `src/modules/mock-application/`)은 아래 두 가지가 본문 설계와 다름:
>
> 1. **스키마 위치**: 신규 `mock_application` 스키마 대신 **`hub` 스키마**에 ma_* 테이블 생성. Hub-Backend의 datasource가 `schemas = ["hub"]` 단일 구성이고, susi_* 테이블도 hub 스키마에 두는 기존 패턴을 따름.
> 2. **member_id 타입**: `BIGINT`가 아니라 **`VARCHAR(30)`** — `hub.auth_member.id`가 문자열 PK임.
> 3. **취소 정책**: 소프트 삭제 대신 **물리 삭제**(슬롯 재사용 단순화, UNIQUE 제약 유지).
>
> API: Hub-Backend `/mock-application/*` (전역 JwtAuthGuard, req.memberId 사용)

---

## 1. 설계 원칙

1. **인증은 Hub 공유** — 사용자는 `hub.auth_member.id`(BIGINT)로 식별. SSO JWT의 member_id 사용. 위성앱 패턴에 따라 cross-schema 하드 FK는 걸지 않고 ID 참조 + 인덱스만 둔다.
2. **대학/모집단위 데이터는 재사용** — 수시는 `susi.ss_recruitment_unit`, 정시·모평은 `jungsi.js_admission`을 ID로 참조. 모평 점수는 `jungsi.js_pyunggawon_*`(또는 모고앱 연동) 데이터를 지원 시점에 **스냅샷**으로 복사 저장.
3. **회수 제한은 DB 제약으로 강제** — Susi/Jungsi 기존 테이블엔 군별·회수 제한이 DB에 없어 앱 로직에만 의존했음. ma_*는 UNIQUE 제약으로 구조적으로 보장:
   - 수시 6회 → `UNIQUE(member_id, season_id, slot_no)` + `CHECK (slot_no BETWEEN 1 AND 6)`
   - 정시/모평 가·나·다 3회 → `UNIQUE(member_id, season_id, gun_type)`
4. **시즌 기반 UI** — `ma_season`이 단일 진실. 앱은 현재 활성 시즌을 조회해 해당 모의지원 화면만 노출.
5. **신규 PostgreSQL 스키마 `mock_application`** — susi/jungsi 패턴과 동일하게 앱 전용 스키마에 `ma_` 접두사 테이블.

---

## 2. 테이블 구성 (4개)

```
ma_season                 시즌 마스터 (6월모평 / 9월모평 / 수시 / 정시)
ma_susi_application       수시 모의지원 (시즌당 6회)
ma_jungsi_application     정시·모평 모의지원 (시즌당 가/나/다 각 1회 = 3회)
ma_application_stats      모집단위별 지원 현황 집계 캐시 (경쟁률·분포)
```

모평(6/9월)과 정시는 **같은 구조**(가/나/다 군, js_admission 참조, 환산점수 기반)이므로 `ma_jungsi_application` 하나로 통합하고 시즌으로 구분한다.

---

## 3. DDL

### 3.1 ma_season — 시즌 마스터

```sql
CREATE SCHEMA IF NOT EXISTS mock_application;

CREATE TABLE mock_application.ma_season (
  id              SERIAL PRIMARY KEY,
  year            INT          NOT NULL,                -- 학년도 (예: 2027)
  season_type     VARCHAR(20)  NOT NULL,                -- 'MOCK_JUNE' | 'MOCK_SEPT' | 'SUSI' | 'JUNGSI'
  title           VARCHAR(100) NOT NULL,                -- '2027학년도 6월 모의평가 모의지원'
  open_at         TIMESTAMP(6) NOT NULL,                -- 지원 시작
  close_at        TIMESTAMP(6) NOT NULL,                -- 지원 마감
  result_open_at  TIMESTAMP(6),                         -- 현황/결과 공개 시점 (NULL이면 실시간 공개)
  is_active       BOOLEAN      NOT NULL DEFAULT false,  -- 앱 노출 여부
  created_at      TIMESTAMP(6) NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP(6) NOT NULL DEFAULT now(),
  CONSTRAINT uq_ma_season UNIQUE (year, season_type),
  CONSTRAINT ck_ma_season_type CHECK (season_type IN ('MOCK_JUNE','MOCK_SEPT','SUSI','JUNGSI'))
);
```

* 시즌 기반 UI: 앱 홈은 `is_active = true AND now() BETWEEN open_at AND close_at`인 시즌을 조회해 진입 카드를 활성화. 연중 달력: 6월모평(6월) → 9월모평(9월) → 수시(9~10월) → 정시(12~1월).

### 3.2 ma_susi_application — 수시 모의지원 (6회)

```sql
CREATE TABLE mock_application.ma_susi_application (
  id                   SERIAL PRIMARY KEY,
  member_id            BIGINT       NOT NULL,            -- hub.auth_member.id (느슨한 참조)
  season_id            INT          NOT NULL REFERENCES mock_application.ma_season(id),
  slot_no              SMALLINT     NOT NULL,            -- 1~6 (원서 슬롯)
  recruitment_unit_id  INT          NOT NULL,            -- susi.ss_recruitment_unit.id (느슨한 참조)
  status               VARCHAR(20)  NOT NULL DEFAULT 'submitted',  -- 'draft' | 'submitted' | 'cancelled'
  score_snapshot       JSONB,                            -- 지원 시점 내신/전형 평가 스냅샷
  my_grade             DECIMAL(5,2),                     -- 내 환산 내신 등급
  grade_50_cut         DECIMAL(10,5),                    -- 전년 50% 컷 (ss_recruitment_unit_score 복사)
  grade_70_cut         DECIMAL(10,5),                    -- 전년 70% 컷
  risk_level           INT,                              -- -5 ~ +5 (Susi risk 체계와 동일)
  predicted_success    BOOLEAN,                          -- 합격 예측
  submitted_at         TIMESTAMP(6),
  created_at           TIMESTAMP(6) NOT NULL DEFAULT now(),
  updated_at           TIMESTAMP(6) NOT NULL DEFAULT now(),
  CONSTRAINT ck_ma_susi_slot CHECK (slot_no BETWEEN 1 AND 6),               -- ★ 6회 제한
  CONSTRAINT uq_ma_susi_slot UNIQUE (member_id, season_id, slot_no),        -- ★ 슬롯당 1건
  CONSTRAINT uq_ma_susi_ru   UNIQUE (member_id, season_id, recruitment_unit_id)  -- 같은 모집단위 중복 방지
);

CREATE INDEX ix_ma_susi_target ON mock_application.ma_susi_application (season_id, recruitment_unit_id);
CREATE INDEX ix_ma_susi_member ON mock_application.ma_susi_application (member_id, season_id);
```

* `score_snapshot` 예: `{ "avg_grade_all": 2.31, "avg_grade_gyss": 2.10, "min_grade_pass": true, "source": "sgb" }` — 생기부(`sgb_*`) 기반 평가치를 지원 시점에 고정.
* Susi의 DTO(`ArrayMaxSize(6)`)에만 있던 6장 제한을 DB 제약으로 격상.

### 3.3 ma_jungsi_application — 정시·6/9월 모평 모의지원 (가/나/다 3회)

```sql
CREATE TABLE mock_application.ma_jungsi_application (
  id                    SERIAL PRIMARY KEY,
  member_id             BIGINT       NOT NULL,           -- hub.auth_member.id
  season_id             INT          NOT NULL REFERENCES mock_application.ma_season(id),
  gun_type              VARCHAR(10)  NOT NULL,           -- '가' | '나' | '다' (js_admission.admission_type과 동일 표기)
  regular_admission_id  INT          NOT NULL,           -- jungsi.js_admission.id (느슨한 참조)
  status                VARCHAR(20)  NOT NULL DEFAULT 'submitted',
  score_snapshot        JSONB,                           -- 지원 시점 표준점수 스냅샷 (아래 예시)
  converted_score       DECIMAL(10,5),                   -- 대학 환산점수 (js_user_recruitment_scores 방식)
  standard_score_sum    INT,
  cumulative_percentile DECIMAL(10,6),                   -- 누적백분위
  risk_score            INT,                             -- -5 ~ +5
  min_cut               DECIMAL(10,5),                   -- 전년 최저컷 (js_admission_previous_result 복사)
  max_cut               DECIMAL(10,5),
  predicted_success     BOOLEAN,
  submitted_at          TIMESTAMP(6),
  created_at            TIMESTAMP(6) NOT NULL DEFAULT now(),
  updated_at            TIMESTAMP(6) NOT NULL DEFAULT now(),
  CONSTRAINT ck_ma_jungsi_gun CHECK (gun_type IN ('가','나','다')),
  CONSTRAINT uq_ma_jungsi_gun UNIQUE (member_id, season_id, gun_type),      -- ★ 군별 1회 = 시즌당 3회
  CONSTRAINT uq_ma_jungsi_adm UNIQUE (member_id, season_id, regular_admission_id)
);

CREATE INDEX ix_ma_jungsi_target ON mock_application.ma_jungsi_application (season_id, regular_admission_id);
CREATE INDEX ix_ma_jungsi_member ON mock_application.ma_jungsi_application (member_id, season_id);
```

* `score_snapshot` 예 (모평 시즌이면 해당 회차 점수, 정시 시즌이면 수능 점수):

```json
{
  "source": "PYUNGGAWON",            // 'PYUNGGAWON'(js_pyunggawon_*) | 'SUNUNG'(js_user_input_scores) | 'MANUAL'
  "schedule": { "year": "2026", "month": "6" },   // js_pyunggawon_month 키
  "korean":   { "elective": "언매", "standard": 131, "grade": 2, "percentile": 93 },
  "math":     { "elective": "미적", "standard": 135, "grade": 2, "percentile": 94 },
  "english":  { "grade": 2 },
  "history":  { "grade": 3 },
  "research1": { "subject": "물리학1", "standard": 65, "grade": 2, "percentile": 90 },
  "research2": { "subject": "화학1",   "standard": 63, "grade": 3, "percentile": 86 }
}
```

* 가/나/다 군 검증: 지원 시 `js_admission.admission_type`과 입력 `gun_type` 일치 여부를 서비스 레이어에서 확인 (군이 다른 모집단위를 가군 슬롯에 넣는 것 방지). Jungsi 기존 테이블엔 이 제약이 없었음 — ma_*에선 UNIQUE + 검증 이중 방어.

### 3.4 ma_application_stats — 지원 현황 집계 캐시

모의지원 "현황"(경쟁률, 분포, 내 위치)을 매 요청마다 집계하지 않도록 주기 갱신 캐시를 둔다. 앱의 `NormalDistributionChart`/`FrequencyDistributionTable` 데이터 소스.

```sql
CREATE TABLE mock_application.ma_application_stats (
  id                  SERIAL PRIMARY KEY,
  season_id           INT          NOT NULL REFERENCES mock_application.ma_season(id),
  target_type         VARCHAR(20)  NOT NULL,   -- 'SUSI_RU'(ss_recruitment_unit) | 'JUNGSI_ADM'(js_admission)
  target_id           INT          NOT NULL,
  applicant_count     INT          NOT NULL DEFAULT 0,
  recruitment_number  INT,                      -- 모집인원 (원본 테이블에서 복사)
  competition_ratio   DECIMAL(10,2),            -- applicant_count / recruitment_number
  score_avg           DECIMAL(10,5),
  score_top           DECIMAL(10,5),
  cut_estimate_50     DECIMAL(10,5),            -- 지원자 분포 기반 예상 50% 컷
  cut_estimate_70     DECIMAL(10,5),
  distribution        JSONB,                    -- 도수분포 [{bin_start, bin_end, count}, ...]
  updated_at          TIMESTAMP(6) NOT NULL DEFAULT now(),
  CONSTRAINT uq_ma_stats UNIQUE (season_id, target_type, target_id)
);
```

---

## 4. Prisma 모델 (Hub-Backend 스타일, multiSchema)

```prisma
// datasource 의 schemas 에 "mock_application" 추가 필요
// schemas = ["hub", "susi", "jungsi", "mock_application", "public"]

model MaSeason {
  id           Int       @id @default(autoincrement())
  year         Int
  seasonType   String    @map("season_type") @db.VarChar(20)
  title        String    @db.VarChar(100)
  openAt       DateTime  @map("open_at") @db.Timestamp(6)
  closeAt      DateTime  @map("close_at") @db.Timestamp(6)
  resultOpenAt DateTime? @map("result_open_at") @db.Timestamp(6)
  isActive     Boolean   @default(false) @map("is_active")
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt    DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamp(6)

  susiApplications   MaSusiApplication[]
  jungsiApplications MaJungsiApplication[]
  stats              MaApplicationStats[]

  @@unique([year, seasonType])
  @@map("ma_season")
  @@schema("mock_application")
}

model MaSusiApplication {
  id                Int       @id @default(autoincrement())
  memberId          BigInt    @map("member_id")            // hub.auth_member.id
  seasonId          Int       @map("season_id")
  slotNo            Int       @map("slot_no") @db.SmallInt // 1~6
  recruitmentUnitId Int       @map("recruitment_unit_id")  // susi.ss_recruitment_unit.id
  status            String    @default("submitted") @db.VarChar(20)
  scoreSnapshot     Json?     @map("score_snapshot")
  myGrade           Decimal?  @map("my_grade") @db.Decimal(5, 2)
  grade50Cut        Decimal?  @map("grade_50_cut") @db.Decimal(10, 5)
  grade70Cut        Decimal?  @map("grade_70_cut") @db.Decimal(10, 5)
  riskLevel         Int?      @map("risk_level")
  predictedSuccess  Boolean?  @map("predicted_success")
  submittedAt       DateTime? @map("submitted_at") @db.Timestamp(6)
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt         DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamp(6)

  season MaSeason @relation(fields: [seasonId], references: [id])

  @@unique([memberId, seasonId, slotNo])
  @@unique([memberId, seasonId, recruitmentUnitId])
  @@index([seasonId, recruitmentUnitId])
  @@index([memberId, seasonId])
  @@map("ma_susi_application")
  @@schema("mock_application")
}

model MaJungsiApplication {
  id                   Int       @id @default(autoincrement())
  memberId             BigInt    @map("member_id")
  seasonId             Int       @map("season_id")
  gunType              String    @map("gun_type") @db.VarChar(10) // '가'|'나'|'다'
  regularAdmissionId   Int       @map("regular_admission_id")     // jungsi.js_admission.id
  status               String    @default("submitted") @db.VarChar(20)
  scoreSnapshot        Json?     @map("score_snapshot")
  convertedScore       Decimal?  @map("converted_score") @db.Decimal(10, 5)
  standardScoreSum     Int?      @map("standard_score_sum")
  cumulativePercentile Decimal?  @map("cumulative_percentile") @db.Decimal(10, 6)
  riskScore            Int?      @map("risk_score")
  minCut               Decimal?  @map("min_cut") @db.Decimal(10, 5)
  maxCut               Decimal?  @map("max_cut") @db.Decimal(10, 5)
  predictedSuccess     Boolean?  @map("predicted_success")
  submittedAt          DateTime? @map("submitted_at") @db.Timestamp(6)
  createdAt            DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt            DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamp(6)

  season MaSeason @relation(fields: [seasonId], references: [id])

  @@unique([memberId, seasonId, gunType])
  @@unique([memberId, seasonId, regularAdmissionId])
  @@index([seasonId, regularAdmissionId])
  @@index([memberId, seasonId])
  @@map("ma_jungsi_application")
  @@schema("mock_application")
}

model MaApplicationStats {
  id                Int      @id @default(autoincrement())
  seasonId          Int      @map("season_id")
  targetType        String   @map("target_type") @db.VarChar(20) // 'SUSI_RU' | 'JUNGSI_ADM'
  targetId          Int      @map("target_id")
  applicantCount    Int      @default(0) @map("applicant_count")
  recruitmentNumber Int?     @map("recruitment_number")
  competitionRatio  Decimal? @map("competition_ratio") @db.Decimal(10, 2)
  scoreAvg          Decimal? @map("score_avg") @db.Decimal(10, 5)
  scoreTop          Decimal? @map("score_top") @db.Decimal(10, 5)
  cutEstimate50     Decimal? @map("cut_estimate_50") @db.Decimal(10, 5)
  cutEstimate70     Decimal? @map("cut_estimate_70") @db.Decimal(10, 5)
  distribution      Json?
  updatedAt         DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamp(6)

  season MaSeason @relation(fields: [seasonId], references: [id])

  @@unique([seasonId, targetType, targetId])
  @@map("ma_application_stats")
  @@schema("mock_application")
}
```

---

## 5. 비즈니스 규칙 요약

| 규칙 | 강제 수단 |
|---|---|
| 수시 모의지원 시즌당 최대 6회 | `CHECK slot_no 1~6` + `UNIQUE(member_id, season_id, slot_no)` |
| 같은 모집단위 중복 지원 금지 (수시) | `UNIQUE(member_id, season_id, recruitment_unit_id)` |
| 정시/모평 군별 1회 (총 3회) | `UNIQUE(member_id, season_id, gun_type)` + `CHECK gun_type IN (가,나,다)` |
| 같은 모집단위 중복 지원 금지 (정시/모평) | `UNIQUE(member_id, season_id, regular_admission_id)` |
| 군-모집단위 일치 (가군 단위는 가군 슬롯에만) | 서비스 레이어: `js_admission.admission_type == gun_type` 검증 |
| 지원 기간 제한 | 서비스 레이어: `ma_season.open_at ~ close_at` 검증 |
| 지원 변경/취소 | `status='cancelled'` 소프트 삭제 → 슬롯 재사용 시 cancelled 행은 UNIQUE에서 제외 필요. 단순화를 위해 **물리 삭제 + 이력 불요** 권장. 이력이 필요하면 partial unique index 사용: `CREATE UNIQUE INDEX ... WHERE status != 'cancelled'` |

> 주의: 취소 이력을 남기려면 §3의 UNIQUE 제약을 partial unique index로 교체해야 한다 (PostgreSQL은 `CREATE UNIQUE INDEX ... WHERE status <> 'cancelled'` 지원, Prisma에선 raw migration으로 작성).

---

## 6. 타 앱 연동 지점

| 데이터 | 출처 | 사용 방식 |
|---|---|---|
| 사용자 인증/식별 | `hub.auth_member` (SSO JWT) | member_id 저장 |
| 수시 모집단위·전년컷 | `susi.ss_recruitment_unit`, `ss_recruitment_unit_score`, `ss_admission`, `ss_university` | ID 참조 + 컷 스냅샷 복사 |
| 정시 모집단위·전년결과 | `jungsi.js_admission`, `js_admission_previous_result` | ID 참조 + 컷 스냅샷 복사 |
| 모평 점수 (6/9월) | `jungsi.js_pyunggawon_month/raw_score`, `js_sunung_standard_score`, `js_raw_to_standard` (모고앱 연동 가능) | 지원 시 score_snapshot으로 복사 |
| 수능 점수 (정시) | `jungsi.js_user_input_scores`, `js_user_calculated_scores` | 지원 시 score_snapshot으로 복사 |
| 내신/생기부 (수시) | `hub.sgb_*` | 지원 시 score_snapshot으로 복사 |

스냅샷을 두는 이유: 지원 후 사용자가 점수를 수정해도 모의지원 당시 기록과 경쟁률 통계가 흔들리지 않게 하기 위함.

---

## 7. 시즌 기반 UI 매핑 (모바일)

```
홈 화면
└─ ma_season (is_active, 기간 내) 조회
   ├─ MOCK_JUNE  → "6월 모평 모의지원"  카드 → 가/나/다 3슬롯 화면 (js_admission 검색)
   ├─ MOCK_SEPT  → "9월 모평 모의지원"  카드 → 〃
   ├─ SUSI       → "수시 모의지원"      카드 → 6슬롯 화면 (ss_recruitment_unit 검색)
   └─ JUNGSI     → "정시 모의지원"      카드 → 가/나/다 3슬롯 화면
지원 현황 화면 → ma_application_stats (경쟁률·분포차트·내 위치)
```

비활성 시즌 카드는 잠금 상태로 표시하고 `open_at` 노출 ("9월 1일 오픈").

---

## 8. 마이그레이션 절차 (Hub-Backend 기준)

1. `schema.prisma` datasource `schemas`에 `"mock_application"` 추가, §4 모델 붙여넣기
2. `npx prisma migrate dev --name create_ma_tables` (CREATE SCHEMA 포함 확인)
3. 취소 이력 정책 결정 시 partial unique index를 raw SQL 마이그레이션으로 추가
4. 시즌 시드 데이터 입력 (해당 학년도 4개 시즌)
5. 위성앱 백엔드(모의지원 backend 신설 시)는 service token으로 Hub internal API 호출 (`Hub-Backend/CLAUDE.md` §8–9 패턴)
