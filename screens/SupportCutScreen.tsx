import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../lib/theme';
import AppHeader from '../components/AppHeader';
import SegmentedTabs from '../components/SegmentedTabs';
import { useNavigation } from '@react-navigation/native';

export default function SupportCutScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'rank' | 'cut'>('cut');

  const columns = ['가군', '나군', '다군'];
  const rows: { label: string; values: string[]; shaded?: boolean }[] = [
    { label: '대학', values: ['경희대', '중앙대', '홍익대'] },
    { label: '학과', values: ['경영학과', '경영학과', '경영학과'] },
    { label: '내 점수', values: ['870', '870', '870'] },
    { label: '작년 최종등록자\n70%점수(추정)', values: ['870', '870', '870'], shaded: true },
    { label: '모의지원자 최초합\n70%점수(안정)', values: ['870', '870', '870'] },
    { label: '모의지원자 최초합\n95% 점수(소신)', values: ['870', '870', '870'], shaded: true },
    { label: '모의지원자 추합컷\n점수(위험)', values: ['870', '870', '870'] },
    { label: '최초합 예측컷\n(인센티브로 인한\n보정점수)', values: ['870', '870', '870'], shaded: true },
    { label: '차이', values: ['-15', '-15', '-15'] },
    { label: '합불 판단', values: ['소신', '위험', '적정'], shaded: true },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader title="나의 모의지원 현황(순위)" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <SegmentedTabs
            tabs={[
              { key: 'rank', label: '모의지원 순위' },
              { key: 'cut', label: '예측컷' },
            ]}
            activeKey={activeTab}
            onChange={(key) => {
              if (key === 'rank') {
                navigation.navigate('SupportStatus');
              } else {
                setActiveTab('cut');
              }
            }}
          />
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.headerCell, styles.firstCol]} />
            {columns.map((c) => (
              <Text key={c} style={[styles.headerCell, styles.col]}>{c}</Text>
            ))}
          </View>

          {rows.map((r, idx) => (
            <View key={r.label} style={[styles.row, idx % 2 === 1 && styles.altRow, r.shaded && styles.shadedRow]}>
              <Text style={[styles.firstCol, styles.labelCell]}>{r.label}</Text>
              {r.values.map((v, i) => (
                <Text key={`${r.label}-${i}`} style={[styles.col, styles.valueCell]}>{v}</Text>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.legendText}>내 점수</Text>
            <View style={[styles.legendDot, { backgroundColor: '#F5A623', marginLeft: 16 }]} />
            <Text style={styles.legendText}>최초합 예측컷</Text>
          </View>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>그래프 영역(Placeholder)</Text>
          </View>
          <View style={styles.axisLabels}>
            <Text style={styles.axisLabel}>{`가군\n경희대\n경영학과`}</Text>
            <Text style={styles.axisLabel}>{`나군\n중앙대\n경영학과`}</Text>
            <Text style={styles.axisLabel}>{`다군\n홍익대\n경영학과`}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: theme.spacing.sm,
  },
  table: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerRow: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  altRow: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  shadedRow: {
    backgroundColor: '#FFF6E5',
  },
  firstCol: {
    width: 140,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRightWidth: 1,
    borderRightColor: theme.colors.outline,
  },
  col: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    textAlign: 'center',
  },
  headerCell: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  labelCell: {
    color: theme.colors.muted,
  },
  valueCell: {
    color: theme.colors.text,
  },
  chartCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: theme.spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    marginLeft: 6,
    color: theme.colors.text,
    fontWeight: '700',
  },
  chartPlaceholder: {
    height: 160,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  chartPlaceholderText: {
    color: theme.colors.muted,
  },
  axisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  axisLabel: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.muted,
  },
});