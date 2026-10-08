import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Line, Circle, Rect, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import theme from '../lib/theme';
import {
  Statistics,
  NormalDistributionCurve,
  PASS_STATUS_COLORS,
} from '../lib/types/mock-application';

interface NormalDistributionChartProps {
  statistics: Statistics;
  normalDistributionCurve?: NormalDistributionCurve;
  myScore?: number;
}

const screenWidth = Dimensions.get('window').width - 64; // padding 고려

// 정규분포 확률밀도함수 계산
function normalPDF(x: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return x === mean ? 1 : 0;
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
  return coefficient * Math.exp(exponent);
}

// 정규분포 곡선 포인트 생성
function generateNormalCurvePoints(
  mean: number,
  stdDev: number,
  min: number,
  max: number,
  numPoints: number = 50
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const step = (max - min) / numPoints;

  for (let i = 0; i <= numPoints; i++) {
    const x = min + i * step;
    const y = normalPDF(x, mean, stdDev);
    points.push({ x, y });
  }

  return points;
}

export default function NormalDistributionChart({
  statistics,
  normalDistributionCurve,
  myScore,
}: NormalDistributionChartProps) {
  const { mean, stdDev, min, max, safePassThreshold, passThreshold } = statistics;

  // 차트 데이터 생성
  const chartData = useMemo(() => {
    const points = normalDistributionCurve?.points ||
      generateNormalCurvePoints(mean, stdDev, min - stdDev, max + stdDev);

    const xValues = points.map((p) => p.x);
    const yValues = points.map((p) => p.y);

    // Y값 정규화 (0~1 범위로)
    const maxY = Math.max(...yValues);
    const normalizedY = yValues.map((y) => (y / maxY) * 100);

    return {
      labels: [], // X축 레이블은 커스텀으로 표시
      datasets: [
        {
          data: normalizedY,
          strokeWidth: 2,
          color: (opacity = 1) => `rgba(11, 95, 255, ${opacity})`,
        },
      ],
    };
  }, [mean, stdDev, min, max, normalDistributionCurve]);

  // 범례 데이터
  const legendItems = [
    { color: PASS_STATUS_COLORS['안정합격'], label: '안정합격', value: safePassThreshold },
    { color: PASS_STATUS_COLORS['합격가능'], label: '합격선', value: passThreshold },
    { color: theme.colors.primary, label: '평균', value: mean },
    ...(myScore ? [{ color: '#f59e0b', label: '내 점수', value: myScore }] : []),
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>지원현황 분포</Text>
      <Text style={styles.subtitle}>
        평균 {mean.toFixed(1)}점 / 표준편차 {stdDev.toFixed(2)}
      </Text>

      {/* 차트 */}
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth}
          height={180}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(11, 95, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '0', // 점 숨기기
            },
            propsForBackgroundLines: {
              strokeDasharray: '5,5',
              stroke: '#e5e7eb',
            },
            fillShadowGradient: theme.colors.primary,
            fillShadowGradientOpacity: 0.1,
          }}
          bezier
          style={styles.chart}
          withDots={false}
          withShadow={true}
          withInnerLines={true}
          withOuterLines={false}
          withHorizontalLabels={false}
          withVerticalLabels={false}
        />

        {/* 기준선 오버레이 - SVG로 직접 그리기 */}
        <Svg
          style={styles.overlay}
          width={screenWidth}
          height={180}
          viewBox={`0 0 ${screenWidth} 180`}
        >
          {/* 안정합격 기준선 */}
          {safePassThreshold && (
            <G>
              <Line
                x1={((safePassThreshold - min) / (max - min)) * screenWidth}
                y1="10"
                x2={((safePassThreshold - min) / (max - min)) * screenWidth}
                y2="160"
                stroke={PASS_STATUS_COLORS['안정합격']}
                strokeWidth="2"
                strokeDasharray="4,4"
              />
            </G>
          )}

          {/* 합격 기준선 */}
          {passThreshold && (
            <G>
              <Line
                x1={((passThreshold - min) / (max - min)) * screenWidth}
                y1="10"
                x2={((passThreshold - min) / (max - min)) * screenWidth}
                y2="160"
                stroke={PASS_STATUS_COLORS['합격가능']}
                strokeWidth="2"
                strokeDasharray="4,4"
              />
            </G>
          )}

          {/* 평균선 */}
          <G>
            <Line
              x1={((mean - min) / (max - min)) * screenWidth}
              y1="10"
              x2={((mean - min) / (max - min)) * screenWidth}
              y2="160"
              stroke={theme.colors.primary}
              strokeWidth="2"
            />
          </G>

          {/* 내 점수 표시 */}
          {myScore && myScore >= min && myScore <= max && (
            <G>
              <Line
                x1={((myScore - min) / (max - min)) * screenWidth}
                y1="10"
                x2={((myScore - min) / (max - min)) * screenWidth}
                y2="160"
                stroke="#f59e0b"
                strokeWidth="3"
              />
              <Circle
                cx={((myScore - min) / (max - min)) * screenWidth}
                cy="20"
                r="6"
                fill="#f59e0b"
              />
            </G>
          )}
        </Svg>
      </View>

      {/* X축 레이블 */}
      <View style={styles.xAxisLabels}>
        <Text style={styles.xAxisLabel}>{min.toFixed(0)}</Text>
        <Text style={styles.xAxisLabel}>{((min + max) / 2).toFixed(0)}</Text>
        <Text style={styles.xAxisLabel}>{max.toFixed(0)}</Text>
      </View>

      {/* 범례 */}
      <View style={styles.legend}>
        {legendItems.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.label}: {item.value?.toFixed(1) ?? '-'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
  },
  chartContainer: {
    position: 'relative',
  },
  chart: {
    marginLeft: -16,
    borderRadius: theme.radii.md,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  xAxisLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: theme.typography.small,
    color: theme.colors.text,
  },
});
