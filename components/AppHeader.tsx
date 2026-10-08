import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../lib/theme';

interface AppHeaderProps {
  title?: string;
  onPressMenu?: () => void;
}

export default function AppHeader({ title, onPressMenu }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity accessibilityLabel="메뉴 열기" onPress={onPressMenu} style={styles.iconBtn}>
        <Ionicons name="menu" size={22} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>{title ?? ''}</Text>
      <View style={styles.rightPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPlaceholder: { width: 36, height: 36 },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },
});