import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, Pressable } from 'react-native';
import theme from '../lib/theme';

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
  // navigation callbacks for ordered menu
  onNavigateScoreInput: () => void;
  onNavigateScoreAnalysis?: () => void; // 성적 분석
  onNavigateStrategy: () => void; // 수시 Vs 정시 전략
  onNavigateCollegeSelect: () => void;
  onNavigateSupportStatus: () => void;
  onNavigateSupportStrategy: () => void; // 지원 전략
  onNavigateMockApply?: () => void; // 모의지원
}

// 데모 화면들(정적 목데이터)은 개발 빌드에서만 노출 — 스토어 심사 리스크 방지
const DEMO_MENU_ENABLED = __DEV__;

export default function HamburgerMenu({ visible, onClose, onNavigateScoreInput, onNavigateScoreAnalysis, onNavigateStrategy, onNavigateCollegeSelect, onNavigateSupportStatus, onNavigateSupportStrategy, onNavigateMockApply }: HamburgerMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>
      <View style={styles.sheet}>
        <Text style={styles.menuHeader}>메뉴</Text>
        {!DEMO_MENU_ENABLED && (
          <Text style={styles.menuNotice}>추가 분석 기능을 준비 중입니다.</Text>
        )}
        {DEMO_MENU_ENABLED && (
        <>
        {/* 1. 점수입력 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onNavigateScoreInput(); }}>
          <Text style={styles.menuText}>점수입력</Text>
        </TouchableOpacity>
        {/* 2. 성적 분석 */}
        {onNavigateScoreAnalysis && (
          <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onNavigateScoreAnalysis(); }}>
            <Text style={styles.menuText}>성적 분석</Text>
          </TouchableOpacity>
        )}
        {/* 3. 수시 Vs 정시 전략 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onNavigateStrategy(); }}>
          <Text style={styles.menuText}>수시 Vs 정시 전략</Text>
        </TouchableOpacity>
        {/* 3. 대학 선택 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onNavigateCollegeSelect(); }}>
          <Text style={styles.menuText}>대학 선택</Text>
        </TouchableOpacity>
        {/* 4. 모의지원 현황 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onNavigateSupportStatus(); }}>
          <Text style={styles.menuText}>모의지원 현황</Text>
        </TouchableOpacity>
        {/* 5. 지원 전략 */}
        <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onNavigateSupportStrategy(); }}>
          <Text style={styles.menuText}>지원 전략</Text>
        </TouchableOpacity>
        {/* 6. 모의지원 */}
        {onNavigateMockApply && (
          <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onNavigateMockApply(); }}>
            <Text style={styles.menuText}>모의지원</Text>
          </TouchableOpacity>
        )}
        </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '70%',
    backgroundColor: theme.colors.surface,
    paddingTop: 56,
    borderRightWidth: 1,
    borderRightColor: theme.colors.outline,
    paddingHorizontal: theme.spacing.lg,
  },
  menuHeader: {
    fontSize: theme.typography.title,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  menuItem: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  menuNotice: {
    fontSize: theme.typography.small,
    color: theme.colors.muted,
  },
  menuText: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600'
  }
});