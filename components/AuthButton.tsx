import React from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import theme from '../lib/theme';

type AuthButtonProps = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  backgroundColor?: string;
  textColor?: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
};

/** 화면의 주요 동작 버튼 (로그인·제출 등) */
export default function AuthButton({
  label,
  onPress,
  backgroundColor,
  textColor,
  icon,
  style,
  loading = false,
  disabled = false,
}: AuthButtonProps) {
  const bg = backgroundColor ?? theme.colors.ink;
  const color = textColor ?? theme.colors.ivory;
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        inactive && !loading && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.label, { color }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: theme.tracking.body,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
