import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import theme from '../lib/theme';
import {
  FrequencyDistributionItem,
  PASS_STATUS_COLORS,
  PASS_STATUS_BG_COLORS,
} from '../lib/types/mock-application';

interface FrequencyDistributionTableProps {
  data: FrequencyDistributionItem[];
  myScore?: number;
  recruitmentCount?: number;
}

export default function FrequencyDistributionTable({
  data,
  myScore,
  recruitmentCount,
}: FrequencyDistributionTableProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>도수분포 데이터가 없습니다</Text>
      </View>
    );
  }

  // 내 점수가 속한 구간 찾기
  const myScoreRange = myScore
    ? data.find((item) => myScore >= item.scoreLower && myScore < item.scoreUpper)
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>도수분포표</Text>
      <Text style={styles.subtitle}>
        총 {data.reduce((sum, item) => sum + item.applicantCount, 0)}명 지원
        {recruitmentCount ? ` / 모집인원 ${recruitmentCount}명` : ''}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* 헤더 */}
          <View style={styles.headerRow}>
            <View style={[styles.cell, styles.headerCell, styles.scoreCell]}>
              <Text style={styles.headerText}>점수 구간</Text>
            </View>
            <View style={[styles.cell, styles.headerCell, styles.countCell]}>
              <Text style={styles.headerText}>인원</Text>
            </View>
            <View style={[styles.cell, styles.headerCell, styles.countCell]}>
              <Text style={styles.headerText}>누적</Text>
            </View>
            <View style={[styles.cell, styles.headerCell, styles.statusCell]}>
              <Text style={styles.headerText}>합격상태</Text>
            </View>
          </View>

          {/* 데이터 행 */}
          {data.map((item, index) => {
            const isMyRange =
              myScoreRange &&
              item.scoreLower === myScoreRange.scoreLower &&
              item.scoreUpper === myScoreRange.scoreUpper;

            return (
              <View
                key={index}
                style={[
                  styles.dataRow,
                  isMyRange && styles.highlightRow,
                  index % 2 === 0 && styles.evenRow,
                ]}
              >
                <View style={[styles.cell, styles.scoreCell]}>
                  <Text style={[styles.cellText, isMyRange && styles.highlightText]}>
                    {item.scoreLower.toFixed(1)} ~ {item.scoreUpper.toFixed(1)}
                  </Text>
                </View>
                <View style={[styles.cell, styles.countCell]}>
                  <Text style={[styles.cellText, isMyRange && styles.highlightText]}>
                    {item.applicantCount}명
                  </Text>
                </View>
                <View style={[styles.cell, styles.countCell]}>
                  <Text style={[styles.cellText, isMyRange && styles.highlightText]}>
                    {item.cumulativeCount}명
                  </Text>
                </View>
                <View style={[styles.cell, styles.statusCell]}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: PASS_STATUS_BG_COLORS[item.passStatus] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: PASS_STATUS_COLORS[item.passStatus] },
                      ]}
                    >
                      {item.passStatus}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {myScore && myScoreRange && (
        <View style={styles.myScoreInfo}>
          <Text style={styles.myScoreLabel}>내 점수: </Text>
          <Text style={styles.myScoreValue}>{myScore.toFixed(1)}점</Text>
          <Text style={styles.myScoreRange}>
            ({myScoreRange.scoreLower.toFixed(1)} ~ {myScoreRange.scoreUpper.toFixed(1)} 구간)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
  },
  table: {
    minWidth: 350,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: theme.radii.sm,
    borderTopRightRadius: theme.radii.sm,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  evenRow: {
    backgroundColor: '#f9fafb',
  },
  highlightRow: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  cell: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCell: {
    paddingVertical: theme.spacing.sm + 2,
  },
  scoreCell: {
    width: 120,
  },
  countCell: {
    width: 60,
  },
  statusCell: {
    width: 80,
  },
  headerText: {
    color: theme.colors.onPrimary,
    fontSize: theme.typography.small,
    fontWeight: '600',
  },
  cellText: {
    fontSize: theme.typography.small,
    color: theme.colors.text,
  },
  highlightText: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  myScoreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  myScoreLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
  myScoreValue: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  myScoreRange: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
});
