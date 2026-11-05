import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import theme from '../lib/theme';
import type { IMaSeason } from '../lib/api/features/mock-application';

export type SeasonStatus = 'open' | 'upcoming' | 'closed' | 'loading' | 'unknown';

const DAY = 24 * 60 * 60 * 1000;

/** 시즌 상태와 남은 날짜 */
export function getSeasonStatus(season: IMaSeason | undefined, loading: boolean) {
  if (!season) return { status: (loading ? 'loading' : 'unknown') as SeasonStatus, dday: null };
  const now = Date.now();
  const open = new Date(season.openAt).getTime();
  const close = new Date(season.closeAt).getTime();
  if (season.isOpen) {
    return { status: 'open' as SeasonStatus, dday: Math.max(0, Math.ceil((close - now) / DAY)) };
  }
  if (now < open) {
    return { status: 'upcoming' as SeasonStatus, dday: Math.max(0, Math.ceil((open - now) / DAY)) };
  }
  return { status: 'closed' as SeasonStatus, dday: null };
}

/** '9.1 – 9.30' 형태의 운영 기간 */
export function formatPeriod(season?: IMaSeason) {
  if (!season) return '';
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}.${d.getDate()}`;
  };
  return `${fmt(season.openAt)} – ${fmt(season.closeAt)}`;
}

const STATUS_COPY: Record<SeasonStatus, { label: string; color: string }> = {
  open: { label: '진행 중', color: theme.colors.positiveOnDark },
  upcoming: { label: '오픈 예정', color: theme.colors.cautionOnDark },
  closed: { label: '마감', color: theme.colors.ivorySubtle },
  loading: { label: '확인 중', color: theme.colors.ivorySubtle },
  unknown: { label: '일정 미정', color: theme.colors.ivorySubtle },
};

function StatusChip({ status }: { status: SeasonStatus }) {
  const { label, color } = STATUS_COPY[status];
  return (
    <View style={styles.chip}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

interface SeasonCardProps {
  title: string;
  qualifier?: string;
  caption: string;
  season?: IMaSeason;
  status: SeasonStatus;
  dday: number | null;
  onPress: () => void;
  accessibilityLabel: string;
}

/** 지금 지원할 수 있는 시즌 — 홈에서 가장 크게 */
export function FeaturedSeasonCard({
  title,
  qualifier,
  caption,
  season,
  dday,
  onPress,
  accessibilityLabel,
}: SeasonCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel}, 진행 중`}
      style={({ pressed }) => [styles.featured, pressed && styles.pressed]}
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow" cx="100%" cy="0%" rx="90%" ry="120%">
            <Stop offset="0" stopColor={theme.colors.bronze} stopOpacity="0.34" />
            <Stop offset="1" stopColor={theme.colors.bronze} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>

      <View style={styles.featuredTop}>
        <StatusChip status="open" />
        {dday != null && (
          <Text style={styles.featuredDday}>{dday === 0 ? '오늘 마감' : `마감 D-${dday}`}</Text>
        )}
      </View>

      <Text style={styles.featuredTitle}>
        {title}
        {!!qualifier && <Text style={styles.featuredQualifier}>{`  ${qualifier}`}</Text>}
      </Text>
      <Text style={styles.featuredCaption}>{caption}</Text>

      <View style={styles.featuredBottom}>
        <Text style={styles.featuredPeriod}>{formatPeriod(season)}</Text>
        <View style={styles.featuredCta}>
          <Text style={styles.featuredCtaText}>지원하기</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.ink} />
        </View>
      </View>
    </Pressable>
  );
}

/** 그 밖의 시즌 — 목록의 한 줄 */
export function SeasonRow({
  title,
  qualifier,
  caption,
  season,
  status,
  dday,
  onPress,
  accessibilityLabel,
}: SeasonCardProps) {
  const period = formatPeriod(season);
  const meta =
    status === 'upcoming' && dday != null ? `${period}  ·  D-${dday}` : period;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel}, ${STATUS_COPY[status].label}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
          {!!qualifier && <Text style={styles.rowQualifier}>{`  ${qualifier}`}</Text>}
        </Text>
        <Text style={styles.rowCaption} numberOfLines={1}>
          {caption}
        </Text>
      </View>
      <View style={styles.rowSide}>
        <StatusChip status={status} />
        {!!meta && <Text style={styles.rowMeta}>{meta}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  featured: {
    overflow: 'hidden',
    borderRadius: theme.radii.lg,
    padding: 20,
    backgroundColor: theme.colors.inkRaised,
    borderWidth: 1,
    borderColor: 'rgba(184, 148, 106, 0.45)',
  },
  featuredTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredDday: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.bronze,
    ...theme.numeric,
  },
  featuredTitle: {
    marginTop: 14,
    fontSize: theme.typography.title + 2,
    fontWeight: '800',
    letterSpacing: theme.tracking.title,
    color: theme.colors.ivory,
  },
  featuredQualifier: {
    fontSize: theme.typography.subheading,
    fontWeight: '700',
    letterSpacing: theme.tracking.body,
    color: theme.colors.bronze,
  },
  featuredCaption: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.ivoryMuted,
  },
  featuredBottom: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredPeriod: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.ivoryMuted,
    ...theme.numeric,
  },
  featuredCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.bronze,
  },
  featuredCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.ink,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  rowPressed: {
    backgroundColor: 'rgba(245, 239, 230, 0.04)',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: theme.typography.subheading,
    fontWeight: '700',
    letterSpacing: theme.tracking.heading,
    color: theme.colors.ivory,
  },
  rowQualifier: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.bronze,
  },
  rowCaption: {
    marginTop: 3,
    fontSize: 12,
    color: theme.colors.ivorySubtle,
  },
  rowSide: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowMeta: {
    fontSize: 11,
    color: theme.colors.ivorySubtle,
    ...theme.numeric,
  },
});
