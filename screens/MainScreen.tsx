import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import theme from '../lib/theme';
import AuthButton from '../components/AuthButton';
import AppFooter from '../components/AppFooter';
import BottomSheet from '../components/BottomSheet';
import Field from '../components/Field';
import { FeaturedSeasonCard, SeasonRow, getSeasonStatus } from '../components/SeasonCard';
import { useMockApplication } from '../lib/hooks/useMockApplication';
import { IMaSeason, MaSeasonType } from '../lib/api/features/mock-application';
import { useAuthContext } from '../lib/contexts/AuthContext';
import { SEASON_LABELS } from '../lib/season-labels';

// 시즌 표시 순서와 카드 문구
const SEASON_ORDER: MaSeasonType[] = ['SUSI', 'JUNGSI', 'MOCK_SEPT', 'MOCK_JUNE'];

const SEASON_COPY: Record<MaSeasonType, { title: string; qualifier?: string; caption: string }> = {
  SUSI: { title: 'T수시', caption: '6개 대학까지 지원하고 실시간 순위 확인' },
  JUNGSI: { title: 'T정시', caption: '수능 성적으로 가·나·다군 모의지원' },
  MOCK_SEPT: { title: 'T정시', qualifier: '9월 모의평가', caption: '9월 모평 성적으로 가·나·다군 모의지원' },
  MOCK_JUNE: { title: 'T정시', qualifier: '6월 모의평가', caption: '6월 모평 성적으로 가·나·다군 모의지원' },
};

export default function MainScreen() {
  const navigation = useNavigation<any>();
  const { seasons, fetchSeasons, isLoading } = useMockApplication();
  const { user, isAuthenticated, loginWithEmail, logout, withdrawAccount } = useAuthContext();

  // 로그인 시트 상태
  const [loginVisible, setLoginVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    // 비로그인/백엔드 미연결 시 조용히 실패하고 '일정 미정'으로 표시
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
      setShowPassword(false);
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

  const handleSeasonPress = (type: MaSeasonType) => {
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
    const title = `${season.year}학년도 ${SEASON_LABELS[type]}`;
    if (!season.isOpen) {
      if (!isAuthenticated) {
        navigation.navigate('SeasonApply', {
          seasonId: season.id,
          title,
          seasonType: season.seasonType,
        });
        return;
      }
      const hasEnded = new Date(season.closeAt).getTime() < Date.now();
      Alert.alert(
        hasEnded ? '운영 종료' : '오픈 예정',
        hasEnded
          ? `${title} 운영이 종료되었습니다. 다음 시즌 일정은 추후 안내됩니다.`
          : `${title}은(는) ${season.openAt.slice(0, 10)}부터 지원할 수 있습니다.`,
      );
      return;
    }
    navigation.navigate('SeasonApply', {
      seasonId: season.id,
      title,
      seasonType: season.seasonType,
    });
  };

  // 지금 열린 시즌은 위에 크게, 나머지는 목록으로
  const seasonItems = SEASON_ORDER.map((type) => {
    const season = seasonByType.get(type);
    return { type, season, ...getSeasonStatus(season, isLoading) };
  });
  const openItems = seasonItems.filter((item) => item.status === 'open');
  const otherItems = seasonItems.filter((item) => item.status !== 'open');
  const seasonYear = seasons[0]?.year;
  const displayName = user?.nickname || user?.name || user?.email || '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.ink} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 브랜드 */}
        <View style={styles.brandArea}>
          <View style={styles.emblemWrap}>
            <Svg width={220} height={220} style={styles.emblemGlow}>
              <Defs>
                <RadialGradient id="emblemGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={theme.colors.bronze} stopOpacity="0.32" />
                  <Stop offset="0.55" stopColor={theme.colors.bronze} stopOpacity="0.08" />
                  <Stop offset="1" stopColor={theme.colors.bronze} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx={110} cy={110} r={110} fill="url(#emblemGlow)" />
            </Svg>
            {/* 엠블럼의 짙은 음영이 어두운 배경에 묻히지 않도록 아이보리 메달 위에 올린다 */}
            <View style={styles.medallion}>
              <Image
                source={require('../assets/brand-logo.png')}
                style={styles.logo}
                resizeMode="contain"
                accessible
                accessibilityLabel="T 모지 로고"
              />
            </View>
          </View>
          <Text style={styles.title} accessibilityRole="header" accessibilityLabel="앱명 T 모지">
            T 모지
          </Text>
          <Text style={styles.subtitle}>수시·정시 모의지원 합격 예측</Text>
        </View>

        {/* 지금 지원할 수 있는 시즌 */}
        {openItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>지금 지원할 수 있어요</Text>
            <View style={styles.featuredList}>
              {openItems.map(({ type, season, status, dday }) => (
                <FeaturedSeasonCard
                  key={type}
                  {...SEASON_COPY[type]}
                  season={season}
                  status={status}
                  dday={dday}
                  onPress={() => handleSeasonPress(type)}
                  accessibilityLabel={SEASON_LABELS[type]}
                />
              ))}
            </View>
          </View>
        )}

        {/* 그 밖의 시즌 */}
        {otherItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {openItems.length > 0
                ? '다른 시즌'
                : seasonYear
                  ? `${seasonYear}학년도 시즌`
                  : '시즌 일정'}
            </Text>
            <View style={styles.group}>
              {otherItems.map(({ type, season, status, dday }, index) => (
                <React.Fragment key={type}>
                  {index > 0 && <View style={styles.groupDivider} />}
                  <SeasonRow
                    {...SEASON_COPY[type]}
                    season={season}
                    status={status}
                    dday={dday}
                    onPress={() => handleSeasonPress(type)}
                    accessibilityLabel={SEASON_LABELS[type]}
                  />
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* 계정 */}
        <View style={styles.section}>
          {isAuthenticated ? (
            <>
              <View style={[styles.group, styles.accountRow]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{displayName.slice(0, 1) || 'T'}</Text>
                </View>
                <View style={styles.accountText}>
                  <Text style={styles.accountName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {!!user?.email && user.email !== displayName && (
                    <Text style={styles.accountEmail} numberOfLines={1}>
                      {user.email}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleLogout}
                  hitSlop={8}
                  style={styles.logoutButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.logoutText}>로그아웃</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleWithdraw}
                style={styles.withdrawButton}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={styles.withdrawText}>회원 탈퇴</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <AuthButton
                label="T스쿨 계정으로 로그인"
                onPress={() => setLoginVisible(true)}
                backgroundColor="rgba(245, 239, 230, 0.06)"
                textColor={theme.colors.ivory}
                icon={<Ionicons name="person-circle-outline" size={20} color={theme.colors.bronze} />}
                style={styles.loginButton}
              />
              <Text style={styles.guestHint} lineBreakStrategyIOS="hangul-word">
                로그인하지 않아도 시즌을 눌러 대학 검색과 합격예측을 체험할 수 있어요.
              </Text>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <AppFooter tone="dark" />
        </View>
      </ScrollView>

      {/* 이메일 로그인 시트 (Hub 계정 공용) */}
      <BottomSheet
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        title="로그인"
        subtitle="T스쿨 계정으로 로그인합니다. T수시·T정시와 같은 계정을 사용하세요."
      >
        <Field
          label="이메일"
          placeholder="name@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => passwordRef.current?.focus()}
          leading={<Ionicons name="mail-outline" size={18} color={theme.colors.textSubtle} />}
        />
        <Field
          ref={passwordRef}
          label="비밀번호"
          placeholder="비밀번호"
          secureTextEntry={!showPassword}
          textContentType="password"
          autoComplete="password"
          returnKeyType="go"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleEmailLogin}
          leading={<Ionicons name="lock-closed-outline" size={18} color={theme.colors.textSubtle} />}
          trailing={
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
              style={styles.eyeButton}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          }
        />
        <AuthButton
          label="로그인"
          onPress={handleEmailLogin}
          loading={loggingIn}
          style={styles.loginSubmit}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.ink,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: theme.spacing.md,
  },
  brandArea: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  emblemWrap: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemGlow: {
    position: 'absolute',
    top: -58,
    left: -58,
  },
  medallion: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.ivory,
    borderWidth: 3,
    borderColor: 'rgba(184, 148, 106, 0.55)',
  },
  logo: {
    width: 76,
    height: 76,
  },
  title: {
    marginTop: 12,
    fontSize: theme.typography.display,
    fontWeight: '800',
    letterSpacing: theme.tracking.display,
    color: theme.colors.ivory,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.ivoryMuted,
  },
  section: {
    marginTop: 22,
  },
  sectionLabel: {
    marginBottom: 10,
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.ivoryMuted,
  },
  featuredList: {
    gap: 12,
  },
  group: {
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: theme.colors.inkRaised,
    borderWidth: 1,
    borderColor: theme.colors.inkLine,
  },
  groupDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 18,
    backgroundColor: 'rgba(245, 239, 230, 0.14)',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(184, 148, 106, 0.18)',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.bronze,
  },
  accountText: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.ivory,
  },
  accountEmail: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.ivorySubtle,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(245, 239, 230, 0.18)',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.ivoryMuted,
  },
  withdrawButton: {
    alignSelf: 'center',
    marginTop: 14,
    padding: theme.spacing.xs,
  },
  withdrawText: {
    fontSize: 12,
    color: theme.colors.ivorySubtle,
    textDecorationLine: 'underline',
  },
  loginButton: {
    borderWidth: 1,
    borderColor: 'rgba(184, 148, 106, 0.55)',
  },
  guestHint: {
    marginTop: 12,
    paddingHorizontal: theme.spacing.md,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.ivorySubtle,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.spacing.lg,
  },
  eyeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginSubmit: {
    marginTop: theme.spacing.xs,
  },
});
