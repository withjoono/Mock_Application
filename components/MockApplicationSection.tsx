import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import theme from '../lib/theme';
import FrequencyDistributionTable from './FrequencyDistributionTable';
import NormalDistributionChart from './NormalDistributionChart';
import {
  MockApplicationAnalysisResponse,
  MockApplicationAnalysisRequest,
  PASS_STATUS_COLORS,
  PASS_STATUS_BG_COLORS,
} from '../lib/types/mock-application';

interface MockApplicationSectionProps {
  universityCode: string;
  universityName: string;
  recruitmentUnit: string;
  admissionType?: string;
  myScore?: number;
}

// 모의 데이터 생성 함수 (백엔드 API가 준비되기 전 테스트용)
function generateMockData(
  request: MockApplicationAnalysisRequest
): MockApplicationAnalysisResponse {
  const baseScore = 850 + Math.random() * 50;
  const stdDev = 25 + Math.random() * 15;
  const mockApplicantCount = 50 + Math.floor(Math.random() * 100);
  const recruitmentCount = 10 + Math.floor(Math.random() * 20);

  // 도수분포 생성
  const frequencyDistribution = [];
  let cumulativeCount = 0;
  const numBins = 10;
  const minScore = baseScore - 3 * stdDev;
  const maxScore = baseScore + 3 * stdDev;
  const binSize = (maxScore - minScore) / numBins;

  for (let i = numBins - 1; i >= 0; i--) {
    const scoreLower = minScore + i * binSize;
    const scoreUpper = scoreLower + binSize;
    const applicantCount = Math.floor(
      mockApplicantCount *
        (Math.exp(-0.5 * Math.pow((scoreLower + binSize / 2 - baseScore) / stdDev, 2)) /
          (stdDev * Math.sqrt(2 * Math.PI))) *
        binSize *
        3
    );

    if (applicantCount > 0) {
      cumulativeCount += applicantCount;

      let passStatus: '안정합격' | '추가합격' | '합격가능' | '불합격';
      if (cumulativeCount <= recruitmentCount * 0.7) {
        passStatus = '안정합격';
      } else if (cumulativeCount <= recruitmentCount) {
        passStatus = '추가합격';
      } else if (cumulativeCount <= recruitmentCount * 1.3) {
        passStatus = '합격가능';
      } else {
        passStatus = '불합격';
      }

      frequencyDistribution.push({
        scoreLower,
        scoreUpper,
        applicantCount,
        cumulativeCount,
        passStatus,
      });
    }
  }

  const safePassThreshold = baseScore + stdDev * 0.5;
  const passThreshold = baseScore - stdDev * 0.3;

  return {
    basicInfo: {
      universityCode: request.universityCode,
      universityName: request.universityName,
      admissionType: request.admissionType || '가',
      recruitmentUnit: request.recruitmentUnit,
      recruitmentCount,
      competitionRate: mockApplicantCount / recruitmentCount,
      additionalPassRank: Math.floor(recruitmentCount * 1.2),
      totalPassCount: Math.floor(recruitmentCount * 1.5),
      mockApplicantCount,
    },
    statistics: {
      mean: baseScore,
      stdDev,
      min: minScore,
      max: maxScore,
      safePassThreshold,
      passThreshold,
    },
    frequencyDistribution,
    myScoreAnalysis: request.myScore
      ? {
          score: request.myScore,
          rank: Math.floor(
            mockApplicantCount *
              (1 - (request.myScore - minScore) / (maxScore - minScore))
          ),
          percentile:
            ((request.myScore - minScore) / (maxScore - minScore)) * 100,
          passStatus:
            request.myScore >= safePassThreshold
              ? '안정합격'
              : request.myScore >= passThreshold
                ? '합격가능'
                : '불합격 위험',
          scoreRange: {
            scoreLower:
              Math.floor(request.myScore / binSize) * binSize,
            scoreUpper:
              Math.floor(request.myScore / binSize) * binSize + binSize,
          },
          comparedToMean: request.myScore - baseScore,
        }
      : undefined,
  };
}

export default function MockApplicationSection({
  universityCode,
  universityName,
  recruitmentUnit,
  admissionType,
  myScore,
}: MockApplicationSectionProps) {
  const [data, setData] = useState<MockApplicationAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: 실제 API 호출로 대체
        // const response = await fetch('/jungsi/mock-application/analysis', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     universityCode,
        //     universityName,
        //     recruitmentUnit,
        //     admissionType,
        //     myScore,
        //   }),
        // });
        // const result = await response.json();
        // setData(result.data);

        // 테스트용 모의 데이터 사용
        await new Promise((resolve) => setTimeout(resolve, 500)); // 로딩 시뮬레이션
        const mockData = generateMockData({
          universityCode,
          universityName,
          recruitmentUnit,
          admissionType,
          myScore,
        });
        setData(mockData);
      } catch (err) {
        setError('데이터를 불러오는데 실패했습니다.');
        console.error('Mock application data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (universityCode && recruitmentUnit) {
      fetchData();
    }
  }, [universityCode, universityName, recruitmentUnit, admissionType, myScore]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>분석 데이터 로딩 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>모의지원 데이터가 없습니다</Text>
      </View>
    );
  }

  const { basicInfo, statistics, frequencyDistribution, myScoreAnalysis } = data;

  return (
    <View style={styles.container}>
      {/* 기본 정보 카드 */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>모집인원</Text>
          <Text style={styles.infoValue}>{basicInfo.recruitmentCount}명</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>모의지원자</Text>
          <Text style={styles.infoValue}>{basicInfo.mockApplicantCount}명</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>경쟁률</Text>
          <Text style={styles.infoValue}>
            {basicInfo.competitionRate.toFixed(2)} : 1
          </Text>
        </View>
      </View>

      {/* 내 점수 분석 */}
      {myScoreAnalysis && (
        <View style={styles.myScoreCard}>
          <Text style={styles.myScoreTitle}>내 점수 분석</Text>
          <View style={styles.myScoreContent}>
            <View style={styles.myScoreMain}>
              <Text style={styles.myScoreValue}>
                {myScoreAnalysis.score.toFixed(1)}점
              </Text>
              <View
                style={[
                  styles.passStatusBadge,
                  {
                    backgroundColor:
                      PASS_STATUS_BG_COLORS[
                        myScoreAnalysis.passStatus as keyof typeof PASS_STATUS_BG_COLORS
                      ] || '#f3f4f6',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.passStatusText,
                    {
                      color:
                        PASS_STATUS_COLORS[
                          myScoreAnalysis.passStatus as keyof typeof PASS_STATUS_COLORS
                        ] || '#6b7280',
                    },
                  ]}
                >
                  {myScoreAnalysis.passStatus}
                </Text>
              </View>
            </View>
            <View style={styles.myScoreDetails}>
              <Text style={styles.myScoreDetail}>
                예상 등수: {myScoreAnalysis.rank}위
              </Text>
              <Text style={styles.myScoreDetail}>
                백분위: {myScoreAnalysis.percentile.toFixed(1)}%
              </Text>
              <Text style={styles.myScoreDetail}>
                평균 대비: {myScoreAnalysis.comparedToMean >= 0 ? '+' : ''}
                {myScoreAnalysis.comparedToMean.toFixed(1)}점
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 정규분포 차트 */}
      <NormalDistributionChart
        statistics={statistics}
        myScore={myScore}
      />

      {/* 도수분포표 */}
      <View style={{ marginTop: theme.spacing.md }}>
        <FrequencyDistributionTable
          data={frequencyDistribution}
          myScore={myScore}
          recruitmentCount={basicInfo.recruitmentCount}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    fontSize: theme.typography.small,
  },
  errorContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.body,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoRow: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },
  myScoreCard: {
    backgroundColor: '#fef3c7',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  myScoreTitle: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: theme.spacing.sm,
  },
  myScoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myScoreMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  myScoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#92400e',
  },
  passStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  passStatusText: {
    fontSize: theme.typography.small,
    fontWeight: '600',
  },
  myScoreDetails: {
    alignItems: 'flex-end',
  },
  myScoreDetail: {
    fontSize: theme.typography.small,
    color: '#92400e',
    marginBottom: 2,
  },
});
