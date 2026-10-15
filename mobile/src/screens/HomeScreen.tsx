import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '@/services/apiClient';
import type { ApiError, ResumeAnalysis } from '@/types';

type HomeScreenProps = {
  navigation: any;
};

export const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { user } = useAuth();
  const [recentAnalyses, setRecentAnalyses] = useState<ResumeAnalysis[]>([]);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [analysisError, setAnalysisError] = useState('');

  const loadAnalyses = useCallback(async () => {
    setLoadingAnalyses(true);
    setAnalysisError('');
    try {
      const response = await apiClient.get<{ analyses: ResumeAnalysis[] }>('/analyses');
      const today = new Date().toDateString();
      setTodayCount(response.analyses.filter(
        (analysis) => new Date(analysis.createdAt).toDateString() === today,
      ).length);
      setRecentAnalyses(response.analyses.slice(0, 3));
    } catch (error) {
      const apiError = error as ApiError;
      setTodayCount(null);
      setAnalysisError(apiError.error?.message || 'Could not load your recent analyses.');
    } finally {
      setLoadingAnalyses(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadAnalyses();
  }, [loadAnalyses]));

  const scoreStyle = (matchLevel: ResumeAnalysis['matchLevel']) => {
    if (matchLevel === 'strong') return { label: 'Strong', color: '#16A34A', background: '#DCFCE7' };
    if (matchLevel === 'good') return { label: 'Good', color: '#0066FF', background: '#EFF6FF' };
    return { label: 'Partial', color: '#D97706', background: '#FEF3C7' };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextCol}>
              <Text style={styles.greetingTitle}>Hi {user?.name || 'there'}</Text>
              <Text style={styles.greetingSubtitle}>
                Check how well you fit any job, and know what to improve before you apply.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.avatarButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Account')}
            >
              <ProfileAvatar user={user} size={44} />
            </TouchableOpacity>
          </View>

          {/* Hero Card: New Analysis */}
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>NEW ANALYSIS</Text>
            </View>

            <Text style={styles.heroTitle}>Check your fit for a job you found</Text>
            <Text style={styles.heroDescription}>
              Add the job and your CV. You get a match score with the reason, your skill gaps, CV tips, next steps and interview questions.
            </Text>

            <TouchableOpacity
              style={styles.heroButton}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('AddJobPasteText')}
            >
              <Ionicons name="sparkles" size={16} color="#0066FF" style={{ marginRight: 8 }} />
              <Text style={styles.heroButtonText}>Start new analysis</Text>
            </TouchableOpacity>
          </View>

          {/* Today's analyses Card */}
          <View style={styles.todayCard}>
            <View style={styles.todayHeaderRow}>
              <Text style={styles.todayTitle}>Today's analyses</Text>
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>
                  {todayCount === null ? '—' : `${todayCount} completed`}
                </Text>
              </View>
            </View>

            <Text style={styles.todayCaption}>
              Completed analyses saved to your account today.
            </Text>
          </View>

          {/* Recent analyses Section */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Text style={styles.recentTitle}>Recent analyses</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('MyAnalyses')}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>

            {loadingAnalyses ? (
              <ActivityIndicator color="#0066FF" style={styles.analysisState} />
            ) : analysisError ? (
              <View style={styles.analysisState}>
                <Text style={styles.analysisStateError}>{analysisError}</Text>
                <TouchableOpacity onPress={() => void loadAnalyses()}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : recentAnalyses.length === 0 ? (
              <View style={styles.analysisState}>
                <Text style={styles.analysisStateText}>Your completed analyses will appear here.</Text>
              </View>
            ) : recentAnalyses.map((item) => {
              const score = scoreStyle(item.matchLevel);
              return <View key={item.id} style={styles.analysisCard}>
                <View style={styles.analysisCardTop}>
                  <View style={styles.jobInfoCol}>
                    <Text style={styles.analysisJobTitle}>{item.jobDescription?.title || 'Job match analysis'}</Text>
                    <Text style={styles.analysisCompany}>{item.jobDescription?.company || 'Company not provided'}</Text>
                  </View>
                  <View style={styles.scoreCol}>
                    <Text style={[styles.scoreNumber, { color: score.color }]}>
                      {item.score}
                    </Text>
                    <View style={[styles.scoreBadge, { backgroundColor: score.background }]}>
                      <Text style={[styles.scoreBadgeText, { color: score.color }]}>
                        {score.label}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.analysisCardBottom}>
                  <Text style={styles.analysisDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  <TouchableOpacity
                    style={styles.viewResultBtn}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('AnalysisResult', { analysisId: item.id })}
                  >
                    <Text style={styles.viewResultText}>View result</Text>
                    <Ionicons name="chevron-forward" size={14} color="#0066FF" />
                  </TouchableOpacity>
                </View>
              </View>;
            })}
          </View>
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity
            style={styles.navTab}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddJobPasteText')}
          >
            <Ionicons name="sparkles" size={20} color="#0066FF" />
            <Text style={[styles.navTabLabel, styles.navTabLabelActive]}>New</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navTab} activeOpacity={0.8} onPress={() => navigation.navigate('MyAnalyses')}>
            <Ionicons name="document-text-outline" size={20} color="#94A3B8" />
            <Text style={styles.navTabLabel}>Analyses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navTab} activeOpacity={0.8} onPress={() => navigation.navigate('Applications')}>
            <Ionicons name="briefcase-outline" size={20} color="#94A3B8" />
            <Text style={styles.navTabLabel}>Applications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navTab} activeOpacity={0.8} onPress={() => navigation.navigate('Account')}>
            <Ionicons name="person-outline" size={20} color="#94A3B8" />
            <Text style={styles.navTabLabel}>Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },
  avatarButton: {
    borderRadius: 24,
  },
  heroCard: {
    backgroundColor: '#0A192F',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  heroBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#60A5FA',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroButton: {
    backgroundColor: '#FFFFFF',
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  todayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  todayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  todayBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  todayCaption: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 4,
  },
  recentSection: {
    marginBottom: 20,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066FF',
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  analysisState: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  analysisStateText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  analysisStateError: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    color: '#0066FF',
    fontSize: 13,
    fontWeight: '700',
  },
  analysisCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobInfoCol: {
    flex: 1,
    paddingRight: 12,
  },
  analysisJobTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  analysisCompany: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  scoreBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  analysisCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  viewResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewResultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066FF',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    justifyContent: 'space-around',
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  navTabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 4,
  },
  navTabLabelActive: {
    color: '#0066FF',
    fontWeight: '700',
  },
});
