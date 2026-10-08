import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Pressable, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../lib/theme';

export type DropdownOption = { key: string; label: string };

interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: readonly DropdownOption[];
  value?: string;
  onChange: (key: string) => void;
  containerStyle?: ViewStyle;
}

export default function Dropdown({ label, placeholder = '선택하세요', options, value, onChange, containerStyle }: DropdownProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => options.find(o => o.key === value), [options, value]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.field}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.valueText, !selected && styles.placeholderText]}>
          {selected ? selected.label : placeholder}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.muted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label || '항목 선택'}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <MaterialIcons name="close" size={22} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.xs }}>
              {options.map((opt) => {
                const isSelected = opt.key === value;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => {
                      onChange(opt.key);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{opt.label}</Text>
                    {isSelected ? (
                      <MaterialIcons name="check" size={18} color={theme.colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
  },
  field: {
    height: 44,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueText: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  placeholderText: {
    color: theme.colors.muted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  sheetHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  sheetTitle: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },
  optionRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  optionRowSelected: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  optionLabel: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  optionLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});