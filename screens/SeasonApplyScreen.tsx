import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../lib/theme';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
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

export default function SeasonApplyScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { seasonId, title, seasonType } = (route.params || {}) as RouteParams;
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
      const stats = await fetchStats(seasonId, isSusi ? 'SUSI_RU' : 'JUNGSI_ADM', targetId);
      if (stats) {
        setStatsBySlot((prev) => ({ ...prev, [app.id]: stats }));
      }
    },
    [fetchStats, isSusi, seasonId],
  );

  // ── 슬롯 카드 렌더 ──────────────────────────────────────
  const renderFilledCard = (
    app: IMaSusiApplication | IMaJungsiApplication,
    badge: string,
  ) => {
    const stats = statsBySlot[app.id];
    const risk = isSusi
      ? (app as IMaSusiApplication).riskLevel
      : (app as IMaJungsiApplication).riskScore;
    const distribution = [...(stats?.distribution || [])].sort((a, b) =>
      isSusi ? a.binStart - b.binStart : b.binStart - a.binStart,
    );
    const maxDistributionCount = Math.max(1, ...distribution.map((bin) => bin.count));

    return (
      <View key={badge} style={[styles.slotCard, styles.slotCardFilled]}>
        <View style={styles.slotHeader}>
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>{badge}</Text>
          </View>
          <Text style={styles.universityName} numberOfLines={1}>
            {app.universityName ?? `모집단위 #${isSusi ? (app as IMaSusiApplication).recruitmentUnitId : (app as IMaJungsiApplication).regularAdmissionId}`}
          </Text>
          <TouchableOpacity onPress={() => handleCancel(app)} hitSlop={8}>
            <Ionicons name="close-circle-outline" size={22} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <Text style={styles.recruitmentName} numberOfLines={1}>
          {app.recruitmentName ?? '-'}
          {app.admissionName ? ` · ${app.admissionName}` : ''}
          {!isSusi && (app as IMaJungsiApplication).targetDataYear
            ? ` · ${(app as IMaJungsiApplication).targetDataYear}학년도 모집자료`
            : ''}
        </Text>

        <View style={styles.slotFooter}>
          {risk != null && (
            <Text style={styles.riskText}>위험도 {risk > 0 ? `+${risk}` : risk}</Text>
          )}
          <TouchableOpacity style={styles.statsButton} onPress={() => handleShowStats(app)}>
            <Ionicons name="stats-chart" size={14} color={theme.colors.primary} />
            <Text style={styles.statsButtonText}>실시간 경쟁률</Text>
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={styles.statsBox}>
            {stats.open ? (
              <>
                <Text style={styles.statsLine}>
                  {stats.dataYear != null && `자료 ${stats.dataYear}학년도 · `}
                  지원자 {stats.applicantCount ?? 0}명
                  {stats.recruitmentNumber != null && ` · 모집 ${stats.recruitmentNumber}명`}
                  {stats.scoreAvg != null &&
                    ` · 평균 ${Number(stats.scoreAvg).toFixed(isSusi ? 2 : 1)}`}
                  {stats.scoreBest != null &&
                    ` · 최고 ${Number(stats.scoreBest).toFixed(isSusi ? 2 : 1)}`}
                </Text>

                <View style={styles.rankGrid}>
                  <View style={styles.rankItem}>
                    <Text style={styles.rankLabel}>실시간 경쟁률</Text>
                    <Text style={styles.rankValue}>
                      {stats.competitionRatio != null
                        ? `${Number(stats.competitionRatio).toFixed(2)} : 1`
                        : '모집인원 확인 중'}
                    </Text>
                  </View>
                  <View style={styles.rankItem}>
                    <Text style={styles.rankLabel}>
                      내 순위
                      {stats.scoredApplicantCount != null
                        ? ` (자가 입력 ${stats.scoredApplicantCount}명 기준)`
                        : ''}
                    </Text>
                    <Text style={styles.rankValue}>
                      {stats.myRank != null ? `${stats.myRank}등` : '점수 입력 필요'}
                    </Text>
                  </View>
                  <View style={styles.rankItem}>
                    <Text style={styles.rankLabel}>최초합 순위</Text>
                    <Text style={styles.rankValue}>
                      {stats.initialPassRank != null ? `${stats.initialPassRank}등 이내` : '산출 전'}
                    </Text>
                  </View>
                  <View style={styles.rankItem}>
                    <Text style={styles.rankLabel}>예상 추합 순위</Text>
                    <Text style={styles.rankValue}>
                      {stats.expectedAdditionalPassRank != null
                        ? `${stats.expectedAdditionalPassRank}등 이내`
                        : '입결 자료 준비 중'}
                    </Text>
                  </View>
                </View>

                {distribution.length > 0 && (
                  <View style={styles.distributionBox}>
                    <Text style={styles.distributionTitle}>지원자 점수 분포</Text>
                    {distribution.map((bin) => (
                      <View key={`${bin.binStart}-${bin.binEnd}`} style={styles.distributionRow}>
                        <Text style={styles.distributionRange}>
                          {Number(bin.binStart).toFixed(isSusi ? 1 : 0)}–
                          {Number(bin.binEnd).toFixed(isSusi ? 1 : 0)}
                        </Text>
                        <View style={styles.distributionTrack}>
                          <View
                            style={[
                              styles.distributionBar,
                              {
                                width: `${
                                  bin.count === 0
                                    ? 0
                                    : Math.max(4, (bin.count / maxDistributionCount) * 100)
                                }%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.distributionCount}>{bin.count}명</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.statsLine}>
                {stats.resultOpenAt
                  ? `현황은 ${stats.resultOpenAt.slice(0, 10)}부터 공개됩니다.`
                  : '현황 공개 전입니다.'}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyCard = (badge: string, onPress: () => void) => (
    <TouchableOpacity key={badge} style={styles.slotCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.slotHeader}>
        <View style={[styles.slotBadge, styles.slotBadgeEmpty]}>
          <Text style={styles.slotBadgeTextEmpty}>{badge}</Text>
        </View>
        <Text style={styles.emptyText}>지원하기</Text>
        <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderGuestPreviewCard = (preview: GuestPreview) => {
    const { selected, score, stats, badge } = preview;
    const distribution = [...(stats.distribution || [])].sort((a, b) =>
      isSusi ? a.binStart - b.binStart : b.binStart - a.binStart,
    );
    const maxDistributionCount = Math.max(1, ...distribution.map((bin) => bin.count));
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
      <View key={badge} style={[styles.slotCard, styles.slotCardFilled]}>
        <View style={styles.slotHeader}>
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>{badge}</Text>
          </View>
          <Text style={styles.universityName} numberOfLines={1}>
            {selected.universityName ?? '-'}
          </Text>
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>체험</Text>
          </View>
        </View>

        <Text style={styles.recruitmentName} numberOfLines={1}>
          {selected.recruitmentName}
          {selected.admissionName ? ` · ${selected.admissionName}` : ''}
        </Text>
        <Text style={styles.previewScoreText}>
          {isSusi ? `내신 ${score.toFixed(2)}등급` : `환산점수 ${score.toFixed(1)}점`}
        </Text>

        <View style={styles.statsBox}>
          {stats.open ? (
            <>
              <Text style={styles.statsLine}>
                {stats.dataYear != null && `자료 ${stats.dataYear}학년도 · `}
                현재 지원자 {stats.applicantCount ?? 0}명
                {stats.recruitmentNumber != null && ` · 모집 ${stats.recruitmentNumber}명`}
              </Text>
              <View style={styles.rankGrid}>
                <View style={styles.rankItem}>
                  <Text style={styles.rankLabel}>실시간 경쟁률</Text>
                  <Text style={styles.rankValue}>
                    {stats.competitionRatio != null
                      ? `${Number(stats.competitionRatio).toFixed(2)} : 1`
                      : '모집인원 확인 중'}
                  </Text>
                </View>
                <View style={styles.rankItem}>
                  <Text style={styles.rankLabel}>예상 내 순위</Text>
                  <Text style={styles.rankValue}>
                    {stats.myRank != null ? `${stats.myRank}등` : '산출 전'}
                  </Text>
                </View>
                <View style={styles.rankItem}>
                  <Text style={styles.rankLabel}>최초합 순위</Text>
                  <Text style={styles.rankValue}>
                    {stats.initialPassRank != null
                      ? `${stats.initialPassRank}등 이내`
                      : '산출 전'}
                  </Text>
                </View>
                <View style={styles.rankItem}>
                  <Text style={styles.rankLabel}>예상 추합 순위</Text>
                  <Text style={styles.rankValue}>
                    {stats.expectedAdditionalPassRank != null
                      ? `${stats.expectedAdditionalPassRank}등 이내`
                      : '입결 자료 준비 중'}
                  </Text>
                </View>
              </View>

              {distribution.length > 0 && (
                <View style={styles.distributionBox}>
                  <Text style={styles.distributionTitle}>지원자 점수 분포</Text>
                  {distribution.map((bin) => (
                    <View key={`${bin.binStart}-${bin.binEnd}`} style={styles.distributionRow}>
                      <Text style={styles.distributionRange}>
                        {Number(bin.binStart).toFixed(isSusi ? 1 : 0)}–
                        {Number(bin.binEnd).toFixed(isSusi ? 1 : 0)}
                      </Text>
                      <View style={styles.distributionTrack}>
                        <View
                          style={[
                            styles.distributionBar,
                            {
                              width: `${
                                bin.count === 0
                                  ? 0
                                  : Math.max(4, (bin.count / maxDistributionCount) * 100)
                              }%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.distributionCount}>{bin.count}명</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <Text style={styles.statsLine}>
              {stats.resultOpenAt
                ? `현황은 ${stats.resultOpenAt.slice(0, 10)}부터 공개됩니다.`
                : '현황 공개 전입니다.'}
            </Text>
          )}
        </View>

        <Text style={styles.previewNotice}>이 결과는 서버에 저장되지 않습니다.</Text>
        <TouchableOpacity style={styles.previewAgainButton} onPress={reopenForm}>
          <Text style={styles.previewAgainText}>조건 바꿔 다시 예측</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const filledCount = isAuthenticated ? applications.length : Object.keys(guestPreviews).length;
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader title={title ?? '모의지원'} onPressMenu={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* 요약 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {isSusi ? '수시 모의지원' : seasonType === 'JUNGSI' ? '정시 모의지원' : '모의평가 모의지원'}
          </Text>
          <Text style={styles.summaryText}>
            {isSusi
              ? `최대 6회까지 지원할 수 있습니다. (${filledCount}/6)`
              : `가·나·다 군별 1회, 총 3회까지 지원할 수 있습니다. (${filledCount}/3)`}
          </Text>
        </View>

        {!isAuthenticated && (
          <View style={styles.guestBanner}>
            <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
            <View style={styles.guestBannerCopy}>
              <Text style={styles.guestBannerTitle}>로그인 없이 합격예측 체험 중</Text>
              <Text style={styles.guestBannerText}>
                대학 검색·순위·경쟁률을 확인할 수 있으며, 지원서는 저장되지 않습니다.
              </Text>
            </View>
          </View>
        )}

        {error && (
          <TouchableOpacity style={styles.errorBox} onPress={clearError}>
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        )}

        {isAuthenticated && !myApplications && (isLoading || !error) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : isAuthenticated && !myApplications ? (
          <View style={styles.retryContainer}>
            <Text style={styles.retryText}>
              지원 현황을 불러오지 못했습니다. 빈 슬롯으로 새 지원을 시작하지 말고 다시 시도해주세요.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchMyApplications(seasonId)}
            >
              <Text style={styles.retryButtonText}>다시 불러오기</Text>
            </TouchableOpacity>
          </View>
        ) : isSusi ? (
          SUSI_SLOTS.map((slotNo) => {
            if (!isAuthenticated) {
              const preview = guestPreviews[`slot-${slotNo}`];
              return preview
                ? renderGuestPreviewCard(preview)
                : renderEmptyCard(`${slotNo}번`, () =>
                    setForm({ ...EMPTY_FORM, visible: true, slotNo }),
                  );
            }
            const app = findSusiApp(slotNo);
            return app
              ? renderFilledCard(app, `${slotNo}번`)
              : renderEmptyCard(`${slotNo}번`, () =>
                  setForm({ ...EMPTY_FORM, visible: true, slotNo }),
                );
          })
        ) : (
          GUN_TYPES.map((gunType) => {
            if (!isAuthenticated) {
              const preview = guestPreviews[`gun-${gunType}`];
              return preview
                ? renderGuestPreviewCard(preview)
                : renderEmptyCard(`${gunType}군`, () =>
                    setForm({ ...EMPTY_FORM, visible: true, gunType }),
                  );
            }
            const app = findJungsiApp(gunType);
            return app
              ? renderFilledCard(app, `${gunType}군`)
              : renderEmptyCard(`${gunType}군`, () =>
                  setForm({ ...EMPTY_FORM, visible: true, gunType }),
                );
          })
        )}
        <AppFooter />
      </ScrollView>

      {/* 모집단위 검색 및 지원 입력 모달 */}
      <Modal
        visible={form.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setForm(EMPTY_FORM)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.modalCard}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isSusi
                  ? form.slotNo
                    ? `${form.slotNo}번 슬롯 지원`
                    : '수시 모의지원'
                  : form.gunType
                    ? `${form.gunType}군 지원`
                    : '정시·모의평가 모의지원'}
              </Text>
              <TouchableOpacity onPress={() => setForm(EMPTY_FORM)} hitSlop={8}>
                <Ionicons name="close" size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            {/* 모집단위 검색 */}
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.input, styles.searchInput]}
                placeholder="대학명 또는 모집단위명 검색"
                value={form.keyword}
                onChangeText={(v) => setForm((p) => ({ ...p, keyword: v }))}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={form.searching}
              >
                {form.searching ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <Ionicons name="search" size={18} color={theme.colors.onPrimary} />
                )}
              </TouchableOpacity>
            </View>

            {/* 검색 결과 */}
            {form.results.length > 0 && !form.selected && (
              <ScrollView style={styles.resultList} nestedScrollEnabled>
                {form.results.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.resultItem}
                    onPress={() => setForm((p) => ({ ...p, selected: r }))}
                  >
                    <Text style={styles.resultUniversity} numberOfLines={1}>
                      {r.universityName ?? '-'}
                    </Text>
                    <Text style={styles.resultDetail} numberOfLines={1}>
                      {r.recruitmentName}
                      {r.admissionName ? ` · ${r.admissionName}` : ''}
                      {r.recruitmentNumber != null ? ` · ${r.recruitmentNumber}명` : ''}
                      {'dataYear' in r ? ` · ${r.dataYear}학년도 자료` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* 선택된 모집단위 */}
            {form.selected && (
              <View style={styles.selectedBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultUniversity} numberOfLines={1}>
                    {form.selected.universityName ?? '-'}
                  </Text>
                  <Text style={styles.resultDetail} numberOfLines={1}>
                    {form.selected.recruitmentName}
                    {form.selected.admissionName ? ` · ${form.selected.admissionName}` : ''}
                    {'dataYear' in form.selected
                      ? ` · ${form.selected.dataYear}학년도 자료`
                      : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setForm((p) => ({ ...p, selected: null }))}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.muted} />
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder={isSusi ? '내 내신 등급 (1~9, 필수)' : '내 환산점수 (필수)'}
              keyboardType="decimal-pad"
              value={form.score}
              onChangeText={(v) => setForm((p) => ({ ...p, score: v }))}
            />
            <Text style={styles.scoreNotice}>
              순위·평균·분포는 지원자가 직접 입력한 점수를 기준으로 계산됩니다.
            </Text>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (isLoading || previewing) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading || previewing}
            >
              {isLoading || previewing ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isAuthenticated ? '모의지원 제출' : '합격예측 보기'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  retryContainer: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
  },
  retryText: {
    textAlign: 'center',
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary,
  },
  retryButtonText: {
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  summaryCard: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  summaryTitle: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  summaryText: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
  guestBanner: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceVariant,
  },
  guestBannerCopy: {
    flex: 1,
  },
  guestBannerTitle: {
    fontSize: theme.typography.small,
    fontWeight: '700',
    color: theme.colors.text,
  },
  guestBannerText: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.muted,
  },
  errorBox: {
    backgroundColor: '#FFF1F1',
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.small,
  },
  slotCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  slotCardFilled: {
    borderColor: theme.colors.primary,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  slotBadge: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  slotBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  slotBadgeEmpty: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  slotBadgeTextEmpty: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceVariant,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  previewScoreText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.small,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  previewNotice: {
    marginTop: theme.spacing.sm,
    fontSize: 11,
    textAlign: 'center',
    color: theme.colors.muted,
  },
  previewAgainButton: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  previewAgainText: {
    fontSize: theme.typography.small,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  universityName: {
    flex: 1,
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  emptyText: {
    flex: 1,
    fontSize: theme.typography.body,
    color: theme.colors.muted,
  },
  recruitmentName: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
  slotFooter: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskText: {
    fontSize: theme.typography.small,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsButtonText: {
    fontSize: theme.typography.small,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statsBox: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
  },
  statsLine: {
    fontSize: theme.typography.small,
    color: theme.colors.text,
  },
  rankGrid: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  rankItem: {
    width: '48%',
    minHeight: 58,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  rankLabel: {
    fontSize: 11,
    color: theme.colors.muted,
  },
  rankValue: {
    marginTop: 3,
    fontSize: theme.typography.small,
    fontWeight: '700',
    color: theme.colors.text,
  },
  distributionBox: {
    marginTop: theme.spacing.md,
    gap: 6,
  },
  distributionTitle: {
    fontSize: theme.typography.small,
    fontWeight: '700',
    color: theme.colors.text,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  distributionRange: {
    width: 66,
    fontSize: 11,
    color: theme.colors.muted,
  },
  distributionTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: theme.colors.outline,
  },
  distributionBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  distributionCount: {
    width: 34,
    textAlign: 'right',
    fontSize: 11,
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
  },
  modalContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  modalTitle: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
    fontSize: theme.typography.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  scoreNotice: {
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.muted,
  },
  searchRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
  },
  searchButton: {
    width: 44,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultList: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radii.sm,
  },
  resultItem: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  resultUniversity: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  resultDetail: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
    marginTop: 2,
  },
  selectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  submitButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  submitButtonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
});
