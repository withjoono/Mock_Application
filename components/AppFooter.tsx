import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import theme from '../lib/theme';

/**
 * 공용 푸터 — tskool.kr(T Skool)과 동일한 카피라이트 표기
 */
export default function AppFooter({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark';
  const linkColor = dark ? theme.colors.ivoryMuted : theme.colors.textMuted;
  const faint = dark ? theme.colors.ivorySubtle : theme.colors.textSubtle;

  return (
    <View style={styles.container}>
      <View style={styles.linkRow}>
        <TouchableOpacity onPress={() => Linking.openURL('https://www.tskool.kr')} hitSlop={8}>
          <Text style={[styles.link, { color: linkColor }]}>tskool.kr</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: faint }]} />
        <TouchableOpacity
          onPress={() => Linking.openURL('https://www.tskool.kr/tmoji-privacy.html')}
          hitSlop={8}
        >
          <Text style={[styles.link, { color: linkColor }]}>개인정보처리방침</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.copyright, { color: faint }]}>
        © {new Date().getFullYear()} T Skool. All rights reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: 6,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    width: 1,
    height: 10,
  },
  link: {
    fontSize: 12,
    fontWeight: '600',
  },
  copyright: {
    fontSize: theme.typography.caption,
  },
});
