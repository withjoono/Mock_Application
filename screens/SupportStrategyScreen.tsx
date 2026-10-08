import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../lib/theme';
import AppHeader from '../components/AppHeader';
import HamburgerMenu from '../components/HamburgerMenu';
import { useNavigation } from '@react-navigation/native';

export default function SupportStrategyScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = useNavigation<any>();

  const columns = ['가군', '나군', '다군'];
  // Rows mirror the attachment: each row label with three values for A/B/C groups
  const rows: { label: string; values: (string | { text: string; link?: boolean })[] }[] = [
    { label: '대학', values: ['건국대', '경희대', '홍익대'] },
    { label: '전형', values: ['일반', '일반', '일반'] },
    { label: '모집단위', values: ['경영학과', '경영학과', '경영학과'] },
    { label: '모집인원', values: ['74', '30', '20'] },
    { label: '내점수', values: ['958.20', '930.00', '925.00'] },
    { label: '예측컷', values: ['958', '939', '926'] },
    { label: '차이', values: ['0.20', { text: '(9.00)' }, { text: '(1.00)' }] },
    { label: '위험도', values: ['적정', '위험', '소신'] },
    { label: '해당대학유불리', values: [{ text: '상세보기', link: true }, { text: '상세보기', link: true }, { text: '상세보기', link: true }] },
    { label: '세부내역', values: [{ text: '상세보기', link: true }, { text: '상세보기', link: true }, { text: '상세보기', link: true }] },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader title="지원 전략" onPressMenu={() => setMenuOpen(true)} />
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
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.headerCell, styles.firstCol]}>군</Text>
            {columns.map((c) => (
              <Text key={c} style={[styles.headerCell, styles.col]}>{c}</Text>
            ))}
          </View>

          {/* Body */}
          {rows.map((r, idx) => (
            <View key={r.label} style={[styles.row, idx % 2 === 1 && styles.altRow]}>
              <Text style={[styles.firstCol, styles.labelCell]}>{r.label}</Text>
              {r.values.map((v, i) => {
                const value = typeof v === 'string' ? { text: v } : v;
                const isMinus = /\(.*\)/.test(value.text);
                const isLink = !!value.link;
                return (
                  <View key={`${r.label}-${i}`} style={[styles.col, styles.valueCol]}>
                    {isLink ? (
                      <TouchableOpacity activeOpacity={0.8}>
                        <Text style={styles.linkText}>{value.text}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={[styles.valueText, isMinus && { color: theme.colors.error }]}>{value.text}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  table: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerRow: { backgroundColor: '#D3F3D6' },
  altRow: { backgroundColor: theme.colors.surfaceMuted },
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
    borderRightWidth: 1,
    borderRightColor: theme.colors.outline,
  },
  headerCell: {
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  labelCell: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  valueCol: { alignItems: 'center', justifyContent: 'center' },
  valueText: { color: theme.colors.text, textAlign: 'center' },
  linkText: { color: theme.colors.primary, fontWeight: '700' },
});