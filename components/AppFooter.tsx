import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import theme from '../lib/theme';

/**
 * 공용 푸터 — tskool.kr(T Skool)과 동일한 카피라이트 표기
 */
export default function AppFooter() {
  return (
    <View style={styles.container}>
      <View style={styles.linkRow}>
        <TouchableOpacity onPress={() => Linking.openURL('https://www.tskool.kr')} hitSlop={8}>
          <Text style={styles.link}>tskool.kr</Text>
        </TouchableOpacity>
        <Text style={styles.divider}>·</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://www.tskool.kr/tmoji-privacy.html')}
          hitSlop={8}
        >
          <Text style={styles.link}>개인정보처리방침</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.copyright}>
        © {new Date().getFullYear()} T Skool. All rights reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    color: theme.colors.muted,
    fontSize: theme.typography.small,
  },
  link: {
    fontSize: theme.typography.small,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  copyright: {
    fontSize: 11,
    color: theme.colors.muted,
  },
});
