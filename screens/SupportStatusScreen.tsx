import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../lib/theme';
import AppHeader from '../components/AppHeader';
import SegmentedTabs from '../components/SegmentedTabs';
import { useNavigation } from '@react-navigation/native';
import HamburgerMenu from '../components/HamburgerMenu';

export default function SupportStatusScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'rank' | 'cut'>('rank');
  const [menuOpen, setMenuOpen] = useState(false);

  const columns = ['가군', '나군', '다군'];
  const rows: { label: string; values: string[]; shaded?: boolean }[] = [
    { label: '대학', values: ['경희대', '중앙대', '홍익대'] },
    { label: '학과', values: ['경영학과', '경영학과', '경영학과'] },
    { label: '정원', values: ['30명', '40명', '40명'] },
    { label: '수시이월', values: ['미발표', '미발표', '미발표'] },
    { label: '모집인원\n(정원+수시이월)', values: ['30명', '40명', '40명'], shaded: true },
    { label: '3개년 평균 경쟁률', values: ['3.5', '3.5', '3.5'] },
    { label: '평균경쟁률로 산정한\n예측 지원자수', values: ['75명', '75명', '75명'], shaded: true },
    { label: '최초합 합격 순위', values: ['30/75', '30/75', '30/75'] },
    { label: '3개년 평균 추합 경쟁', values: ['20명', '20명', '20명'] },
    { label: '추합 합격 순위', values: ['50', '60', '60'], shaded: true },
    { label: '모의 지원자 수', values: ['25명', '25명', '25명'] },
    { label: '내 등수', values: ['10', '15', '15'], shaded: true },
  ];

  const footerRows = [
    { label: '예측 등수', values: ['105명 중\n45등', '105명 중\n45등', '105명 중\n45등'] },
    { label: '최초합 판단', values: ['소심', '위험', '적정'] },
    { label: '추합 판단', values: ['소심', '위험', '적정'] },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader title="나의 모의지원 현황(순위)" onPressMenu={() => setMenuOpen(true)} />
      <HamburgerMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigateScoreInput={() => navigation.navigate('ScoreInput')}
        onNavigateScoreAnalysis={() => navigation.navigate('ScoreAnalysis')}
        onNavigateStrategy={() => navigation.navigate('Strategy')}
        onNavigateCollegeSelect={() => navigation.navigate('CollegeSelect')}
        onNavigateSupportStatus={() => navigation.navigate('SupportStatus')}
        onNavigateSupportStrategy={() => navigation.navigate('SupportStrategy')}
        onNavigateMockApply={() => navigation.navigate('MockApply')}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <SegmentedTabs
            tabs={[
              { key: 'rank', label: '모의지원 순위' },
              { key: 'cut', label: '예측컷' },
            ]}
            activeKey={activeTab}
            onChange={(key) => {
              if (key === 'cut') {
                navigation.navigate('SupportCut');
              } else {
                setActiveTab('rank');
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

          {footerRows.map((r) => (
            <View key={r.label} style={[styles.row, styles.footerRow]}>
              <Text style={[styles.firstCol, styles.footerLabel]}>{r.label}</Text>
              {r.values.map((v, i) => (
                <Text key={`${r.label}-${i}`} style={[styles.col, styles.footerValue]}>{v}</Text>
              ))}
            </View>
          ))}
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
    width: 130,
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
  footerRow: {
    backgroundColor: theme.colors.surface,
  },
  footerLabel: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  footerValue: {
    fontWeight: '700',
    color: theme.colors.text,
  },
});