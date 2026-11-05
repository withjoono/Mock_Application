import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../lib/theme';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import AuthButton from '../components/AuthButton';
import BottomSheet from '../components/BottomSheet';
import Field from '../components/Field';
import ApplyStatsPanel from '../components/ApplyStatsPanel';
import { useMockApplication } from '../lib/hooks/useMockApplication';
import { useAuthContext } from '../lib/contexts/AuthContext';
import {
  GunType,
  IMaSusiApplication,
  IMaJungsiApplication,
  IMaStats,
  MaSeasonType,
  ISusiSearchResult,
  IJungsiSearchResult,
  searchSusiTargetsAPI,
  searchJungsiTargetsAPI,
  searchGuestSusiTargetsAPI,
  searchGuestJungsiTargetsAPI,
  fetchGuestPreviewAPI,
} from '../lib/api/features/mock-application';
import { SEASON_LABELS } from '../lib/season-labels';

const GUN_TYPES: GunType[] = ['가', '나', '다'];
const SUSI_SLOTS = [1, 2, 3, 4, 5, 6];

interface RouteParams {
  seasonId: number;
  title: string;
  seasonType: MaSeasonType;
}

type SearchResult = ISusiSearchResult | IJungsiSearchResult;

interface GuestPreview {
  badge: string;
  selected: SearchResult;
  score: number;
  stats: IMaStats;
  slotNo?: number;
  gunType?: GunType;
}

/** 빈 슬롯 지원 입력 폼 상태 (검색 → 선택 → 제출) */
interface ApplyFormState {
  visible: boolean;
  slotNo?: number; // 수시
  gunType?: GunType; // 정시·모평
  keyword: string;
  results: SearchResult[];
  searching: boolean;
  selected: SearchResult | null;
  score: string; // 수시: 내신 등급 / 정시·모평: 환산점수
}

const EMPTY_FORM: ApplyFormState = {
  visible: false,
  keyword: '',
  results: [],
  searching: false,
  selected: null,
  score: '',
};

const toNumber = (value: string | number | null | undefined) => {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export default function SeasonApplyScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { seasonId, title, seasonType } = (route.params || {}) as RouteParams;
  const seasonLabel = SEASON_LABELS[seasonType] ?? '모의지원';
  const seasonYear = title?.match(/^(\d+)학년도/)?.[1];
  const isSusi = seasonType === 'SUSI';
  const { isAuthenticated } = useAuthContext();

  const {
    isLoading,
    error,
    myApplications,
    fetchMyApplications,
    submitSusiApplication,
    submitJungsiApplication,
    cancelApplication,
    fetchStats,
    clearError,
  } = useMockApplication();

  const [form, setForm] = useState<ApplyFormState>(EMPTY_FORM);
  const [statsBySlot, setStatsBySlot] = useState<Record<number, IMaStats>>({});
  const [statsLoadingId, setStatsLoadingId] = useState<number | null>(null);
  const [guestPreviews, setGuestPreviews] = useState<Record<string, GuestPreview>>({});
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    setStatsBySlot({});
    setGuestPreviews({});
    setForm(EMPTY_FORM);
    if (seasonId && isAuthenticated) fetchMyApplications(seasonId);
  }, [seasonId, isAuthenticated, fetchMyApplications]);

  const applications = (myApplications?.applications || []) as (
    | IMaSusiApplication
    | IMaJungsiApplication
  )[];

  const findSusiApp = (slotNo: number) =>
    (applications as IMaSusiApplication[]).find((a) => a.slotNo === slotNo);
  const findJungsiApp = (gunType: GunType) =>
    (applications as IMaJungsiApplication[]).find((a) => a.gunType === gunType);

  // ── 모집단위 검색 ──────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const keyword = form.keyword.trim();
    if (keyword.length < 2) {
      Alert.alert('검색어 확인', '두 글자 이상 입력해주세요.');
      return;
    }
    setForm((p) => ({ ...p, searching: true, selected: null, results: [] }));
    try {
      const results = isSusi
        ? isAuthenticated
          ? await searchSusiTargetsAPI(keyword)
          : await searchGuestSusiTargetsAPI(keyword)
        : isAuthenticated
          ? await searchJungsiTargetsAPI(keyword, seasonId, form.gunType)
          : await searchGuestJungsiTargetsAPI(keyword, seasonId, form.gunType);
      setForm((p) => ({ ...p, results, searching: false }));
      if (results.length === 0) {
        Alert.alert('검색 결과 없음', '다른 검색어로 시도해주세요.');
      }
    } catch (e: any) {
      setForm((p) => ({ ...p, searching: false }));
      Alert.alert('검색 실패', e?.response?.data?.message || '잠시 후 다시 시도해주세요.');
    }
  }, [form.keyword, form.gunType, isSusi, isAuthenticated, seasonId]);

  // ── 지원 제출 ──────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!form.selected) {
      Alert.alert('입력 확인', '검색 후 모집단위를 선택해주세요.');
      return;
    }
    const rawScore = form.score.trim();
    if (!rawScore) {
      Alert.alert(
        '점수 확인',
        isSusi
          ? '내 순위 산출을 위해 내신 등급을 입력해주세요.'
          : '내 순위 산출을 위해 환산점수를 입력해주세요.',
      );
      return;
    }
    const score = Number(rawScore);
    if (!Number.isFinite(score) || (isSusi ? score < 1 || score > 9 : score < 0)) {
      Alert.alert(
        '점수 확인',
        isSusi ? '내신 등급은 1 이상 9 이하로 입력해주세요.' : '환산점수는 0 이상의 숫자로 입력해주세요.',
      );
      return;
    }
    const selected = form.selected;

    if (!isAuthenticated) {
      const badge = isSusi ? `${form.slotNo}번` : `${form.gunType}군`;
      const key = isSusi ? `slot-${form.slotNo}` : `gun-${form.gunType}`;
      setPreviewing(true);
      try {
        const stats = await fetchGuestPreviewAPI(
          seasonId,
          isSusi ? 'SUSI_RU' : 'JUNGSI_ADM',
          selected.id,
          score,
        );
        setGuestPreviews((prev) => ({
          ...prev,
          [key]: {
            badge,
            selected,
            score,
            stats,
            slotNo: form.slotNo,
            gunType: form.gunType,
          },
        }));
        setForm(EMPTY_FORM);
      } catch (e: any) {
        Alert.alert(
          '예측 실패',
          e?.response?.data?.message || '잠시 후 다시 시도해주세요.',
        );
      } finally {
        setPreviewing(false);
      }
      return;
    }

    let ok = false;
    if (isSusi && form.slotNo) {
      const created = await submitSusiApplication({
        seasonId,
        slotNo: form.slotNo,
        recruitmentUnitId: selected.id,
        universityName: selected.universityName ?? undefined,
        recruitmentName: selected.recruitmentName,
        admissionName: selected.admissionName || undefined,
        myGrade: score,
      });
      ok = !!created;
    } else if (!isSusi && form.gunType) {
      const created = await submitJungsiApplication({
        seasonId,
        gunType: form.gunType,
        regularAdmissionId: selected.id,
        universityName: selected.universityName ?? undefined,
        recruitmentName: selected.recruitmentName,
        admissionName: selected.admissionName || undefined,
        convertedScore: score,
      });
      ok = !!created;
    }
    if (ok) setForm(EMPTY_FORM);
  }, [
    form,
    isSusi,
    isAuthenticated,
    seasonId,
    submitSusiApplication,
    submitJungsiApplication,
  ]);

  // ── 지원 취소 ──────────────────────────────────────────
  const handleCancel = useCallback(
    (app: IMaSusiApplication | IMaJungsiApplication) => {
      Alert.alert('모의지원 취소', `${app.universityName ?? '해당 모집단위'} 지원을 취소할까요?`, [
        { text: '아니오', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: () => cancelApplication(isSusi ? 'SUSI' : 'JUNGSI', app.id, seasonId),
        },
      ]);
    },
    [cancelApplication, isSusi, seasonId],
  );

  // ── 경쟁률 조회 ──────────────────────────────────────────
  const handleShowStats = useCallback(
    async (app: IMaSusiApplication | IMaJungsiApplication) => {
      const targetId = isSusi
        ? (app as IMaSusiApplication).recruitmentUnitId
        : (app as IMaJungsiApplication).regularAdmissionId;
      setStatsLoadingId(app.id);
      const stats = await fetchStats(seasonId, isSusi ? 'SUSI_RU' : 'JUNGSI_ADM', targetId);
      setStatsLoadingId(null);
      if (stats) {
        setStatsBySlot((prev) => ({ ...prev, [app.id]: stats }));
      }
    },
    [fetchStats, isSusi, seasonId],
  );

  const openForm = (target: { slotNo?: number; gunType?: GunType }) =>
    setForm({ ...EMPTY_FORM, visible: true, ...target });

  const formatScore = (score: number) =>
    isSusi ? `${score.toFixed(2)}등급` : `${score.toFixed(1)}점`;

  // ── 카드 공통 머리 (슬롯 표시 + 대학 + 모집단위) ─────────────
  const renderCardHead = (
    badge: string,
    university: string,
    recruitment: string | null,
    tags: string[],
    action: React.ReactNode,
  ) => (
    <View style={styles.cardHead}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
      <View style={styles.cardHeadText}>
        <Text style={styles.university} numberOfLines={1}>
          {university}
        </Text>
        {!!recruitment && (
          <Text style={styles.recruitment} numberOfLines={2}>
            {recruitment}
          </Text>
        )}
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {action}
    </View>
  );

  // ── 지원 완료 카드 ──────────────────────────────────────
  const renderFilledCard = (
    app: IMaSusiApplication | IMaJungsiApplication,
    badge: string,
  ) => {
    const stats = statsBySlot[app.id];
    const loadingStats = statsLoadingId === app.id;
    const risk = isSusi
      ? (app as IMaSusiApplication).riskLevel
      : (app as IMaJungsiApplication).riskScore;
    const myScore = isSusi
      ? toNumber((app as IMaSusiApplication).myGrade)
      : toNumber((app as IMaJungsiApplication).convertedScore);
    const dataYear = !isSusi ? (app as IMaJungsiApplication).targetDataYear : null;
    const tags = [
      ...(app.admissionName ? [app.admissionName] : []),
      ...(dataYear ? [`${dataYear}학년도 자료`] : []),
    ];
    const targetId = isSusi
      ? (app as IMaSusiApplication).recruitmentUnitId
      : (app as IMaJungsiApplication).regularAdmissionId;

    return (
      <View key={badge} style={styles.card}>
        {renderCardHead(
          badge,
          app.universityName ?? `모집단위 #${targetId}`,
          app.recruitmentName,
          tags,
          <TouchableOpacity
            onPress={() => handleCancel(app)}
            hitSlop={8}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel={`${app.universityName ?? '해당 모집단위'} 지원 취소`}
          >
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>,
        )}

        <View style={styles.cardFoot}>
          <View style={styles.figures}>
            <View>
              <Text style={styles.figureLabel}>{isSusi ? '내 내신' : '내 환산점수'}</Text>
              <Text style={styles.figureValue}>
                {myScore != null ? formatScore(myScore) : '미입력'}
              </Text>
            </View>
            {risk != null && (
              <View>
                <Text style={styles.figureLabel}>위험도</Text>
                <Text style={styles.figureValue}>{risk > 0 ? `+${risk}` : risk}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => handleShowStats(app)}
            disabled={loadingStats}
            accessibilityRole="button"
          >
            {loadingStats ? (
              <ActivityIndicator size="small" color={theme.colors.bronzeDeep} />
            ) : (
              <Ionicons
                name={stats ? 'refresh' : 'stats-chart'}
                size={14}
                color={theme.colors.bronzeDeep}
              />
            )}
            <Text style={styles.statsButtonText}>{stats ? '새로고침' : '실시간 경쟁률'}</Text>
          </TouchableOpacity>
        </View>

        {stats && <ApplyStatsPanel stats={stats} isSusi={isSusi} myScore={myScore} />}
      </View>
    );
  };

  // ── 빈 슬롯 ────────────────────────────────────────────
  const renderEmptyCard = (badge: string, caption: string, onPress: () => void) => (
    <Pressable
      key={badge}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${caption}, 대학 선택하기`}
      style={({ pressed }) => [styles.emptyCard, pressed && styles.emptyCardPressed]}
    >
      <View style={[styles.badge, styles.badgeEmpty]}>
        <Text style={[styles.badgeText, styles.badgeTextEmpty]}>{badge}</Text>
      </View>
      <View style={styles.cardHeadText}>
        <Text style={styles.emptyTitle}>대학 선택하기</Text>
        <Text style={styles.emptyCaption}>{caption}</Text>
      </View>
      <View style={styles.addCircle}>
        <Ionicons name="add" size={20} color={theme.colors.bronzeDeep} />
      </View>
    </Pressable>
  );

  // ── 비로그인 체험 결과 ──────────────────────────────────
  const renderGuestPreviewCard = (preview: GuestPreview, badge: string) => {
    const { selected, score, stats } = preview;
    const tags = [
      ...(selected.admissionName ? [selected.admissionName] : []),
      ...('dataYear' in selected ? [`${selected.dataYear}학년도 자료`] : []),
    ];
    const reopenForm = () =>
      setForm({
        ...EMPTY_FORM,
        visible: true,
        slotNo: preview.slotNo,
        gunType: preview.gunType,
        selected,
        score: String(score),
      });

    return (
      <View key={badge} style={styles.card}>
        {renderCardHead(
          badge,
          selected.universityName ?? '-',
          selected.recruitmentName,
          tags,
          <View style={styles.trialTag}>
            <Text style={styles.trialTagText}>체험</Text>
          </View>,
        )}

        <View style={styles.cardFoot}>
          <View style={styles.figures}>
            <View>
              <Text style={styles.figureLabel}>{isSusi ? '입력한 내신' : '입력한 환산점수'}</Text>
              <Text style={styles.figureValue}>{formatScore(score)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={reopenForm}
            accessibilityRole="button"
          >
            <Ionicons name="options-outline" size={14} color={theme.colors.bronzeDeep} />
            <Text style={styles.statsButtonText}>조건 바꿔 다시 예측</Text>
          </TouchableOpacity>
        </View>

        <ApplyStatsPanel stats={stats} isSusi={isSusi} myScore={score} preview />
        <Text style={styles.previewNotice}>체험 결과는 서버에 저장되지 않습니다.</Text>
      </View>
    );
  };

  // ── 슬롯 목록 ──────────────────────────────────────────
  const slotItems = isSusi
    ? SUSI_SLOTS.map((slotNo) => ({
        key: `slot-${slotNo}`,
        badge: String(slotNo),
        longBadge: `${slotNo}번`,
        caption: `${slotNo}번째 수시 지원`,
        target: { slotNo },
        app: isAuthenticated ? findSusiApp(slotNo) : undefined,
      }))
    : GUN_TYPES.map((gunType) => ({
        key: `gun-${gunType}`,
        badge: gunType,
        longBadge: `${gunType}군`,
        caption: `${gunType}군 지원`,
        target: { gunType },
        app: isAuthenticated ? findJungsiApp(gunType) : undefined,
      }));
  const isSlotFilled = (item: (typeof slotItems)[number]) =>
    isAuthenticated ? !!item.app : !!guestPreviews[item.key];
  const filledCount = slotItems.filter(isSlotFilled).length;
  const showSlots = !isAuthenticated || !!myApplications;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.ink} />

      {/* 상단 바: 스크롤해도 고정 */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <AppHeader
          tone="dark"
          title={seasonLabel}
          subtitle={seasonYear ? `${seasonYear}학년도` : undefined}
          onBack={() => navigation.goBack()}
          right={
            !isAuthenticated ? (
              <View style={styles.heroTrialChip}>
                <Text style={styles.heroTrialText}>체험 중</Text>
              </View>
            ) : null
          }
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spacing.md }}
      >
        {/* 당겨도 위쪽이 비지 않도록 */}
        <View style={styles.overscroll} />

        {/* 지원 현황 */}
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroKicker}>{isAuthenticated ? '지원 현황' : '체험한 지원'}</Text>
              <Text style={styles.heroCount}>
                {showSlots ? filledCount : '-'}
                <Text style={styles.heroTotal}> / {slotItems.length}</Text>
              </Text>
            </View>
            <Text style={styles.heroRule}>
              {isSusi ? '최대 6개 대학까지\n지원할 수 있어요' : '가·나·다군에 1곳씩\n지원할 수 있어요'}
            </Text>
          </View>
          <View style={styles.progress}>
            {slotItems.map((item) => {
              const filled = showSlots && isSlotFilled(item);
              return (
                <View key={item.key} style={styles.progressItem}>
                  <View style={[styles.progressBar, filled && styles.progressBarFilled]} />
                  <Text style={[styles.progressLabel, filled && styles.progressLabelFilled]}>
                    {item.longBadge}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.content}>
          {!isAuthenticated && (
            <View style={styles.guestBanner}>
              <Ionicons name="eye-outline" size={18} color={theme.colors.bronzeDeep} />
              <View style={styles.guestBannerCopy}>
                <Text style={styles.guestBannerTitle}>로그인 없이 체험하고 있어요</Text>
                <Text style={styles.guestBannerText} lineBreakStrategyIOS="hangul-word">
                  대학 검색, 예상 순위, 실시간 경쟁률을 볼 수 있어요. 지원 내역은 저장되지 않습니다.
                </Text>
              </View>
            </View>
          )}

          {error && (
            <TouchableOpacity style={styles.errorBox} onPress={clearError} accessibilityRole="button">
              <Ionicons name="alert-circle" size={18} color={theme.colors.negative} />
              <Text style={styles.errorText}>{error}</Text>
              <Ionicons name="close" size={16} color={theme.colors.negative} />
            </TouchableOpacity>
          )}

          {isAuthenticated && !myApplications && (isLoading || !error) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.bronzeDeep} />
              <Text style={styles.loadingText}>지원 현황을 불러오는 중</Text>
            </View>
          ) : isAuthenticated && !myApplications ? (
            <View style={styles.retryContainer}>
              <Ionicons name="cloud-offline-outline" size={28} color={theme.colors.textSubtle} />
              <Text style={styles.retryText} lineBreakStrategyIOS="hangul-word">
                지원 현황을 불러오지 못했습니다. 빈 슬롯으로 새 지원을 시작하지 말고 다시 시도해주세요.
              </Text>
              <AuthButton
                label="다시 불러오기"
                onPress={() => fetchMyApplications(seasonId)}
                style={styles.retryButton}
              />
            </View>
          ) : (
            slotItems.map((item) => {
              if (!isAuthenticated) {
                const preview = guestPreviews[item.key];
                return preview
                  ? renderGuestPreviewCard(preview, item.badge)
                  : renderEmptyCard(item.badge, item.caption, () => openForm(item.target));
              }
              return item.app
                ? renderFilledCard(item.app, item.badge)
                : renderEmptyCard(item.badge, item.caption, () => openForm(item.target));
            })
          )}

          <AppFooter />
        </View>
      </ScrollView>

      {/* 모집단위 검색 및 지원 입력 시트 */}
      <BottomSheet
        visible={form.visible}
        onClose={() => setForm(EMPTY_FORM)}
        title={
          isSusi
            ? form.slotNo
              ? `${form.slotNo}번째 대학 지원`
              : seasonLabel
            : form.gunType
              ? `${form.gunType}군 지원`
              : seasonLabel
        }
        subtitle={isAuthenticated ? seasonLabel : `${seasonLabel} 합격예측 체험`}
      >
        {/* 1. 모집단위 */}
        {form.selected ? (
          <View>
            <Text style={styles.fieldLabel}>대학·모집단위</Text>
            <View style={styles.selectedBox}>
              <Ionicons name="checkmark-circle" size={22} color={theme.colors.bronzeDeep} />
              <View style={styles.cardHeadText}>
                <Text style={styles.resultUniversity} numberOfLines={1}>
                  {form.selected.universityName ?? '-'}
                </Text>
                <Text style={styles.resultDetail} numberOfLines={2}>
                  {form.selected.recruitmentName}
                  {form.selected.admissionName ? `  ${form.selected.admissionName}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setForm((p) => ({ ...p, selected: null }))}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={styles.changeText}>변경</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.searchBlock}>
            <Field
              label="대학·모집단위"
              placeholder="대학명 또는 모집단위명 (예: 연세대 경영)"
              value={form.keyword}
              onChangeText={(v) => setForm((p) => ({ ...p, keyword: v }))}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCorrect={false}
              leading={<Ionicons name="search" size={18} color={theme.colors.textSubtle} />}
              trailing={
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={handleSearch}
                  disabled={form.searching}
                  accessibilityRole="button"
                  accessibilityLabel="검색"
                >
                  {form.searching ? (
                    <ActivityIndicator size="small" color={theme.colors.ivory} />
                  ) : (
                    <Text style={styles.searchButtonText}>검색</Text>
                  )}
                </TouchableOpacity>
              }
            />

            {form.results.length > 0 && (
              <View style={styles.resultList}>
                <Text style={styles.resultCount}>검색 결과 {form.results.length}건</Text>
                <ScrollView style={styles.resultScroll} nestedScrollEnabled>
                  {form.results.map((r, index) => (
                    <Pressable
                      key={r.id}
                      style={({ pressed }) => [
                        styles.resultItem,
                        index > 0 && styles.resultItemDivider,
                        pressed && styles.resultItemPressed,
                      ]}
                      onPress={() => setForm((p) => ({ ...p, selected: r }))}
                      accessibilityRole="button"
                    >
                      <Text style={styles.resultUniversity} numberOfLines={1}>
                        {r.universityName ?? '-'}
                      </Text>
                      <Text style={styles.resultDetail} numberOfLines={1}>
                        {r.recruitmentName}
                      </Text>
                      <View style={styles.tags}>
                        {!!r.admissionName && (
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>{r.admissionName}</Text>
                          </View>
                        )}
                        {r.recruitmentNumber != null && (
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>모집 {r.recruitmentNumber}명</Text>
                          </View>
                        )}
                        {'dataYear' in r && (
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>{r.dataYear}학년도 자료</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* 2. 내 점수 */}
        <Field
          label={isSusi ? '내 내신 등급' : '내 환산점수'}
          placeholder={isSusi ? '1 ~ 9 사이 (예: 2.35)' : '예: 512.4'}
          keyboardType="decimal-pad"
          value={form.score}
          onChangeText={(v) => setForm((p) => ({ ...p, score: v }))}
          hint="순위·평균·분포는 지원자가 직접 입력한 점수를 기준으로 계산됩니다."
          trailing={<Text style={styles.unitText}>{isSusi ? '등급' : '점'}</Text>}
        />

        <AuthButton
          label={isAuthenticated ? '모의지원 제출' : '합격예측 보기'}
          onPress={handleSubmit}
          loading={isLoading || previewing}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },

  // 상단
  topBar: {
    backgroundColor: theme.colors.ink,
    zIndex: 1,
  },
  overscroll: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: theme.colors.ink,
  },
  hero: {
    backgroundColor: theme.colors.ink,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 22,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroKicker: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.ivoryMuted,
  },
  heroCount: {
    marginTop: 2,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    color: theme.colors.ivory,
    ...theme.numeric,
  },
  heroTotal: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0,
    color: theme.colors.ivorySubtle,
  },
  heroRule: {
    marginBottom: 8,
    textAlign: 'right',
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.ivoryMuted,
  },
  heroTrialChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(184, 148, 106, 0.18)',
  },
  heroTrialText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.bronze,
  },
  progress: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 6,
  },
  progressItem: {
    flex: 1,
    gap: 6,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(245, 239, 230, 0.14)',
  },
  progressBarFilled: {
    backgroundColor: theme.colors.bronze,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.ivorySubtle,
  },
  progressLabelFilled: {
    color: theme.colors.bronze,
  },

  // 본문
  scroll: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingTop: 20,
    gap: 12,
  },
  guestBanner: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.bronzeTint,
    borderWidth: 1,
    borderColor: theme.colors.bronzeLine,
  },
  guestBannerCopy: {
    flex: 1,
  },
  guestBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  guestBannerText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.negativeSoft,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.small,
    lineHeight: 18,
    color: theme.colors.negative,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: theme.spacing.xxl,
  },
  loadingText: {
    fontSize: theme.typography.small,
    color: theme.colors.textMuted,
  },
  retryContainer: {
    alignItems: 'center',
    gap: 12,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
  },
  retryText: {
    textAlign: 'center',
    fontSize: theme.typography.small,
    lineHeight: 19,
    color: theme.colors.textMuted,
  },
  retryButton: {
    alignSelf: 'stretch',
    marginTop: theme.spacing.xs,
  },

  // 슬롯 카드
  card: {
    padding: 18,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardHeadText: {
    flex: 1,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.ink,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.bronze,
  },
  badgeEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.bronzeLine,
  },
  badgeTextEmpty: {
    color: theme.colors.textSubtle,
  },
  university: {
    marginTop: 1,
    fontSize: theme.typography.subheading,
    fontWeight: '800',
    letterSpacing: theme.tracking.heading,
    color: theme.colors.text,
  },
  recruitment: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 19,
    color: theme.colors.textMuted,
  },
  tags: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.line,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceMuted,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  trialTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.bronzeTint,
  },
  trialTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.bronzeDeep,
  },
  cardFoot: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  figures: {
    flexDirection: 'row',
    gap: 20,
  },
  figureLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSubtle,
  },
  figureValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
    ...theme.numeric,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.bronzeLine,
    backgroundColor: theme.colors.bronzeTint,
  },
  statsButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.bronzeDeep,
  },
  previewNotice: {
    marginTop: 14,
    fontSize: 11,
    textAlign: 'center',
    color: theme.colors.textSubtle,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.bronzeLine,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  emptyCardPressed: {
    backgroundColor: theme.colors.bronzeTint,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptyCaption: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textSubtle,
  },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bronzeTint,
  },

  // 검색·지원 시트
  fieldLabel: {
    marginBottom: 6,
    fontSize: theme.typography.small,
    fontWeight: '700',
    color: theme.colors.text,
  },
  searchBlock: {
    gap: 12,
  },
  searchButton: {
    height: 40,
    minWidth: 56,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.ink,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.ivory,
  },
  resultList: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: 'hidden',
  },
  resultCount: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.surfaceMuted,
  },
  resultScroll: {
    maxHeight: 260,
  },
  resultItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultItemDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
  resultItemPressed: {
    backgroundColor: theme.colors.bronzeTint,
  },
  resultUniversity: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  resultDetail: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },
  selectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.bronzeLine,
    backgroundColor: theme.colors.bronzeTint,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.bronzeDeep,
  },
  unitText: {
    paddingRight: 10,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
});
