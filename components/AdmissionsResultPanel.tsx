import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '../lib/theme';
import Dropdown from './Dropdown';
import { RESULT_PANEL_SECTIONS } from '../lib/constants';
import type { AdmissionsRowValue } from './AdmissionsRow';

interface AdmissionsResultPanelProps {
  rows: AdmissionsRowValue[];
  onPressDetail?: () => void;
}

export default function AdmissionsResultPanel({ rows, onPressDetail }: AdmissionsResultPanelProps) {
  // 생성 가능한 드롭다운 옵션: 입력이 하나라도 있는 행만 표시, 없으면 1~6 모두
  const options = useMemo(() => {
    const list = rows.map((r, i) => ({
      index: i,
      hasAny: !!(r.universityName || r.admissionType || r.unitName),
      label: `${i + 1}번${r.universityName ? ` · ${r.universityName}` : ''}${r.unitName ? `· ${r.unitName}` : ''}`,
    }));
    const filtered = list.filter(l => l.hasAny);
    const base = (filtered.length ? filtered : list).map(l => ({ key: String(l.index), label: l.label }));
    return base;
  }, [rows]);

  const firstKey = options[0]?.key ?? '0';
  const [selectedKey, setSelectedKey] = useState<string>(firstKey);
  useEffect(() => {
    // rows/옵션 변경 시 선택값 보정
    if (!options.find(o => o.key === selectedKey)) {
      setSelectedKey(options[0]?.key ?? '0');
    }
  }, [options, selectedKey]);

  const selectedIndex = Number(selectedKey || 0);
  const selected = rows[selectedIndex] || { universityName: '', admissionType: undefined, unitName: '' };

  // 표에서 사용할 값 매핑(지금은 입력값만 연동, 기타 항목은 추후 연산 연동)
  const valueMap: Record<string, string> = {
    universityName: selected.universityName || '-',
    admissionType: selected.admissionType || '-',
    unitName: selected.unitName || '-',
    current_univScore: '-',
    current_percentile: '-',
    last_univScore: '-',
    last_percentile: '-',
    diff_univScore: '-',
    diff_percentile: '-',
    pred_univScore: '-',
    pred_percentile: '-',
    predDiff_univScore: '-',
    predDiff_percentile: '-',
    advantage: '상세보기',
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Dropdown
          label={undefined}
          placeholder="대학 선택"
          options={options}
          value={selectedKey}
          onChange={setSelectedKey}
          containerStyle={{ width: 200 }}
        />
      </View>

      {RESULT_PANEL_SECTIONS.map((section) => (
        <View key={section.title} style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.rows.map((row) => {
            const isLinkRow = row.key === 'advantage';
            return (
              <View key={row.key} style={styles.dataRow}>
                <View style={styles.labelCol}>
                  <Text style={styles.labelText}>{row.label}</Text>
                </View>
                <View style={styles.valueCol}>
                  {isLinkRow ? (
                    <TouchableOpacity onPress={onPressDetail} activeOpacity={0.8}>
                      <Text style={[styles.valueText, styles.linkText]}>{valueMap[row.key]}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.valueText}>{valueMap[row.key]}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sectionBlock: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
    fontWeight: '700',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  labelCol: {
    width: '44%',
    backgroundColor: theme.colors.surfaceVariant,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  valueCol: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  labelText: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
    fontWeight: '700',
  },
  valueText: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});