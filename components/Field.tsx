import React, { forwardRef, useState } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import theme from '../lib/theme';

interface FieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  /** 입력칸 왼쪽 아이콘 */
  leading?: React.ReactNode;
  /** 입력칸 오른쪽 (단위, 버튼 등) */
  trailing?: React.ReactNode;
}

/** 라벨 + 입력칸. 포커스되면 브론즈 테두리 */
const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, hint, leading, trailing, style, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.box, focused && styles.boxFocused]}>
        {leading}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textSubtle}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {trailing}
      </View>
      {!!hint && (
        <Text style={styles.hint} lineBreakStrategyIOS="hangul-word">
          {hint}
        </Text>
      )}
    </View>
  );
});

export default Field;

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: theme.typography.small,
    fontWeight: '700',
    color: theme.colors.text,
  },
  box: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surfaceMuted,
  },
  boxFocused: {
    borderColor: theme.colors.bronzeDeep,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },
});
