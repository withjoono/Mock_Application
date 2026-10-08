import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import theme from '../lib/theme';

export type LabeledInputProps = TextInputProps & {
  label: string;
  hint?: string;
  containerStyle?: ViewStyle;
};

export default function LabeledInput({ label, hint, containerStyle, style, ...props }: LabeledInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={theme.colors.muted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  hint: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
  input: {
    height: 44,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
});