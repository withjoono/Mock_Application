import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../lib/theme';
import AuthButton from '../components/AuthButton';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import FeaturePaddle from '../components/FeaturePaddle';
import { useNavigation } from '@react-navigation/native';
import { useMockApplication } from '../lib/hooks/useMockApplication';
import { IMaSeason, MaSeasonType } from '../lib/api/features/mock-application';
import { useAuthContext } from '../lib/contexts/AuthContext';
import AppFooter from '../components/AppFooter';

// 시즌 카드 표시 순서 및 폴백 라벨 (시즌 API 미로딩 시)
const SEASON_ORDER: { type: MaSeasonType; fallbackLabel: string; emphasis: number }[] = [
  { type: 'SUSI', fallbackLabel: '수시 모의지원', emphasis: 0.9 },
  { type: 'JUNGSI', fallbackLabel: '정시 모의지원', emphasis: 1.0 },
  { type: 'MOCK_SEPT', fallbackLabel: '9평 모의지원', emphasis: 0.9 },
  { type: 'MOCK_JUNE', fallbackLabel: '6평 모의지원', emphasis: 0.85 },
];

export default function MainScreen() {
  const navigation = useNavigation<any>();
  const { seasons, fetchSeasons } = useMockApplication();
  const { user, isAuthenticated, loginWithEmail, logout, withdrawAccount } = useAuthContext();

  // 로그인 모달 상태
  const [loginVisible, setLoginVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    // 비로그인/백엔드 미연결 시 조용히 실패하고 폴백 라벨 표시
    fetchSeasons(isAuthenticated);
  }, [fetchSeasons, isAuthenticated]);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('입력 확인', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoggingIn(true);
    const errorMessage = await loginWithEmail(email, password);
    setLoggingIn(false);
    if (errorMessage) {
      Alert.alert('로그인 실패', errorMessage);
    } else {
      setLoginVisible(false);
      setEmail('');
      setPassword('');
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleWithdraw = () => {
    Alert.alert(
      '회원 탈퇴',
      '탈퇴하면 계정 정보가 삭제되고 모의지원 기록도 모두 삭제됩니다.\n이 작업은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: () => {
            // 2단계 확인 (실수 방지)
            Alert.alert('정말 탈퇴할까요?', '마지막 확인입니다.', [
              { text: '취소', style: 'cancel' },
              {
                text: '영구 탈퇴',
                style: 'destructive',
                onPress: async () => {
                  const errorMessage = await withdrawAccount();
                  if (errorMessage) {
                    Alert.alert('탈퇴 실패', errorMessage);
                  } else {
                    Alert.alert('탈퇴 완료', '이용해주셔서 감사합니다.');
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

  const seasonByType = useMemo(() => {
    const map = new Map<MaSeasonType, IMaSeason>();
    seasons.forEach((s) => map.set(s.seasonType, s));
    return map;
  }, [seasons]);

  const handleSeasonPress = (type: MaSeasonType, fallbackLabel: string) => {
    const season = seasonByType.get(type);
    if (!season) {
      if (__DEV__ && type === 'JUNGSI') {
        // 개발 빌드: 시즌 미로딩 시 데모 흐름 유지
        navigation.navigate('ScoreInput');
        return;
      }
      Alert.alert(
        '시즌 정보를 불러오지 못했습니다',
        isAuthenticated
          ? '잠시 후 다시 시도해주세요.'
          : '체험 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
      return;
    }
    if (!season.isOpen) {
      if (!isAuthenticated) {
        navigation.navigate('SeasonApply', {
          seasonId: season.id,
          title: season.title,
          seasonType: season.seasonType,
        });
        return;
      }
      const hasEnded = new Date(season.closeAt).getTime() < Date.now();
      Alert.alert(
        hasEnded ? '운영 종료' : '오픈 예정',
        hasEnded
          ? `${season.title} 운영이 종료되었습니다. 다음 시즌 일정은 추후 안내됩니다.`
          : `${season.title}은(는) ${season.openAt.slice(0, 10)}부터 지원할 수 있습니다.`,
      );
      return;
    }
    navigation.navigate('SeasonApply', {
      seasonId: season.id,
      title: season.title,
      seasonType: season.seasonType,
    });
  };


  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.brandArea}>
          <View style={styles.logoBadge} accessible accessibilityLabel="앱 로고: 대학 심볼">
            <MaterialCommunityIcons name="school" size={44} color={theme.colors.onPrimary} />
          </View>

          <Text
            style={styles.title}
            accessibilityRole="header"
            accessibilityLabel="앱명 T 모지"
          >
            T 모지
          </Text>
          <Text style={styles.subtitle}>수시·정시 모의지원 합격 예측</Text>
        </View>

        <View style={styles.wheelArea}>
          {SEASON_ORDER.map(({ type, fallbackLabel, emphasis }, index) => {
            const season = seasonByType.get(type);
            const label = season ? season.title.replace(/^\d+학년도\s*/, '') : fallbackLabel;
            const isOpen = season?.isOpen ?? type === 'JUNGSI';

            return (
              <React.Fragment key={type}>
                {index > 0 && <View style={{ height: theme.spacing.md }} />}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleSeasonPress(type, fallbackLabel)}
                >
                  <FeaturePaddle label={label} active={isOpen} emphasis={emphasis} />
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        <View style={styles.bottomArea}>
          {isAuthenticated ? (
            <View>
              <View style={styles.profileRow}>
                <Ionicons name="person-circle" size={28} color={theme.colors.primary} />
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.nickname || user?.name || user?.email}
                </Text>
                <TouchableOpacity onPress={handleLogout} hitSlop={8}>
                  <Text style={styles.logoutText}>로그아웃</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleWithdraw} style={styles.withdrawButton} hitSlop={8}>
                <Text style={styles.withdrawText}>회원 탈퇴</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.guestHint}>
                시즌 카드를 눌러 로그인 없이 대학 검색과 합격예측을 체험하세요.
              </Text>
              <AuthButton
                label="거북스쿨 계정으로 로그인"
                onPress={() => setLoginVisible(true)}
                backgroundColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
                icon={<Ionicons name="log-in-outline" size={18} color={theme.colors.onPrimary} />}
                style={styles.authButton}
              />
            </View>
          )}
          <AppFooter />
        </View>
      </View>

      {/* 이메일 로그인 모달 (Hub 계정 공용) */}
      <Modal visible={loginVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>로그인</Text>
              <TouchableOpacity onPress={() => setLoginVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              거북스쿨(Hub) 계정으로 로그인합니다. 수시·정시앱과 같은 계정을 사용하세요.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="이메일"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleEmailLogin}
            />

            <TouchableOpacity
              style={[styles.loginButton, loggingIn && styles.loginButtonDisabled]}
              onPress={handleEmailLogin}
              disabled={loggingIn}
            >
              {loggingIn ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <Text style={styles.loginButtonText}>로그인</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  brandArea: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  title: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.title,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  logoIcon: {
    // kept for potential future adjustments
  },
  wheelArea: {
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  bottomArea: {
    paddingBottom: theme.spacing.lg,
  },
  authButton: {
    width: '100%',
  },
  guestHint: {
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  profileName: {
    flex: 1,
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  logoutText: {
    fontSize: theme.typography.small,
    color: theme.colors.error,
    fontWeight: '600',
  },
  withdrawButton: {
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  withdrawText: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalSubtitle: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
    fontSize: theme.typography.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  loginButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  loginButtonText: {
    color: theme.colors.onPrimary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
});
