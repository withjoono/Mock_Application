import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../lib/theme';

interface AppHeaderProps {
  title?: string;
  /** 제목 아래 보조 문구 */
  subtitle?: string;
  /** 있으면 왼쪽에 뒤로가기 버튼 */
  onBack?: () => void;
  /** 있으면 왼쪽에 메뉴 버튼 (onBack 이 없을 때) */
  onPressMenu?: () => void;
  /** 오른쪽 슬롯 */
  right?: React.ReactNode;
  /** dark: 에스프레소 배경 위 / light: 밝은 배경 위 */
  tone?: 'light' | 'dark';
}

export default function AppHeader({
  title,
  subtitle,
  onBack,
  onPressMenu,
  right,
  tone = 'light',
}: AppHeaderProps) {
  const dark = tone === 'dark';
  const fg = dark ? theme.colors.ivory : theme.colors.text;
  const left = onBack
    ? { icon: 'chevron-back' as const, label: '뒤로 가기', onPress: onBack }
    : onPressMenu
      ? { icon: 'menu' as const, label: '메뉴 열기', onPress: onPressMenu }
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {left && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={left.label}
            onPress={left.onPress}
            hitSlop={8}
            style={[styles.iconBtn, dark ? styles.iconBtnDark : styles.iconBtnLight]}
          >
            <Ionicons name={left.icon} size={20} color={fg} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        {!!title && (
          <Text style={[styles.title, { color: fg }]} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        )}
        {!!subtitle && (
          <Text
            style={[styles.subtitle, { color: dark ? theme.colors.ivoryMuted : theme.colors.textMuted }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  side: {
    width: 64,
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDark: {
    backgroundColor: 'rgba(245, 239, 230, 0.08)',
  },
  iconBtnLight: {
    backgroundColor: 'rgba(27, 23, 18, 0.05)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.subheading,
    fontWeight: '700',
    letterSpacing: theme.tracking.heading,
  },
  subtitle: {
    marginTop: 1,
    fontSize: theme.typography.caption,
    fontWeight: '500',
  },
});
