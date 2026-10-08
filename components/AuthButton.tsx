import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import theme from '../lib/theme';

type AuthButtonProps = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  backgroundColor?: string;
  textColor?: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function AuthButton({ label, onPress, backgroundColor, textColor, icon, style }: AuthButtonProps) {
  const bg = backgroundColor ?? theme.colors.surface;
  const color = textColor ?? theme.colors.text;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.button, { backgroundColor: bg }, style]}
    >
      <View style={styles.leftIcon}>{icon ?? <AntDesign name="login" size={18} color={color} />}</View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  leftIcon: {
    position: 'absolute',
    left: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.body,
    fontWeight: '600',
  },
});