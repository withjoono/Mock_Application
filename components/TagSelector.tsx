import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import theme from '../lib/theme';

export type TagOption = { key: string; label: string };

export type TagSelectorProps = {
  options: TagOption[];
  value?: string;
  onChange?: (key: string) => void;
  style?: ViewStyle;
};

export default function TagSelector({ options, value, onChange, style }: TagSelectorProps) {
  return (
    <View style={[styles.row, style]}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange && onChange(opt.key)}
            activeOpacity={0.8}
            style={[styles.tag, active ? styles.tagActive : styles.tagInactive]}
          >
            <Text style={[styles.tagText, { color: active ? theme.colors.onPrimary : theme.colors.text }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tagInactive: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outline,
  },
  tagText: {
    fontSize: theme.typography.body,
    fontWeight: '600',
  },
});