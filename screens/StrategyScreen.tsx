import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../lib/theme';
import AppHeader from '../components/AppHeader';
import HamburgerMenu from '../components/HamburgerMenu';
import { useNavigation } from '@react-navigation/native';
import AdmissionsRow, { AdmissionsRowValue } from '../components/AdmissionsRow';
import AdmissionsResultPanel from '../components/AdmissionsResultPanel';

export default function StrategyScreen() {
  const navigation = useNavigation<any>();
  const [menuOpen, setMenuOpen] = useState(false);

  // 1~6 행 초기 상태
  const [rows, setRows] = useState<AdmissionsRowValue[]>(
    Array.from({ length: 6 }, () => ({ universityName: '', admissionType: undefined, unitName: '' }))
  );

  const filledCount = useMemo(() => rows.filter(r => r.universityName || r.admissionType || r.unitName).length, [rows]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader title="수시 Vs 정시 전략" onPressMenu={() => setMenuOpen(true)} />
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>전략 설계</Text>
          <Text style={styles.heroSubtitle}>수시와 정시를 균형 있게 준비하세요</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>수시 지원 대학 입력</Text>

          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, { width: 28 }]}>번호</Text>
            <Text style={[styles.headerCell, styles.headerFlex1_2]}>대학명</Text>
            <Text style={[styles.headerCell, styles.headerFlex1]}>전형명</Text>
            <Text style={[styles.headerCell, styles.headerFlex1_2]}>모집단위</Text>
          </View>

          <View style={{ height: theme.spacing.sm }} />

          {rows.map((row, idx) => (
            <View key={idx} style={{ marginBottom: theme.spacing.sm }}>
              <AdmissionsRow
                index={idx + 1}
                value={row}
                onChange={(next) => {
                  setRows((prev) => prev.map((r, i) => (i === idx ? next : r)));
                }}
                onPressSearchUniversity={() => {
                  // TODO: 연결될 검색 화면/시트
                }}
                onPressSearchUnit={() => {
                  // TODO: 연결될 모집단위 검색 화면/시트
                }}
              />
            </View>
          ))}

          <View style={styles.helperRow}>
            <Text style={styles.helperText}>입력된 항목: {filledCount} / 6</Text>
          </View>
        </View>

        <View style={{ height: theme.spacing.lg }} />

        {/* 결과 패널 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>수시 결과 요약</Text>
          <AdmissionsResultPanel rows={rows} onPressDetail={() => console.log('상세보기')} />
        </View>

        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  hero: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontSize: theme.typography.heading,
    fontWeight: '800',
    color: theme.colors.text,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: theme.typography.body,
    color: theme.colors.muted,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  headerCell: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
    fontWeight: '700',
  },
  headerFlex1: { flex: 1 },
  headerFlex1_2: { flex: 1.2 },
  helperRow: {
    marginTop: theme.spacing.sm,
  },
  helperText: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
  // footer styles removed after deleting the reset/save buttons
});