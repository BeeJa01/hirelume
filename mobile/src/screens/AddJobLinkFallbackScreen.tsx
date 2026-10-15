import React, { useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/apiClient';
import type { ApiError, JobDescription } from '@/types';

const MIN_JOB_DESCRIPTION_LENGTH = 50;
const MAX_JOB_DESCRIPTION_LENGTH = 50000;

type AddJobLinkFallbackScreenProps = {
  navigation: any;
  route?: {
    params?: {
      sourceUrl?: string;
    };
  };
};

export const AddJobLinkFallbackScreen = ({ navigation, route }: AddJobLinkFallbackScreenProps) => {
  const [jobUrl, setJobUrl] = useState(route?.params?.sourceUrl || '');
  const [extractedText, setExtractedText] = useState('');
  const [reviewReady, setReviewReady] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'extract' | 'save' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [linkFailed, setLinkFailed] = useState(false);
  const characterCount = extractedText.trim().length;

  const extractLinkText = async () => {
    if (loadingAction) return;
    if (!jobUrl.trim()) {
      setErrorMessage('Enter the link to the job post.');
      return;
    }

    setLoadingAction('extract');
    setErrorMessage('');
    setLinkFailed(false);
    setReviewReady(false);
    try {
      const response = await apiClient.post<{ rawText: string }>('/job-descriptions/links/extract', {
        url: jobUrl.trim(),
      });
      setExtractedText(response.rawText);
      setReviewReady(true);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.error?.message || 'Could not read the job page. Please try again.');
      setLinkFailed(true);
    } finally {
      setLoadingAction(null);
    }
  };

  const saveJobDescription = async () => {
    if (loadingAction) return;
    if (characterCount < MIN_JOB_DESCRIPTION_LENGTH) {
      setErrorMessage(`The job description must be at least ${MIN_JOB_DESCRIPTION_LENGTH} characters.`);
      return;
    }

    setLoadingAction('save');
    setErrorMessage('');
    try {
      const savedJob = await apiClient.post<JobDescription>('/job-descriptions', {
        rawText: extractedText.trim(),
        source: 'link',
      });
      navigation.navigate('AddCv', {
        jobDescriptionId: savedJob.id,
        rawText: savedJob.rawText,
        source: 'link',
      });
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.error?.message || 'Could not save the job description. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  const openAlternateInput = (screen: 'AddJobPasteText' | 'AddJobScreenshot') => {
    navigation.navigate(screen, { sourceUrl: jobUrl.trim() });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={20} color="#0F172A" />
            </TouchableOpacity>

            <Text style={styles.screenTitle}>The job</Text>
            <Text style={styles.screenSubtitle}>Tell us about the job you found.</Text>
          </View>

          {/* Stepper Progress */}
          <View style={styles.stepContainer}>
            <Text style={styles.stepText}>Step 1 of 2</Text>
            <View style={styles.progressBarTrack}>
              <View style={styles.progressBarFill} />
            </View>
          </View>

          {/* Segmented Control Tabs */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={styles.segmentTab}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AddJobPasteText', { sourceUrl: jobUrl.trim() })}
            >
              <Text style={styles.segmentTabText}>Paste text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.segmentTab}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AddJobScreenshot', { sourceUrl: jobUrl.trim() })}
            >
              <Text style={styles.segmentTabText}>Screenshot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentTab, styles.segmentTabActive]}
              activeOpacity={0.9}
            >
              <Text style={styles.segmentTabTextActive}>Link</Text>
            </TouchableOpacity>
          </View>

          {/* Input Label & Field */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Link to the job post</Text>
            <View style={styles.inputBox}>
              <Ionicons
                name="link-outline"
                size={18}
                color="#94A3B8"
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.textInput}
                value={jobUrl}
                onChangeText={(value) => {
                  setJobUrl(value);
                  if (errorMessage) {
                    setErrorMessage('');
                    setLinkFailed(false);
                  }
                  if (reviewReady) {
                    setReviewReady(false);
                    setExtractedText('');
                  }
                }}
                placeholder="https://..."
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <Text style={styles.inputHint}>We try to read the page for you.</Text>
          </View>

          {errorMessage ? (
            <View style={styles.warningBox}>
              <Ionicons
                name="warning-outline"
                size={18}
                color="#D97706"
                style={{ marginRight: 8, marginTop: 1 }}
              />
              <Text style={styles.warningText}>
                <Text style={styles.warningBold}>{linkFailed ? 'We could not read that page. ' : ''}</Text>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Fallback Action Buttons */}
          {linkFailed ? <View style={styles.actionButtonsCol}>
            <TouchableOpacity
              style={styles.fallbackButton}
              activeOpacity={0.8}
              onPress={() => openAlternateInput('AddJobPasteText')}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#0F172A"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.fallbackButtonText}>Paste the text instead</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fallbackButton}
              activeOpacity={0.8}
              onPress={() => openAlternateInput('AddJobScreenshot')}
            >
              <Ionicons
                name="images-outline"
                size={18}
                color="#0F172A"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.fallbackButtonText}>Upload a screenshot instead</Text>
            </TouchableOpacity>
          </View> : null}

          {reviewReady ? (
            <View style={styles.reviewSection}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewTitle}>Job text we read</Text>
                <Text style={styles.reviewHint}>Review and edit before saving</Text>
              </View>
              <View style={styles.reviewCard}>
                <TextInput
                  style={styles.reviewInput}
                  multiline
                  value={extractedText}
                  onChangeText={(value) => {
                    setExtractedText(value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  maxLength={MAX_JOB_DESCRIPTION_LENGTH}
                  placeholder="Extracted job text..."
                  placeholderTextColor="#94A3B8"
                  textAlignVertical="top"
                />
              </View>
              <Text style={styles.reviewHint}>
                {characterCount} / {MAX_JOB_DESCRIPTION_LENGTH} characters · at least {MIN_JOB_DESCRIPTION_LENGTH} required
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.continueButtonDisabled, styles.continueButtonEnabled]}
            activeOpacity={0.9}
            onPress={reviewReady ? saveJobDescription : extractLinkText}
            disabled={
              loadingAction !== null
              || (reviewReady
                ? characterCount < MIN_JOB_DESCRIPTION_LENGTH
                : !jobUrl.trim())
            }
          >
            {loadingAction ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.continueButtonDisabledText}>
                  {loadingAction === 'extract' ? 'Reading job link...' : 'Saving...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.continueButtonDisabledText}>
                {reviewReady ? 'Save and continue' : 'Read job link'}
              </Text>
            )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 4,
  },
  stepContainer: {
    marginBottom: 16,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066FF',
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '50%',
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  segmentTabTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1E293B',
  },
  inputHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 12.5,
    color: '#92400E',
    lineHeight: 18,
  },
  warningBold: {
    fontWeight: '700',
  },
  actionButtonsCol: {
    gap: 10,
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 46,
    backgroundColor: '#FFFFFF',
  },
  fallbackButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  continueButtonDisabled: {
    backgroundColor: '#CBD5E1',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonEnabled: {
    backgroundColor: '#0066FF',
  },
  continueButtonDisabledText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  reviewSection: {
    marginTop: 18,
    marginBottom: 8,
  },
  reviewHeader: {
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewHint: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 5,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    minHeight: 140,
  },
  reviewInput: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 19,
    minHeight: 120,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
