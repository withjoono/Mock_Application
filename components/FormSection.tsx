import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import theme from '../lib/theme';

export type FormSectionProps = {
  title: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  children?: React.ReactNode;
};

export default function FormSection({ title, icon, style, children }: FormSectionProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },
  content: {
    gap: theme.spacing.sm,
  },
});