import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import theme from '../lib/theme';

export type SegmentedTabsProps = {
  tabs: { key: string; label: string }[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
};

export default function SegmentedTabs({ tabs, activeKey, onChange, style }: SegmentedTabsProps) {
  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active ? styles.activeTab : styles.inactiveTab]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.9}
          >
            <Text style={[styles.label, { color: active ? theme.colors.onPrimary : theme.colors.text }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  inactiveTab: {
    backgroundColor: theme.colors.surface,
  },
  label: {
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
});