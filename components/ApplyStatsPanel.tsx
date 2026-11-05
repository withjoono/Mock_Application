import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../lib/theme';
import type { IMaStats } from '../lib/api/features/mock-application';

interface ApplyStatsPanelProps {
  stats: IMaStats;
  isSusi: boolean;
  /** 내가 입력한 점수 (수시: 내신 등급, 정시·모평: 환산점수) — 분포에서 내 구간 표시 */
  myScore?: number | null;
  /** 비로그인 체험: 저장하지 않은 예상 순위 */
  preview?: boolean;
}

type Verdict = { label: string; tone: 'positive' | 'caution' | 'negative' };

function getVerdict(stats: IMaStats): Verdict | null {
  const { myRank, initialPassRank, expectedAdditionalPassRank } = stats;
  if (myRank == null || initialPassRank == null) return null;
  if (myRank <= initialPassRank) return { label: '최초합권', tone: 'positive' };
  if (expectedAdditionalPassRank != null && myRank <= expectedAdditionalPassRank) {
    return { label: '추합권', tone: 'caution' };
  }
  return { label: '추합권 밖', tone: 'negative' };
}

const TONE = {
  positive: { fg: theme.colors.positive, bg: theme.colors.positiveSoft },
  caution: { fg: theme.colors.caution, bg: theme.colors.cautionSoft },
  negative: { fg: theme.colors.negative, bg: theme.colors.negativeSoft },
};

/** 실시간 경쟁률 · 내 순위 위치 · 지원자 성적 분포 */
export default function ApplyStatsPanel({ stats, isSusi, myScore, preview = false }: ApplyStatsPanelProps) {
  if (!stats.open) {
    return (
      <View style={[styles.panel, styles.closedPanel]}>
        <Text style={styles.closedText}>
          {stats.resultOpenAt
            ? `현황은 ${stats.resultOpenAt.slice(0, 10)}부터 공개됩니다.`
            : '현황 공개 전입니다.'}
        </Text>
      </View>
    );
  }

  const digits = isSusi ? 2 : 1;
  const verdict = getVerdict(stats);
  const applicants = stats.applicantCount ?? 0;

  // 순위 막대: 최초합 / 추합 / 그 밖 구간을 같은 폭으로 나눠, 내 위치를 구간 안에 찍는다
  const zones: { end: number; label: string; color: string }[] = [];
  if (stats.initialPassRank != null) {
    zones.push({
      end: stats.initialPassRank,
      label: `최초합 ${stats.initialPassRank}등`,
      color: theme.colors.positive,
    });
    const additional = stats.expectedAdditionalPassRank;
    if (additional != null && additional > stats.initialPassRank) {
      zones.push({ end: additional, label: `추합 ${additional}등`, color: theme.colors.cautionOnDark });
    }
    const last = zones[zones.length - 1].end;
    const total = Math.max(applicants, stats.myRank ?? 0);
    if (total > last) {
      zones.push({
        end: total,
        label: total === applicants ? `전체 ${applicants}명` : `${total}등`,
        color: theme.colors.line,
      });
    }
  }
  const markerPct = (() => {
    if (stats.myRank == null || zones.length === 0) return null;
    let start = 0;
    for (let i = 0; i < zones.length; i++) {
      if (stats.myRank <= zones[i].end) {
        const within = (stats.myRank - start) / Math.max(1, zones[i].end - start);
        return ((i + Math.min(1, Math.max(0, within))) / zones.length) * 100;
      }
      start = zones[i].end;
    }
    return 100;
  })();

  // 분포: 수시는 1등급(좋은 성적)부터, 정시는 높은 점수부터
  const distribution = [...(stats.distribution || [])].sort((a, b) =>
    isSusi ? a.binStart - b.binStart : b.binStart - a.binStart,
  );
  const maxCount = Math.max(1, ...distribution.map((bin) => bin.count));
  const binDigits = isSusi ? 1 : 0;
  const isMyBin = (start: number, end: number, index: number) => {
    if (myScore == null || !Number.isFinite(myScore)) return false;
    const lo = Math.min(start, end);
    const hi = Math.max(start, end);
    const isEdge = isSusi ? index === distribution.length - 1 : index === 0;
    return myScore >= lo && (myScore < hi || (isEdge && myScore <= hi));
  };

  return (
    <View style={styles.panel}>
      {/* 경쟁률 */}
      <View style={styles.headline}>
        <View>
          <Text style={styles.kicker}>실시간 경쟁률</Text>
          {stats.competitionRatio != null ? (
            <Text style={styles.ratio}>
              {Number(stats.competitionRatio).toFixed(2)}
              <Text style={styles.ratioUnit}> : 1</Text>
            </Text>
          ) : (
            <Text style={styles.ratioPending}>모집인원 확인 중</Text>
          )}
        </View>
        <View style={styles.headcount}>
          <Text style={styles.headcountLine}>
            지원 <Text style={styles.headcountValue}>{applicants}</Text>명
          </Text>
          {stats.recruitmentNumber != null && (
            <Text style={styles.headcountLine}>
              모집 <Text style={styles.headcountValue}>{stats.recruitmentNumber}</Text>명
            </Text>
          )}
        </View>
      </View>

      {/* 내 순위 위치 */}
      <View style={styles.rankBlock}>
        <View style={styles.rankHeader}>
          <Text style={styles.rankTitle}>
            {preview ? '예상 내 순위 ' : '내 순위 '}
            <Text style={styles.rankValue}>
              {stats.myRank != null ? `${stats.myRank}등` : '-'}
            </Text>
          </Text>
          {verdict && (
            <View style={[styles.verdict, { backgroundColor: TONE[verdict.tone].bg }]}>
              <Text style={[styles.verdictText, { color: TONE[verdict.tone].fg }]}>
                {verdict.label}
              </Text>
            </View>
          )}
        </View>

        {zones.length > 0 ? (
          <View>
            <View style={styles.track}>
              {zones.map((zone, i) => (
                <View
                  key={zone.label}
                  style={[
                    styles.zone,
                    { backgroundColor: zone.color },
                    i === 0 && styles.zoneFirst,
                    i === zones.length - 1 && styles.zoneLast,
                  ]}
                />
              ))}
              {markerPct != null && <View style={[styles.marker, { left: `${markerPct}%` }]} />}
            </View>
            <View style={styles.zoneLabels}>
              {zones.map((zone) => (
                <Text key={zone.label} style={styles.zoneLabel} numberOfLines={1}>
                  {zone.label}
                </Text>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.rankNote}>
            {stats.myRank == null ? '점수를 입력하면 순위가 표시됩니다.' : '입결 자료를 준비 중입니다.'}
          </Text>
        )}

        {stats.scoredApplicantCount != null && (
          <Text style={styles.rankNote}>점수를 입력한 지원자 {stats.scoredApplicantCount}명 기준</Text>
        )}
      </View>

      {/* 성적 분포 */}
      {distribution.length > 0 && (
        <View style={styles.distribution}>
          <View style={styles.distributionHeader}>
            <Text style={styles.sectionTitle}>지원자 성적 분포</Text>
            {(stats.scoreAvg != null || stats.scoreBest != null) && (
              <Text style={styles.distributionMeta}>
                {stats.scoreAvg != null ? `평균 ${Number(stats.scoreAvg).toFixed(digits)}` : ''}
                {stats.scoreAvg != null && stats.scoreBest != null ? '   ' : ''}
                {stats.scoreBest != null ? `최고 ${Number(stats.scoreBest).toFixed(digits)}` : ''}
              </Text>
            )}
          </View>
          {distribution.map((bin, index) => {
            const mine = isMyBin(bin.binStart, bin.binEnd, index);
            const width =
              bin.count === 0 ? 0 : Math.max(3, (bin.count / maxCount) * 100);
            return (
              <View key={`${bin.binStart}-${bin.binEnd}`} style={styles.binRow}>
                <Text style={[styles.binRange, mine && styles.binMine]}>
                  {Number(bin.binStart).toFixed(binDigits)}–{Number(bin.binEnd).toFixed(binDigits)}
                </Text>
                <View style={styles.binTrack}>
                  <View
                    style={[
                      styles.binBar,
                      { width: `${width}%` },
                      mine && styles.binBarMine,
                    ]}
                  />
                </View>
                <Text style={[styles.binCount, mine && styles.binMine]}>
                  {mine ? '나 · ' : ''}
                  {bin.count}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {stats.dataYear != null && (
        <Text style={styles.footnote}>{stats.dataYear}학년도 모집 자료 기준</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 14,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
    gap: 18,
  },
  closedPanel: {
    gap: 0,
  },
  closedText: {
    fontSize: theme.typography.small,
    color: theme.colors.textMuted,
  },

  headline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  ratio: {
    marginTop: 2,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: theme.colors.text,
    ...theme.numeric,
  },
  ratioUnit: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
    color: theme.colors.textMuted,
  },
  ratioPending: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  headcount: {
    alignItems: 'flex-end',
    gap: 2,
    paddingBottom: 4,
  },
  headcountLine: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  headcountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    ...theme.numeric,
  },

  rankBlock: {
    padding: 14,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceMuted,
    gap: 12,
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  rankValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    ...theme.numeric,
  },
  verdict: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
  },
  verdictText: {
    fontSize: 12,
    fontWeight: '800',
  },
  track: {
    flexDirection: 'row',
    gap: 3,
    height: 10,
    marginHorizontal: 2,
  },
  zone: {
    flex: 1,
    height: 10,
    borderRadius: 2,
  },
  zoneFirst: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  zoneLast: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  marker: {
    position: 'absolute',
    top: -4,
    width: 18,
    height: 18,
    marginLeft: -9,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: theme.colors.ink,
    backgroundColor: theme.colors.surface,
  },
  zoneLabels: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 3,
  },
  zoneLabel: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    ...theme.numeric,
  },
  rankNote: {
    fontSize: 12,
    color: theme.colors.textSubtle,
  },

  distribution: {
    gap: 8,
  },
  distributionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  distributionMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
    ...theme.numeric,
  },
  binRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  binRange: {
    width: 64,
    fontSize: 12,
    color: theme.colors.textMuted,
    ...theme.numeric,
  },
  binTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceMuted,
  },
  binBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: theme.colors.bronzeLine,
  },
  binBarMine: {
    backgroundColor: theme.colors.bronzeDeep,
  },
  binCount: {
    minWidth: 40,
    textAlign: 'right',
    fontSize: 12,
    color: theme.colors.textMuted,
    ...theme.numeric,
  },
  binMine: {
    fontWeight: '800',
    color: theme.colors.bronzeDeep,
  },
  footnote: {
    marginTop: -6,
    fontSize: 11,
    color: theme.colors.textSubtle,
  },
});
