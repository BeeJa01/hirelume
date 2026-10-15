import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/apiClient';
import type {
  ApiError,
  InterviewQuestionCategory,
  ResumeAnalysis,
} from '@/types';

type AnalysisResultScreenProps = {
  navigation: any;
  route: {
    params: {
      analysisId: string;
      initialTab?: 'overview' | 'requirements' | 'questions';
      questionsError?: string;
    };
  };
};

const categoryLabels: Record<InterviewQuestionCategory, string> = {
  technical: 'TECHNICAL',
  behavioral: 'BEHAVIORAL',
  cv_gaps: 'QUESTIONS ABOUT CV GAPS',
};

const breakdownLabels = [
  ['skills', 'Skills'],
  ['experience', 'Experience'],
  ['education', 'Education'],
  ['keywords', 'Keywords'],
] as const;

export const AnalysisResultScreen = ({ navigation, route }: AnalysisResultScreenProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'questions'>(
    route.params.initialTab || 'overview',
  );
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(route.params.questionsError || '');
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  const loadAnalysis = async () => {
    setLoading(true);
    setErrorMessage(route.params.questionsError || '');
    try {
      const response = await apiClient.get<{ analysis: ResumeAnalysis }>(
        `/analyses/${route.params.analysisId}`,
      );
      setAnalysis(response.analysis);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.error?.message || 'Could not load this analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalysis();
  }, [route.params.analysisId]);

  const regenerateQuestions = async () => {
    if (!analysis || questionLoading) return;
    setQuestionLoading(true);
    setErrorMessage('');
    try {
      const response = await apiClient.post<{ questions: ResumeAnalysis['questions'] }>(
        `/analyses/${analysis.id}/questions`,
        {},
        { timeout: 90000 },
      );
      setAnalysis({ ...analysis, questions: response.questions });
      setExpandedQuestions([]);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.error?.message || 'Could not generate interview questions.');
    } finally {
      setQuestionLoading(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((current) => current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index]);
  };

  const handleFeedback = () => {
    Alert.alert('Thank you!', 'Your feedback helps improve our analysis recommendations.');
  };

  const matchLabel = (level: ResumeAnalysis['matchLevel']) => (
    level === 'strong' ? 'Strong match' : level === 'good' ? 'Good match' : 'Partial match'
  );

  const scoreColor = (level: ResumeAnalysis['matchLevel']) => (
    level === 'strong' ? '#16A34A' : level === 'good' ? '#0066FF' : '#D97706'
  );

  const renderTextList = (items: string[], icon: string, color: string) => (
    items.map((item, index) => (
      <View key={`${item}-${index}`} style={styles.listItem}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={17} color={color} style={styles.listIcon} />
        <Text style={styles.listText}>{item}</Text>
      </View>
    ))
  );

  const renderQuestions = () => {
    const questions = analysis?.questions || [];
    if (!questions.length) {
      return (
        <View style={styles.emptyQuestions}>
          <Text style={styles.emptyText}>Interview questions have not been generated yet.</Text>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => void regenerateQuestions()}
            disabled={questionLoading}
          >
            {questionLoading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.primaryActionButtonText}>Generate questions</Text>}
          </TouchableOpacity>
        </View>
      );
    }
    let number = 0;
    return (
      <>
        <View style={styles.questionsPillBanner}>
          <Ionicons name="help-buoy-outline" size={16} color="#0066FF" style={{ marginRight: 8 }} />
          <Text style={styles.questionsPillText}>
            <Text style={styles.questionsPillBold}>{questions.length} questions </Text>
            based on this job and your CV
          </Text>
        </View>
        {(['technical', 'behavioral', 'cv_gaps'] as InterviewQuestionCategory[]).map((category) => {
          const items = questions.filter((item) => item.category === category);
          if (!items.length) return null;
          return (
            <View key={category} style={styles.questionCategorySection}>
              <Text style={styles.categoryHeader}>{categoryLabels[category]}</Text>
              {items.map((question) => {
                const questionIndex = number;
                number += 1;
                const expanded = expandedQuestions.includes(questionIndex);
                return (
                  <TouchableOpacity
                    key={`${category}-${question.question}`}
                    style={styles.questionCard}
                    activeOpacity={0.8}
                    onPress={() => toggleQuestion(questionIndex)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                  >
                    <View style={styles.questionNumberBox}>
                      <Text style={styles.questionNumberText}>{questionIndex + 1}</Text>
                    </View>
                    <View style={styles.questionContent}>
                      <Text style={styles.questionText}>{question.question}</Text>
                      {expanded ? <Text style={styles.answerTip}>Tip: {question.tip}</Text> : null}
                    </View>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
        <TouchableOpacity
          style={styles.outlineActionButton}
          activeOpacity={0.8}
          onPress={() => void regenerateQuestions()}
          disabled={questionLoading}
        >
          {questionLoading
            ? <ActivityIndicator color="#0066FF" />
            : <Text style={styles.outlineActionButtonText}>Regenerate questions</Text>}
        </TouchableOpacity>
      </>
    );
  };

  const jobTitle = analysis?.jobDescription?.title || 'Job match analysis';
  const jobSubtitle = [
    analysis?.jobDescription?.company,
    analysis?.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : null,
  ].filter(Boolean).join(' · ');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Home')}
              accessibilityRole="button"
              accessibilityLabel="Back to home"
            >
              <Ionicons name="chevron-back" size={20} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => Alert.alert(
                'About Analysis',
                'This AI-generated score compares evidence in your CV with the job description. It is guidance, not a hiring decision.',
              )}
            >
              <Ionicons name="help-circle-outline" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
          <Text style={styles.jobTitle}>{jobTitle}</Text>
          <Text style={styles.jobSubtitle}>{jobSubtitle || 'Your CV and job match'}</Text>
          <View style={styles.tabContainer}>
            {(['overview', 'requirements', 'questions'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
                  {tab === 'overview' ? 'Overview' : tab === 'requirements' ? 'Requirements' : 'Questions'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator color="#0066FF" size="large" />
            <Text style={styles.stateText}>Loading your analysis...</Text>
          </View>
        ) : errorMessage && !analysis ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.primaryActionButton} onPress={() => void loadAnalysis()}>
              <Text style={styles.primaryActionButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : analysis ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {errorMessage ? <Text style={styles.errorInline}>{errorMessage}</Text> : null}
            <View style={styles.disclaimerBanner}>
              <Ionicons name="information-circle-outline" size={18} color="#0066FF" style={{ marginRight: 8 }} />
              <Text style={styles.disclaimerText}>
                <Text style={styles.disclaimerBold}>This is AI guidance and it can be wrong. </Text>
                Use it to improve your CV and prepare. It is not a decision about you.
              </Text>
            </View>

            {activeTab === 'overview' ? (
              <>
                <View style={styles.scoreGaugeCard}>
                  <View style={[styles.circularGauge, { borderColor: scoreColor(analysis.matchLevel) }]}>
                    <Text style={styles.gaugeNumber}>{analysis.score}</Text>
                    <Text style={styles.gaugeSub}>out of 100</Text>
                  </View>
                  <View style={styles.matchBadgeRow}>
                    <Text style={styles.matchTitle}>{matchLabel(analysis.matchLevel)}</Text>
                    <View style={[styles.matchBadge, { backgroundColor: `${scoreColor(analysis.matchLevel)}15` }]}>
                      <Text style={[styles.matchBadgeText, { color: scoreColor(analysis.matchLevel) }]}>
                        {analysis.matchLevel}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.matchDescription}>{analysis.summary}</Text>
                </View>
                <View style={styles.cardBox}>
                  <Text style={styles.cardBoxTitle}>Strengths</Text>
                  {analysis.strengths.length
                    ? renderTextList(analysis.strengths, 'checkmark-circle-outline', '#16A34A')
                    : <Text style={styles.emptyText}>No strengths were identified.</Text>}
                </View>
                <View style={styles.cardBox}>
                  <Text style={styles.cardBoxTitle}>Gaps to consider</Text>
                  {analysis.gaps.length
                    ? renderTextList(analysis.gaps, 'alert-circle-outline', '#D97706')
                    : <Text style={styles.emptyText}>No major gaps were identified.</Text>}
                </View>
                <View style={styles.cardBox}>
                  <Text style={styles.cardBoxTitle}>CV tips for this job</Text>
                  {renderTextList(analysis.suggestions, 'bulb-outline', '#D97706')}
                </View>
                <View style={styles.usefulSection}>
                  <Text style={styles.usefulTitle}>Was this result useful?</Text>
                  <TouchableOpacity style={styles.usefulBtn} onPress={handleFeedback}>
                    <Text style={styles.usefulBtnText}>👍 Helpful</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.primaryActionButton} onPress={() => setActiveTab('questions')}>
                  <Text style={styles.primaryActionButtonText}>View interview questions</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {activeTab === 'requirements' ? (
              <>
                <View style={styles.cardBox}>
                  <Text style={styles.cardBoxTitle}>Match breakdown</Text>
                  {breakdownLabels.map(([key, label]) => (
                    <View key={key} style={styles.breakdownRow}>
                      <View style={styles.breakdownTitleRow}>
                        <Text style={styles.breakdownLabel}>{label}</Text>
                        <Text style={styles.breakdownScore}>{analysis.breakdown[key]}%</Text>
                      </View>
                      <View style={styles.breakdownTrack}>
                        <View
                          style={[styles.breakdownFill, { width: `${analysis.breakdown[key]}%` }]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.cardBox}>
                  <Text style={styles.skillsSectionTitle}>Matched keywords</Text>
                  <View style={styles.tagsWrapRow}>
                    {analysis.matchedKeywords.map((keyword) => (
                      <View key={keyword} style={styles.matchedTag}>
                        <Text style={styles.matchedTagText}>{keyword}</Text>
                      </View>
                    ))}
                  </View>
                  {!analysis.matchedKeywords.length ? <Text style={styles.emptyText}>No matching keywords found.</Text> : null}
                  <Text style={[styles.skillsSectionTitle, styles.missingTitle]}>Missing keywords</Text>
                  <View style={styles.tagsWrapRow}>
                    {analysis.missingKeywords.map((keyword) => (
                      <View key={keyword} style={styles.missingTag}>
                        <Text style={styles.missingTagText}>{keyword}</Text>
                      </View>
                    ))}
                  </View>
                  {!analysis.missingKeywords.length ? <Text style={styles.emptyText}>No missing keywords found.</Text> : null}
                </View>
                <View style={styles.cardBox}>
                  <Text style={styles.cardBoxTitle}>Evidence strengths</Text>
                  {renderTextList(analysis.strengths, 'checkmark-circle-outline', '#16A34A')}
                </View>
                <View style={styles.cardBox}>
                  <Text style={styles.cardBoxTitle}>Gaps</Text>
                  {renderTextList(analysis.gaps, 'alert-circle-outline', '#D97706')}
                </View>
              </>
            ) : null}

            {activeTab === 'questions' ? renderQuestions() : null}
            <TouchableOpacity
              style={styles.secondaryLinkButton}
              onPress={() => navigation.navigate('AddJobPasteText')}
            >
              <Text style={styles.secondaryLinkText}>Analyse another job</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButton: { padding: 6 },
  jobTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  jobSubtitle: { fontSize: 12.5, color: '#64748B', marginTop: 2, marginBottom: 12 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  tabButton: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 7 },
  tabButtonActive: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabButtonText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  tabButtonTextActive: { fontWeight: '700', color: '#0F172A' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  stateText: { fontSize: 14, color: '#64748B' },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  errorInline: { color: '#DC2626', marginBottom: 10 },
  disclaimerBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    marginBottom: 14,
  },
  disclaimerText: { flex: 1, fontSize: 11.5, color: '#1E40AF', lineHeight: 16 },
  disclaimerBold: { fontWeight: '700' },
  scoreGaugeCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  circularGauge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gaugeNumber: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  gaugeSub: { fontSize: 9.5, fontWeight: '600', color: '#64748B' },
  matchBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  matchTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  matchBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  matchBadgeText: { fontSize: 10.5, fontWeight: '700', textTransform: 'capitalize' },
  matchDescription: { fontSize: 12.5, color: '#475569', textAlign: 'center', lineHeight: 18 },
  cardBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardBoxTitle: { fontSize: 14.5, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  listIcon: { marginRight: 8, marginTop: 1 },
  listText: { flex: 1, fontSize: 12.5, color: '#334155', lineHeight: 18 },
  emptyText: { fontSize: 12.5, color: '#64748B', lineHeight: 18 },
  usefulSection: { marginTop: 8, marginBottom: 16 },
  usefulTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  usefulBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usefulBtnText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  primaryActionButton: {
    backgroundColor: '#0066FF',
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryActionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  secondaryLinkButton: { paddingVertical: 14, alignItems: 'center' },
  secondaryLinkText: { fontSize: 13.5, fontWeight: '700', color: '#0066FF' },
  breakdownRow: { marginBottom: 14 },
  breakdownTitleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  breakdownLabel: { fontSize: 12.5, color: '#334155' },
  breakdownScore: { fontSize: 12.5, fontWeight: '700', color: '#0F172A' },
  breakdownTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  breakdownFill: { height: '100%', backgroundColor: '#0066FF', borderRadius: 3 },
  skillsSectionTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  missingTitle: { marginTop: 18 },
  tagsWrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  matchedTag: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  matchedTagText: { fontSize: 11.5, fontWeight: '600', color: '#1D4ED8' },
  missingTag: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  missingTagText: { fontSize: 11.5, color: '#475569' },
  questionsPillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  questionsPillText: { fontSize: 12.5, color: '#0F172A' },
  questionsPillBold: { fontWeight: '700' },
  questionCategorySection: { marginBottom: 16 },
  categoryHeader: { fontSize: 11, fontWeight: '800', color: '#0066FF', letterSpacing: 0.6, marginBottom: 10 },
  questionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  questionNumberBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  questionNumberText: { fontSize: 11, fontWeight: '700', color: '#0066FF' },
  questionContent: { flex: 1, marginRight: 8 },
  questionText: { fontSize: 13, fontWeight: '600', color: '#0F172A', lineHeight: 18 },
  answerTip: { fontSize: 12, color: '#64748B', lineHeight: 17, marginTop: 8 },
  outlineActionButton: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  outlineActionButtonText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  emptyQuestions: { alignItems: 'stretch', gap: 12, paddingVertical: 16 },
});
