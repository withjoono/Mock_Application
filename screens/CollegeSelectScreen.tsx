import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../lib/theme';
import SegmentedTabs from '../components/SegmentedTabs';
import SearchInput from '../components/SearchInput';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function CollegeSelectScreen() {
  const navigation = useNavigation<any>();
  const [army, setArmy] = useState<'A' | 'B' | 'C'>('A'); // 가/나/다군
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [admissionType, setAdmissionType] = useState(''); // 전형명
  const [results, setResults] = useState<{ college: string; department: string }[]>([]);

  const canSearch = useMemo(() => college.trim().length > 0 || department.trim().length > 0 || admissionType.trim().length > 0, [college, department, admissionType]);

  const handleSearch = () => {
    if (!canSearch) return;
    // NOTE: 실제 API 연동 전까지는 모의 결과 생성
    setResults([{ college: college || '경희대', department: department || '영문학과' }]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>모의지원 학과 검색</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <SegmentedTabs
            tabs={[
              { key: 'A', label: '가군' },
              { key: 'B', label: '나군' },
              { key: 'C', label: '다군' },
            ]}
            activeKey={army}
            onChange={(key) => setArmy(key as 'A' | 'B' | 'C')}
            style={{ marginBottom: theme.spacing.md }}
          />

          <SearchInput
            label="대학명"
            placeholder="대학명을 입력해주세요"
            value={college}
            onChangeText={setCollege}
            onIconPress={handleSearch}
            containerStyle={{ marginBottom: theme.spacing.sm }}
          />

          <SearchInput
            label="전형명"
            placeholder="전형명을 입력해주세요"
            value={admissionType}
            onChangeText={setAdmissionType}
            onIconPress={handleSearch}
            containerStyle={{ marginBottom: theme.spacing.sm }}
          />

          <SearchInput
            label="학과명"
            placeholder="학과명을 입력해주세요"
            value={department}
            onChangeText={setDepartment}
            onIconPress={handleSearch}
          />

          <TouchableOpacity
            style={[styles.searchBtn, !canSearch && styles.searchBtnDisabled]}
            disabled={!canSearch}
            onPress={handleSearch}
            activeOpacity={0.9}
          >
            <Text style={[styles.searchBtnText, { color: canSearch ? theme.colors.onPrimary : theme.colors.muted }]}>학과 검색하기</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>검색 결과</Text>

        {results.length === 0 ? (
          <Text style={styles.emptyText}>검색 결과가 없습니다. 위 모의지원 학과 검색에서 학과를 검색해주세요.</Text>
        ) : (
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRowTable]}>
              <Text style={[styles.cell, styles.headerCell]}>대학</Text>
              <Text style={[styles.cell, styles.headerCell]}>학과명</Text>
              <Text style={[styles.cell, styles.headerCell]}>모의지원 선택</Text>
            </View>
            {results.map((r, idx) => (
              <View key={`${r.college}-${r.department}-${idx}`} style={styles.row}>
                <Text style={styles.cell}>{r.college}</Text>
                <Text style={styles.cell}>{r.department}</Text>
                <TouchableOpacity style={styles.selectBtn}>
                  <Text style={styles.selectText}>선택</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: theme.spacing.lg,
  },
  searchBtn: {
    marginTop: theme.spacing.md,
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnDisabled: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  searchBtnText: {
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: theme.typography.body,
    color: theme.colors.muted,
  },
  table: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerRowTable: { backgroundColor: theme.colors.surfaceVariant },
  cell: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  headerCell: { fontWeight: '700' },
  selectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    marginRight: theme.spacing.md,
  },
  selectText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});