import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import theme from '../lib/theme';
import AppHeader from '../components/AppHeader';
import HamburgerMenu from '../components/HamburgerMenu';
import Dropdown from '../components/Dropdown';
import MockApplicationSection from '../components/MockApplicationSection';
import { useAuthContext } from '../lib/contexts/AuthContext';

// 모의 조합 데이터 타입
interface MockCombination {
  id: number;
  name: string;
  admissions: MockAdmission[];
}

interface MockAdmission {
  id: number;
  universityCode: string;
  universityName: string;
  recruitmentUnit: string;
  admissionType: '가' | '나' | '다';
  myScore?: number;
}

// 군 정렬 순서
const GROUP_ORDER: Record<string, number> = { '가': 0, '나': 1, '다': 2 };
const getGroupOrder = (type: string) => GROUP_ORDER[type] ?? 3;

// 테스트용 모의 조합 데이터
const MOCK_COMBINATIONS: MockCombination[] = [
  {
    id: 1,
    name: '조합 1 (상위권)',
    admissions: [
      { id: 1, universityCode: '101', universityName: '서울대학교', recruitmentUnit: '컴퓨터공학부', admissionType: '가', myScore: 920 },
      { id: 2, universityCode: '102', universityName: '연세대학교', recruitmentUnit: '컴퓨터과학과', admissionType: '나', myScore: 905 },
      { id: 3, universityCode: '103', universityName: '고려대학교', recruitmentUnit: '컴퓨터학과', admissionType: '다', myScore: 890 },
    ],
  },
  {
    id: 2,
    name: '조합 2 (중상위권)',
    admissions: [
      { id: 4, universityCode: '201', universityName: '성균관대학교', recruitmentUnit: '소프트웨어학과', admissionType: '가', myScore: 870 },
      { id: 5, universityCode: '202', universityName: '한양대학교', recruitmentUnit: '컴퓨터소프트웨어학부', admissionType: '나', myScore: 865 },
      { id: 6, universityCode: '203', universityName: '중앙대학교', recruitmentUnit: '소프트웨어학부', admissionType: '다', myScore: 850 },
    ],
  },
];

export default function MockApplyScreen() {
  const navigation = useNavigation<any>();
  const { userId, isAuthenticated } = useAuthContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [combinations, setCombinations] = useState<MockCombination[]>([]);
  const [selectedCombination, setSelectedCombination] = useState<MockCombination | null>(null);
  const [selectedAdmission, setSelectedAdmission] = useState<MockAdmission | null>(null);
  const [isAdmissionListOpen, setIsAdmissionListOpen] = useState(true);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // TODO: 실제 API 호출로 대체
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCombinations(MOCK_COMBINATIONS);
        if (MOCK_COMBINATIONS.length > 0) {
          setSelectedCombination(MOCK_COMBINATIONS[0]);
        }
      } catch (error) {
        console.error('Failed to load combinations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 조합 선택 시 첫 번째 모집단위 자동 선택
  useEffect(() => {
    if (selectedCombination && !selectedAdmission) {
      const sortedAdmissions = [...selectedCombination.admissions].sort(
        (a, b) => getGroupOrder(a.admissionType) - getGroupOrder(b.admissionType)
      );
      if (sortedAdmissions.length > 0) {
        setSelectedAdmission(sortedAdmissions[0]);
      }
    }
  }, [selectedCombination]);

  // 조합 변경 핸들러
  const handleCombinationChange = (combinationId: string) => {
    const combination = combinations.find((c) => c.id.toString() === combinationId);
    if (combination) {
      setSelectedCombination(combination);
      setSelectedAdmission(null);
    }
  };

  // 모집단위 선택 핸들러
  const handleAdmissionSelect = (admission: MockAdmission) => {
    setSelectedAdmission(admission);
  };

  const sortedAdmissions = selectedCombination
    ? [...selectedCombination.admissions].sort(
        (a, b) => getGroupOrder(a.admissionType) - getGroupOrder(b.admissionType)
      )
    : [];

  // 로딩 중
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <AppHeader title="모의지원" onPressMenu={() => setMenuOpen(true)} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 로그인 필요 (옵션)
  // if (!isAuthenticated) {
  //   return (
  //     <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
  //       <AppHeader title="모의지원" onPressMenu={() => setMenuOpen(true)} />
  //       <View style={styles.messageContainer}>
  //         <Text style={styles.messageText}>로그인이 필요합니다.</Text>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  // 조합 없음
  if (combinations.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <AppHeader title="모의지원" onPressMenu={() => setMenuOpen(true)} />
        <HamburgerMenu
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigateScoreInput={() => navigation.navigate('ScoreInput')}
          onNavigateScoreAnalysis={() => navigation.navigate('ScoreAnalysis')}
          onNavigateStrategy={() => navigation.navigate('Strategy')}
          onNavigateCollegeSelect={() => navigation.navigate('CollegeSelect')}
          onNavigateSupportStatus={() => navigation.navigate('SupportStatus')}
          onNavigateSupportStrategy={() => navigation.navigate('SupportStrategy')}
          onNavigateMockApply={() => navigation.navigate('MockApply')}
        />
        <View style={styles.messageContainer}>
          <Text style={styles.messageTitle}>저장된 조합이 없습니다</Text>
          <Text style={styles.messageSubtext}>
            정시 관심대학에서 조합을 먼저 생성해주세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader title="모의지원" onPressMenu={() => setMenuOpen(true)} />
      <HamburgerMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigateScoreInput={() => navigation.navigate('ScoreInput')}
        onNavigateScoreAnalysis={() => navigation.navigate('ScoreAnalysis')}
        onNavigateStrategy={() => navigation.navigate('Strategy')}
        onNavigateCollegeSelect={() => navigation.navigate('CollegeSelect')}
        onNavigateSupportStatus={() => navigation.navigate('SupportStatus')}
        onNavigateSupportStrategy={() => navigation.navigate('SupportStrategy')}
        onNavigateMockApply={() => navigation.navigate('MockApply')}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* 조합 선택 */}
        <View style={styles.card}>
          <Text style={styles.pageTitle}>모의지원 시뮬레이션</Text>
          <Dropdown
            label="조합 선택"
            options={combinations.map((c) => ({
              key: c.id.toString(),
              label: `${c.name} (${c.admissions.length}개 대학)`,
            }))}
            value={selectedCombination?.id.toString()}
            onChange={handleCombinationChange}
          />
        </View>

        {/* 안내 메시지 */}
        <View style={styles.guideCard}>
          <View style={styles.guideIconContainer}>
            <MaterialIcons name="insights" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.guideTextContainer}>
            <Text style={styles.guideTitle}>2026 정시 모의지원 시뮬레이션</Text>
            <Text style={styles.guideText}>
              작년 경쟁률 상황에서, "작년 입결 + 올해 실제 모의지원" 데이터를 기반으로
              합격/불합격 가능성과 예상 등수를 알려드립니다.
            </Text>
          </View>
        </View>

        {/* 모집단위 목록 */}
        {selectedCombination && (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setIsAdmissionListOpen(!isAdmissionListOpen)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardTitle}>
                모집단위 목록 ({sortedAdmissions.length}개)
              </Text>
              <Ionicons
                name={isAdmissionListOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.muted}
              />
            </TouchableOpacity>

            {isAdmissionListOpen && (
              <View style={styles.admissionList}>
                {sortedAdmissions.map((admission) => {
                  const isSelected = selectedAdmission?.id === admission.id;

                  return (
                    <TouchableOpacity
                      key={admission.id}
                      style={[
                        styles.admissionItem,
                        isSelected && styles.admissionItemSelected,
                      ]}
                      onPress={() => handleAdmissionSelect(admission)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.admissionInfo}>
                        <View style={styles.admissionHeader}>
                          <View style={styles.groupBadge}>
                            <Text style={styles.groupBadgeText}>
                              {admission.admissionType}군
                            </Text>
                          </View>
                          <Text style={styles.universityName} numberOfLines={1}>
                            {admission.universityName}
                          </Text>
                        </View>
                        <Text style={styles.recruitmentUnit} numberOfLines={1}>
                          {admission.recruitmentUnit}
                        </Text>
                      </View>
                      <View style={styles.scoreInfo}>
                        <Text style={styles.scoreLabel}>내 점수</Text>
                        <Text style={styles.scoreValue}>
                          {admission.myScore?.toFixed(1) ?? '-'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* 선택된 대학 시뮬레이션 */}
        {selectedAdmission && (
          <View style={styles.simulationCard}>
            <View style={styles.simulationHeader}>
              <View style={[styles.groupBadge, styles.groupBadgePrimary]}>
                <Text style={styles.groupBadgeTextPrimary}>
                  {selectedAdmission.admissionType}군
                </Text>
              </View>
              <Text style={styles.simulationTitle}>
                {selectedAdmission.universityName} - {selectedAdmission.recruitmentUnit}
              </Text>
            </View>

            <MockApplicationSection
              universityCode={selectedAdmission.universityCode}
              universityName={selectedAdmission.universityName}
              recruitmentUnit={selectedAdmission.recruitmentUnit}
              admissionType={selectedAdmission.admissionType}
              myScore={selectedAdmission.myScore}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
  },
  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  messageTitle: {
    fontSize: theme.typography.heading,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  messageSubtext: {
    fontSize: theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  pageTitle: {
    fontSize: theme.typography.title,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  guideCard: {
    backgroundColor: '#eff6ff',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  guideIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTextContainer: {
    flex: 1,
  },
  guideTitle: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: theme.spacing.xs,
  },
  guideText: {
    fontSize: theme.typography.small,
    color: '#1e40af',
    lineHeight: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  admissionList: {
    gap: theme.spacing.sm,
  },
  admissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  admissionItemSelected: {
    backgroundColor: '#eff6ff',
    borderColor: theme.colors.primary,
  },
  admissionInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  admissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: 2,
  },
  groupBadge: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  groupBadgePrimary: {
    backgroundColor: theme.colors.primary,
  },
  groupBadgeTextPrimary: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  universityName: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  recruitmentUnit: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
  scoreInfo: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 10,
    color: theme.colors.muted,
  },
  scoreValue: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.text,
  },
  simulationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  simulationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  simulationTitle: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
});
