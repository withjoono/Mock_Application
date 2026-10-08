import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import theme from '../lib/theme';

export type FeaturePaddleProps = {
  label: string;
  active?: boolean;
  emphasis?: number; // 1.0 = full size (center), <1 for smaller (above/below)
  style?: ViewStyle;
};

export default function FeaturePaddle({ label, active = false, emphasis = 1, style }: FeaturePaddleProps) {
  // Compute a stronger fade for inactive items to resemble a wheel picker.
  const inactiveOpacity = Math.max(0.3, Math.min(0.55, emphasis * 0.5));

  const containerStyles = [
    styles.container,
    active ? styles.active : styles.inactive,
    {
      transform: [{ scale: emphasis }],
      opacity: active ? 1 : inactiveOpacity,
    },
    style,
  ];

  const textColor = active ? theme.colors.onPrimary : theme.colors.muted;

  return (
    <View style={containerStyles}>
      <View style={styles.accentBar} />
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  active: {
    backgroundColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  inactive: {
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  accentBar: {
    width: 6,
    height: 24,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    opacity: 0.9,
    marginRight: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});