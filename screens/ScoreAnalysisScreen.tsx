import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import theme from '../lib/theme';
import AppHeader from '../components/AppHeader';
import HamburgerMenu from '../components/HamburgerMenu';
import { getGradeColor, ANALYSIS_BAR_COLORS } from '../lib/types/score-analysis';

// Route params type
type ScoreAnalysisParams = {
  ScoreAnalysis: {
    koreanStd?: string;
    mathType?: string;
    mathStd?: string;
    english?: string;
    history?: string;
    sci1Type?: string;
    sci1Std?: string;
    sci2Type?: string;
    sci2Std?: string;
    secondLang?: Record<string, string>;
  };
};

// Subject score interface
interface SubjectScore {
  standardScore: string;
  percentile: string;
  grade: string;
  name: string;
}

// Grade Badge Component
function GradeBadge({ grade }: { grade: string }) {
  const { bg, text } = getGradeColor(grade);

  if (grade === '-') {
    return <Text style={styles.gradeDash}>-</Text>;
  }

  return (
    <View style={[styles.gradeBadge, { backgroundColor: bg }]}>
      <Text style={[styles.gradeBadgeText, { color: text }]}>{grade}</Text>
    </View>
  );
}

// Subject Analysis Row Component
function SubjectAnalysisRow({
  label,
  subjectName,
  standardScore,
  percentile,
  grade,
  color,
}: {
  label: string;
  subjectName: string;
  standardScore: string;
  percentile: string;
  grade: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const colorMap = {
    blue: ANALYSIS_BAR_COLORS.blue,
    green: ANALYSIS_BAR_COLORS.green,
    orange: ANALYSIS_BAR_COLORS.orange,
    purple: ANALYSIS_BAR_COLORS.purple,
  };

  const percentileNum = parseFloat(percentile);
  const barWidth = !isNaN(percentileNum) ? percentileNum : 0;

  return (
    <View style={styles.analysisRow}>
      <View style={styles.analysisRowHeader}>
        <View style={styles.analysisLabelContainer}>
          <Text style={styles.analysisLabel}>{label}</Text>
          {subjectName !== label && (
            <Text style={styles.analysisSubLabel}>({subjectName})</Text>
          )}
        </View>
        <GradeBadge grade={grade} />
      </View>
      <View style={styles.analysisScores}>
        <View style={styles.analysisScoreItem}>
          <Text style={styles.analysisScoreLabel}>표준점수: </Text>
          <Text style={styles.analysisScoreValue}>{standardScore}</Text>
        </View>
        <View style={styles.analysisScoreItem}>
          <Text style={styles.analysisScoreLabel}>백분위: </Text>
          <Text style={styles.analysisScoreValue}>{percentile}</Text>
        </View>
      </View>
      {barWidth > 0 && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${barWidth}%`, backgroundColor: colorMap[color] },
            ]}
          />
        </View>
      )}
    </View>
  );
}

export default function ScoreAnalysisScreen() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ScoreAnalysisParams, 'ScoreAnalysis'>>();

  // Get params from navigation (scores entered by user)
  const params = route.params || {};

  // Mock score data calculation (in real app, this would come from backend API)
  const scoreData = useMemo(() => {
    // Helper to calculate mock percentile from standard score
    const calculatePercentile = (std: string): string => {
      const num = parseFloat(std);
      if (isNaN(num) || num <= 0) return '-';
      // Simple mock calculation - in real app this comes from backend
      const percentile = Math.min(99, Math.max(1, Math.round((num / 200) * 100 + Math.random() * 10)));
      return percentile.toString();
    };

    // Helper to calculate mock grade from standard score
    const calculateGrade = (std: string, isAbsolute?: boolean, absoluteGrade?: string): string => {
      if (isAbsolute && absoluteGrade) {
        return absoluteGrade;
      }
      const num = parseFloat(std);
      if (isNaN(num) || num <= 0) return '-';
      // Simple mock calculation
      if (num >= 140) return '1';
      if (num >= 130) return '2';
      if (num >= 120) return '3';
      if (num >= 110) return '4';
      if (num >= 100) return '5';
      if (num >= 90) return '6';
      if (num >= 80) return '7';
      if (num >= 70) return '8';
      return '9';
    };

    return {
      korean: {
        standardScore: params.koreanStd || '-',
        percentile: calculatePercentile(params.koreanStd || ''),
        grade: calculateGrade(params.koreanStd || ''),
        name: '국어',
      },
      math: {
        standardScore: params.mathStd || '-',
        percentile: calculatePercentile(params.mathStd || ''),
        grade: calculateGrade(params.mathStd || ''),
        name: params.mathType || '수학',
      },
      inquiry1: {
        standardScore: params.sci1Std || '-',
        percentile: calculatePercentile(params.sci1Std || ''),
        grade: calculateGrade(params.sci1Std || ''),
        name: params.sci1Type || '탐구1',
      },
      inquiry2: {
        standardScore: params.sci2Std || '-',
        percentile: calculatePercentile(params.sci2Std || ''),
        grade: calculateGrade(params.sci2Std || ''),
        name: params.sci2Type || '탐구2',
      },
      english: {
        standardScore: '-',
        percentile: '-',
        grade: params.english || '-',
        name: '영어',
      },
      koreanHistory: {
        standardScore: '-',
        percentile: '-',
        grade: params.history || '-',
        name: '한국사',
      },
      secondLang: {
        standardScore: '-',
        percentile: '-',
        grade: Object.values(params.secondLang || {}).find(v => v) || '-',
        name: Object.keys(params.secondLang || {}).find(k => params.secondLang?.[k]) || '제2외국어',
      },
    };
  }, [params]);

  // Calculate totals and averages
  const calculations = useMemo(() => {
    const parseScore = (value: string) => {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    };

    // Standard score sum (only subjects with standard scores)
    const standardScoreValues = [
      parseScore(scoreData.korean.standardScore),
      parseScore(scoreData.math.standardScore),
      parseScore(scoreData.inquiry1.standardScore),
      parseScore(scoreData.inquiry2.standardScore),
    ];
    const validStandardScores = standardScoreValues.filter((v) => v > 0);
    const standardScoreSum = validStandardScores.reduce((a, b) => a + b, 0);
    const standardScoreAvg = validStandardScores.length > 0
      ? (standardScoreSum / validStandardScores.length).toFixed(1)
      : '-';

    // Percentile sum
    const percentileValues = [
      parseScore(scoreData.korean.percentile),
      parseScore(scoreData.math.percentile),
      parseScore(scoreData.inquiry1.percentile),
      parseScore(scoreData.inquiry2.percentile),
    ];
    const validPercentiles = percentileValues.filter((v) => v > 0);
    const percentileSum = validPercentiles.reduce((a, b) => a + b, 0);
    const percentileAvg = validPercentiles.length > 0
      ? (percentileSum / validPercentiles.length).toFixed(1)
      : '-';

    // Grade sum (main 4 subjects)
    const gradeValues = [
      parseScore(scoreData.korean.grade),
      parseScore(scoreData.math.grade),
      parseScore(scoreData.inquiry1.grade),
      parseScore(scoreData.inquiry2.grade),
    ];
    const validGrades = gradeValues.filter((v) => v > 0);
    const gradeSum = validGrades.reduce((a, b) => a + b, 0);
    const gradeAvg = validGrades.length > 0
      ? (gradeSum / validGrades.length).toFixed(2)
      : '-';

    return {
      standardScore: {
        sum: standardScoreSum > 0 ? standardScoreSum.toString() : '-',
        avg: standardScoreAvg,
      },
      percentile: {
        sum: percentileSum > 0 ? percentileSum.toString() : '-',
        avg: percentileAvg,
      },
      grade: {
        sum: gradeSum > 0 ? gradeSum.toString() : '-',
        avg: gradeAvg,
      },
    };
  }, [scoreData]);

  const subjects = [
    { key: 'korean', label: '국어', data: scoreData.korean },
    { key: 'math', label: '수학', data: scoreData.math },
    { key: 'inquiry1', label: '탐구1', data: scoreData.inquiry1 },
    { key: 'inquiry2', label: '탐구2', data: scoreData.inquiry2 },
    { key: 'english', label: '영어', data: scoreData.english },
    { key: 'koreanHistory', label: '한국사', data: scoreData.koreanHistory },
    { key: 'secondLang', label: '제2외국어', data: scoreData.secondLang },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader title="성적 분석" onPressMenu={() => setMenuOpen(true)} />
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
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>정시 성적 분석</Text>
          <Text style={styles.pageSubtitle}>2026학년도 수능 성적 기준</Text>
        </View>

        {/* Guide Banner */}
        <View style={styles.guideBanner}>
          <View style={styles.guideContent}>
            <Text style={styles.guideTitle}>성적 분석 안내</Text>
            <Text style={styles.guideText}>
              입력하신 수능 성적을 기반으로 표준점수, 백분위, 등급을 분석합니다.
              정시 지원 전략 수립에 참고하세요.
            </Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.summaryBlue]}>
            <Text style={styles.summaryLabel}>표준점수 합계</Text>
            <Text style={styles.summaryValue}>{calculations.standardScore.sum}</Text>
            <Text style={styles.summaryAvg}>평균 {calculations.standardScore.avg}</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryGreen]}>
            <Text style={styles.summaryLabel}>백분위 합계</Text>
            <Text style={styles.summaryValue}>{calculations.percentile.sum}</Text>
            <Text style={styles.summaryAvg}>평균 {calculations.percentile.avg}</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryOrange]}>
            <Text style={styles.summaryLabel}>등급 합계</Text>
            <Text style={styles.summaryValue}>{calculations.grade.sum}</Text>
            <Text style={styles.summaryAvg}>평균 {calculations.grade.avg}</Text>
          </View>
        </View>

        {/* Subject Details Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>과목별 상세 성적</Text>
          </View>
          <View style={styles.tableContent}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableRowHeader]}>
              <Text style={[styles.tableCell, styles.tableCellSubject, styles.tableCellHeaderText]}>과목</Text>
              <Text style={[styles.tableCell, styles.tableCellCenter, styles.tableCellHeaderText]}>표준점수</Text>
              <Text style={[styles.tableCell, styles.tableCellCenter, styles.tableCellHeaderText]}>백분위</Text>
              <Text style={[styles.tableCell, styles.tableCellCenter, styles.tableCellHeaderText]}>등급</Text>
            </View>
            {/* Table Body */}
            {subjects.map((subject, index) => (
              <View
                key={subject.key}
                style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
              >
                <View style={[styles.tableCell, styles.tableCellSubject]}>
                  <Text style={styles.subjectLabel}>{subject.label}</Text>
                  {subject.data.name !== subject.label && (
                    <Text style={styles.subjectSubLabel}>({subject.data.name})</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellCenter,
                    styles.tableCellValue,
                    subject.data.standardScore !== '-' && styles.tableCellBlue,
                  ]}
                >
                  {subject.data.standardScore}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellCenter,
                    styles.tableCellValue,
                    subject.data.percentile !== '-' && styles.tableCellGreen,
                  ]}
                >
                  {subject.data.percentile}
                </Text>
                <View style={[styles.tableCell, styles.tableCellCenter]}>
                  <GradeBadge grade={subject.data.grade} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Main Subject Analysis */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>주요 영역 분석 (국수탐)</Text>
          </View>
          <View style={styles.analysisContent}>
            <SubjectAnalysisRow
              label="국어"
              subjectName={scoreData.korean.name}
              standardScore={scoreData.korean.standardScore}
              percentile={scoreData.korean.percentile}
              grade={scoreData.korean.grade}
              color="blue"
            />
            <SubjectAnalysisRow
              label="수학"
              subjectName={scoreData.math.name}
              standardScore={scoreData.math.standardScore}
              percentile={scoreData.math.percentile}
              grade={scoreData.math.grade}
              color="green"
            />
            <SubjectAnalysisRow
              label="탐구1"
              subjectName={scoreData.inquiry1.name}
              standardScore={scoreData.inquiry1.standardScore}
              percentile={scoreData.inquiry1.percentile}
              grade={scoreData.inquiry1.grade}
              color="orange"
            />
            <SubjectAnalysisRow
              label="탐구2"
              subjectName={scoreData.inquiry2.name}
              standardScore={scoreData.inquiry2.standardScore}
              percentile={scoreData.inquiry2.percentile}
              grade={scoreData.inquiry2.grade}
              color="purple"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>유의사항</Text>
          <Text style={styles.notesText}>• 영어, 한국사는 절대평가로 등급만 표시됩니다.</Text>
          <Text style={styles.notesText}>• 표준점수 및 백분위 합계/평균은 국어, 수학, 탐구1, 탐구2 기준입니다.</Text>
          <Text style={styles.notesText}>• 정확한 지원 전략은 모의지원 시뮬레이션을 통해 확인하세요.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  pageHeader: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  pageTitle: {
    fontSize: theme.typography.title,
    fontWeight: '700',
    color: theme.colors.text,
  },
  pageSubtitle: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
    marginTop: 4,
  },
  guideBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  guideText: {
    fontSize: theme.typography.small,
    color: '#1E40AF',
    lineHeight: 18,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  summaryBlue: {
    backgroundColor: '#3B82F6',
  },
  summaryGreen: {
    backgroundColor: '#22C55E',
  },
  summaryOrange: {
    backgroundColor: '#F97316',
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  summaryAvg: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  tableCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  tableHeader: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  tableTitle: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  tableContent: {},
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  tableRowHeader: {
    backgroundColor: '#F9FAFB',
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    padding: theme.spacing.sm,
    flex: 1,
  },
  tableCellSubject: {
    flex: 1.5,
  },
  tableCellCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCellHeaderText: {
    fontSize: theme.typography.small,
    fontWeight: '500',
    color: theme.colors.muted,
    textAlign: 'center',
  },
  tableCellValue: {
    fontSize: theme.typography.small,
    fontWeight: '600',
    color: theme.colors.muted,
    textAlign: 'center',
  },
  tableCellBlue: {
    color: '#2563EB',
  },
  tableCellGreen: {
    color: '#16A34A',
  },
  subjectLabel: {
    fontSize: theme.typography.small,
    fontWeight: '500',
    color: theme.colors.text,
  },
  subjectSubLabel: {
    fontSize: 11,
    color: theme.colors.muted,
    marginLeft: 4,
  },
  gradeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeText: {
    fontSize: theme.typography.small,
    fontWeight: '700',
  },
  gradeDash: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
  analysisContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  analysisRow: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  analysisRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  analysisLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: theme.typography.body,
    fontWeight: '500',
    color: theme.colors.text,
  },
  analysisSubLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
    marginLeft: 4,
  },
  analysisScores: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  analysisScoreItem: {
    flexDirection: 'row',
  },
  analysisScoreLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
  analysisScoreValue: {
    fontSize: theme.typography.small,
    fontWeight: '600',
    color: theme.colors.text,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  notesCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  notesTitle: {
    fontSize: theme.typography.small,
    fontWeight: '500',
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  notesText: {
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 18,
    marginTop: 2,
  },
});
