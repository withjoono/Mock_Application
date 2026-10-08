import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Dropdown from './Dropdown';
import theme from '../lib/theme';
import { ADMISSION_TYPE_OPTIONS } from '../lib/constants';

export type AdmissionsRowValue = {
  universityName: string;
  admissionType?: string; // key from ADMISSION_TYPE_OPTIONS
  unitName: string;
};

interface AdmissionsRowProps {
  index: number;
  value: AdmissionsRowValue;
  onChange: (next: AdmissionsRowValue) => void;
  onPressSearchUniversity?: () => void;
  onPressSearchUnit?: () => void;
}

export default function AdmissionsRow({ index, value, onChange, onPressSearchUniversity, onPressSearchUnit }: AdmissionsRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.colIndex}>
        <Text style={styles.indexText}>{index}</Text>
      </View>

      <View style={[styles.col, styles.colUniversity]}>
        <View style={styles.inputCell}>
          <TextInput
            style={styles.input}
            placeholder="입력"
            placeholderTextColor={theme.colors.muted}
            value={value.universityName}
            onChangeText={(t) => onChange({ ...value, universityName: t })}
          />
          <TouchableOpacity style={styles.iconBtn} onPress={onPressSearchUniversity} activeOpacity={0.8}>
            <Ionicons name="search" size={16} color={theme.colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.col, styles.colAdmission]}>
        <Dropdown
          options={ADMISSION_TYPE_OPTIONS as any}
          value={value.admissionType}
          onChange={(k) => onChange({ ...value, admissionType: k })}
          placeholder="선택"
        />
      </View>

      <View style={[styles.col, styles.colUnit]}>
        <View style={styles.inputCell}>
          <TextInput
            style={styles.input}
            placeholder="입력"
            placeholderTextColor={theme.colors.muted}
            value={value.unitName}
            onChangeText={(t) => onChange({ ...value, unitName: t })}
          />
          <TouchableOpacity style={styles.iconBtn} onPress={onPressSearchUnit} activeOpacity={0.8}>
            <Ionicons name="search" size={16} color={theme.colors.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const CELL_HEIGHT = 44;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  colIndex: {
    width: 28,
    height: CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  indexText: {
    fontSize: theme.typography.body,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  col: {
    height: CELL_HEIGHT,
    justifyContent: 'center',
  },
  colUniversity: { flex: 1.2 },
  colAdmission: { flex: 1 },
  colUnit: { flex: 1.2 },
  inputCell: {
    height: CELL_HEIGHT,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingLeft: theme.spacing.md,
    paddingRight: CELL_HEIGHT * 0.9,
    justifyContent: 'center',
  },
  input: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  iconBtn: {
    position: 'absolute',
    right: 8,
    top: (CELL_HEIGHT - 28) / 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});