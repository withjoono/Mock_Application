import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../lib/theme';
import FormSection from '../components/FormSection';
import LabeledInput from '../components/LabeledInput';
import TagSelector from '../components/TagSelector';
import { MaterialIcons, Ionicons, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Dropdown from '../components/Dropdown';
import { INQUIRY_SUBJECT_OPTIONS } from '../lib/constants';
import AppHeader from '../components/AppHeader';
import HamburgerMenu from '../components/HamburgerMenu';

export default function StandardScoreInputScreen() {
  const navigation = useNavigation<any>();
  const [menuOpen, setMenuOpen] = useState(false);

  const [koreanStd, setKoreanStd] = useState<string>('');
  const [mathType, setMathType] = useState<'확통' | '미적' | '기하' | undefined>();
  const [mathStd, setMathStd] = useState<string>('');
  const [english, setEnglish] = useState<string>('');
  const [history, setHistory] = useState<string>('');
  const [sci1Type, setSci1Type] = useState<string | undefined>();
  const [sci1Std, setSci1Std] = useState<string>('');
  const [sci2Type, setSci2Type] = useState<string | undefined>();
  const [sci2Std, setSci2Std] = useState<string>('');
  const [secondLang, setSecondLang] = useState<Record<string, string>>({});

  const handleReset = () => {
    setKoreanStd('');
    setMathType(undefined);
    setMathStd('');
    setEnglish('');
    setHistory('');
    setSci1Type(undefined);
    setSci1Std('');
    setSci2Type(undefined);
    setSci2Std('');
    setSecondLang({});
  };

  const handleSave = () => {
    // Navigate to ScoreAnalysis with the entered scores
    navigation.navigate('ScoreAnalysis', {
      koreanStd,
      mathType,
      mathStd,
      english,
      history,
      sci1Type,
      sci1Std,
      sci2Type,
      sci2Std,
      secondLang,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader title="점수 입력" onPressMenu={() => setMenuOpen(true)} />
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
        {/* 페이지 제목 */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>표준점수 입력</Text>
          <Text style={styles.pageSubtitle}>2026학년도 수능 성적을 입력해주세요</Text>
        </View>

        <FormSection
          title="국어"
          icon={<MaterialIcons name="menu-book" size={20} color={theme.colors.primary} />}
        >
          <LabeledInput
            label="표준점수"
            keyboardType="numeric"
            placeholder="0"
            hint="범위: 0 ~ 200"
            value={koreanStd}
            onChangeText={setKoreanStd}
          />
        </FormSection>

        <FormSection
          title="수학"
          icon={<AntDesign name="calculator" size={20} color={theme.colors.primary} />}
          style={{ marginTop: theme.spacing.md }}
        >
          <TagSelector
            options={[
              { key: '확통', label: '확통' },
              { key: '미적', label: '미적' },
              { key: '기하', label: '기하' },
            ]}
            value={mathType}
            onChange={(key) => setMathType(key as '확통' | '미적' | '기하')}
          />
          <LabeledInput
            label="표준점수"
            keyboardType="numeric"
            placeholder="0"
            hint="범위: 0 ~ 200"
            value={mathStd}
            onChangeText={setMathStd}
          />
        </FormSection>

        <FormSection
          title="영어"
          icon={<Ionicons name="language-outline" size={20} color={theme.colors.primary} />}
          style={{ marginTop: theme.spacing.md }}
        >
          <LabeledInput
            label="등급"
            keyboardType="numeric"
            placeholder="1"
            hint="범위: 1 ~ 9"
            value={english}
            onChangeText={setEnglish}
          />
        </FormSection>

        <FormSection
          title="한국사"
          icon={<MaterialIcons name="history-edu" size={20} color={theme.colors.primary} />}
          style={{ marginTop: theme.spacing.md }}
        >
          <LabeledInput
            label="등급"
            keyboardType="numeric"
            placeholder="1"
            hint="범위: 1 ~ 9"
            value={history}
            onChangeText={setHistory}
          />
        </FormSection>

        <FormSection
          title="탐구 1"
          icon={<Ionicons name="flask-outline" size={20} color={theme.colors.primary} />}
          style={{ marginTop: theme.spacing.md }}
        >
          <Dropdown
            label="선택과목"
            options={INQUIRY_SUBJECT_OPTIONS}
            value={sci1Type}
            onChange={setSci1Type}
          />
          <LabeledInput
            label="표준점수"
            keyboardType="numeric"
            placeholder="0"
            hint="범위: 0 ~ 100"
            value={sci1Std}
            onChangeText={setSci1Std}
          />
        </FormSection>

        <FormSection
          title="탐구 2"
          icon={<Ionicons name="flask" size={20} color={theme.colors.primary} />}
          style={{ marginTop: theme.spacing.md }}
        >
          <Dropdown
            label="선택과목"
            options={INQUIRY_SUBJECT_OPTIONS}
            value={sci2Type}
            onChange={setSci2Type}
          />
          <LabeledInput
            label="표준점수"
            keyboardType="numeric"
            placeholder="0"
            hint="범위: 0 ~ 100"
            value={sci2Std}
            onChangeText={setSci2Std}
          />
        </FormSection>

        <FormSection
          title="제2외국어"
          icon={<Ionicons name="globe-outline" size={20} color={theme.colors.primary} />}
          style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.xl }}
        >
          <View style={{ gap: theme.spacing.sm }}>
            <View style={styles.secondLangGrid}>
              {['독일어', '프랑스어', '스페인어', '중국어', '일본어', '러시아어', '아랍어', '베트남어'].map((lang) => (
                <LabeledInput
                  key={lang}
                  label={lang}
                  keyboardType="numeric"
                  placeholder="등급"
                  containerStyle={{ width: '48%' }}
                  value={secondLang[lang] ?? ''}
                  onChangeText={(v) => setSecondLang((prev) => ({ ...prev, [lang]: v }))}
                />
              ))}
            </View>
          </View>
        </FormSection>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.footerBtn, styles.secondary]} onPress={handleReset}>
          <Text style={[styles.footerText, { color: theme.colors.text }]}>초기화</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerBtn, styles.primary]} onPress={handleSave}>
          <Text style={[styles.footerText, { color: theme.colors.onPrimary }]}>분석하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  pageHeader: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
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
  secondLangGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.outline,
  },
  footerText: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
  },
});