import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/apiClient';
import type { ApiError, ResumeAnalysis } from '@/types';

type AnalysingScreenProps = {
  navigation: any;
  route: {
    params: {
      cvId: string;
      jobDescriptionId: string;
    };
  };
};

export const AnalysingScreen = ({ navigation, route }: AnalysingScreenProps) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const activeRequest = useRef(false);

  useEffect(() => {
    void createAnalysis();
  }, []);

  const createAnalysis = async () => {
    if (activeRequest.current) return;
    activeRequest.current = true;
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await apiClient.post<{ analysis: ResumeAnalysis }>('/analyses', {
        cvId: route.params.cvId,
        jobDescriptionId: route.params.jobDescriptionId,
      }, { timeout: 90000 });
      let questionsError: string | undefined;
      try {
        await apiClient.post(`/analyses/${response.analysis.id}/questions`, {}, { timeout: 90000 });
      } catch (error) {
        const apiError = error as ApiError;
        questionsError = apiError.error?.message || 'Interview questions could not be generated. You can retry from the Questions tab.';
      }
      navigation.replace('AnalysisResult', { analysisId: response.analysis.id, questionsError });
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.error?.message || 'The analysis could not be completed. Please try again.');
      activeRequest.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Sparkle Hero Icon */}
          <View style={styles.sparkleIconCircle}>
            <Ionicons name="sparkles" size={26} color="#0066FF" />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>Analysing your fit</Text>
          <Text style={styles.subtitle}>
            Your CV is being compared with this job
          </Text>

          {/* Analysis Steps Card */}
          <View style={styles.stepsCard}>
            {/* Step 1 */}
            <View style={styles.stepRow}>
              <View style={styles.completedIconBox}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.stepTitleCompleted}>Reading your CV</Text>
            </View>

            {/* Step 2 */}
            <View style={styles.stepRow}>
              <View style={styles.completedIconBox}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.stepTitleCompleted}>Reading the job</Text>
            </View>

            {/* Step 3 (Active) */}
            <View style={styles.stepRow}>
              <View style={styles.activeIconBox}>
                <Text style={styles.activeIconText}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitleActive}>
                  Comparing each requirement with your CV
                </Text>
                <Text style={styles.stepSubtitleActive}>This is the longest step.</Text>
              </View>
            </View>

            {/* Step 4 (Pending) */}
            <View style={styles.stepRow}>
              <View style={styles.pendingIconBox}>
                <Text style={styles.pendingIconText}>4</Text>
              </View>
              <Text style={styles.stepTitlePending}>
                Writing your results and interview questions
              </Text>
            </View>
          </View>

          {/* Segmented Progress Bar */}
          <View style={styles.progressBarRow}>
            <View style={[styles.progressSegment, styles.segmentFilled]} />
            <View style={[styles.progressSegment, styles.segmentFilled]} />
            <View style={[styles.progressSegment, styles.segmentFilled]} />
            <View style={[styles.progressSegment, styles.segmentUnfilled]} />
          </View>

          {/* Subtext Notice */}
          <Text style={styles.noticeText}>
            Most analyses finish within a minute. Your CV and job description stay available if you need to retry.
          </Text>
          {loading ? (
            <ActivityIndicator style={styles.loadingIndicator} color="#0066FF" />
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => void createAnalysis()}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backLinkText}>Back to your CV</Text>
              </TouchableOpacity>
            </View>
          )}
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  sparkleIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
  },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    gap: 16,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  completedIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  activeIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  activeIconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  pendingIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  pendingIconText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  stepTitleCompleted: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  stepTitleActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
  },
  stepSubtitleActive: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  stepTitlePending: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
    flex: 1,
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  segmentFilled: {
    backgroundColor: '#0066FF',
  },
  segmentUnfilled: {
    backgroundColor: '#E2E8F0',
  },
  noticeText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 18,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  backLinkText: {
    color: '#0066FF',
    fontSize: 13,
    fontWeight: '600',
  },
});
