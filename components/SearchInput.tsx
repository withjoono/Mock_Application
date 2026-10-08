import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ViewStyle, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../lib/theme';

export type SearchInputProps = TextInputProps & {
  label: string;
  hint?: string;
  containerStyle?: ViewStyle;
  onIconPress?: () => void;
};

export default function SearchInput({ label, hint, containerStyle, style, onIconPress, ...props }: SearchInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.muted}
          {...props}
        />
        <TouchableOpacity style={styles.iconBtn} onPress={onIconPress} activeOpacity={0.8}>
          <Ionicons name="search" size={18} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: theme.typography.body, fontWeight: '600', color: theme.colors.text },
  hint: { fontSize: theme.typography.small, color: theme.colors.muted },
  inputWrapper: {
    height: 44,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingLeft: theme.spacing.md,
    paddingRight: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  iconBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
});