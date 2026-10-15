import React, { useEffect, useState } from 'react';
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
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { apiClient } from '@/services/apiClient';
import type { ApiError, CvSummary } from '@/types';

type AddCvScreenProps = {
  navigation: any;
  route?: {
    params?: {
      jobDescriptionId: string;
      rawText: string;
      source?: 'text' | 'image' | 'link';
    };
  };
};

const MAX_CV_SIZE = 5 * 1024 * 1024;

export const AddCvScreen = ({ navigation, route }: AddCvScreenProps) => {
  const [activeCv, setActiveCv] = useState<CvSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const savedJobText = route?.params?.rawText || '';
  const jobDescriptionId = route?.params?.jobDescriptionId || '';
  const jobWordCount = savedJobText.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    let mounted = true;
    apiClient.get<{ cv: CvSummary | null }>('/cvs/active')
      .then((response) => {
        if (mounted) setActiveCv(response.cv);
      })
      .catch((error: ApiError) => {
        if (mounted) setErrorMessage(error.error?.message || 'Could not load your active CV.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const readableSize = (bytes: number) => (
    bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  );

  const friendlyError = (error: unknown) => {
    const apiError = error as ApiError;
    switch (apiError.error?.code) {
      case 'FILE_TOO_LARGE':
        return 'Your CV must be 5 MB or smaller.';
      case 'UNSUPPORTED_FILE_TYPE':
        return 'Use a PDF, DOCX, JPEG, PNG, or WebP CV.';
      case 'CV_UNREADABLE':
        return 'We could not read this file. Try a different document or clearer photo.';
      case 'EMPTY_CV':
        return 'No readable CV text was found. Try a clearer photo or text-based document.';
      default:
        return apiError.error?.message || 'Could not upload your CV. Check your connection and try again.';
    }
  };

  const uploadCv = async (file: { uri: string; name: string; type: string; size?: number }) => {
    if (file.size !== undefined && file.size > MAX_CV_SIZE) {
      setErrorMessage('Your CV must be 5 MB or smaller.');
      return;
    }
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
    setUploading(true);
    setUploadProgress(0);
    setErrorMessage('');
    try {
      const response = await apiClient.upload<{ cv: CvSummary }>('/cvs/active', formData, {
        timeout: 120000,
        onUploadProgress: (progress) => {
          if (progress.total) setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
        },
      });
      setActiveCv(response.cv);
    } catch (error) {
      setErrorMessage(friendlyError(error));
    } finally {
      setUploading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      await uploadCv({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || (asset.name.toLowerCase().endsWith('.pdf')
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        size: asset.size,
      });
    } catch {
      setErrorMessage('Could not open your files. Please try again.');
    }
  };

  const pickPhoto = async () => {
    try {
      const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      const permission = currentPermission.granted
        ? currentPermission
        : currentPermission.canAskAgain
          ? await ImagePicker.requestMediaLibraryPermissionsAsync()
          : currentPermission;
      if (!permission.granted) {
        setErrorMessage('Allow photo access to select a picture of your CV.');
        if (!permission.canAskAgain) {
          Alert.alert('Photo access is off', 'Allow photo access in Settings to upload a CV image.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: () => void Linking.openSettings() },
          ]);
        }
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });
      if (result.canceled) return;
      const image = result.assets[0];
      if (image.fileSize !== undefined && image.fileSize > MAX_CV_SIZE) {
        setErrorMessage('Your CV image must be 5 MB or smaller.');
        return;
      }
      const manipulator = ImageManipulator.manipulate(image.uri);
      if (image.width > 1800) manipulator.resize({ width: 1800 });
      const rendered = await manipulator.renderAsync();
      const compressed = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.78,
      });
      await uploadCv({
        uri: compressed.uri,
        name: `cv-photo-${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: image.fileSize,
      });
    } catch {
      setErrorMessage('Could not open your photo library. Please try again.');
    }
  };

  const handleChooseCv = () => {
    Alert.alert(activeCv ? 'Replace active CV' : 'Upload your CV', 'Choose where to get your CV.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose PDF or DOCX', onPress: () => void pickDocument() },
      { text: 'Choose a photo', onPress: () => void pickPhoto() },
    ]);
  };

  const handleRemoveCv = () => {
    Alert.alert('Remove active CV?', 'You will need to upload another CV before starting an analysis.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete('/cvs/active');
            setActiveCv(null);
            setErrorMessage('');
          } catch (error) {
            setErrorMessage(friendlyError(error));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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

            <Text style={styles.screenTitle}>Your CV</Text>
            <Text style={styles.screenSubtitle}>We only use it to compare it with this job.</Text>
          </View>

          {/* Stepper Progress (Step 2 of 2) */}
          <View style={styles.stepContainer}>
            <Text style={styles.stepText}>Step 2 of 2</Text>
            <View style={styles.progressBarTrack}>
              <View style={styles.progressBarFill} />
            </View>
          </View>

          {/* Job Summary Banner Card */}
          <View style={styles.jobSummaryCard}>
            <View style={styles.jobIconBox}>
              <Ionicons name="briefcase-outline" size={18} color="#0066FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jobSummaryTitle}>
                {savedJobText ? 'Job description saved' : 'No job description saved'}
              </Text>
              <Text style={styles.jobSummaryMeta}>
                {savedJobText
                  ? `${jobWordCount} words · ${route?.params?.source || 'job'} input`
                  : 'Add a job description to continue'}
              </Text>
            </View>
          </View>

          {/* Your CV Section */}
          <View style={styles.cvSection}>
            <Text style={styles.sectionHeaderTitle}>Your CV</Text>

            {loading ? (
              <View style={styles.emptyCvCard}>
                <ActivityIndicator color="#0066FF" />
                <Text style={styles.emptyCvText}>Checking your active CV...</Text>
              </View>
            ) : activeCv ? (
              <View style={styles.cvCard}>
                <View style={styles.cvCardTop}>
                  <View style={styles.cvIconBox}>
                    <Ionicons name="document-text-outline" size={22} color="#0066FF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cvFileName} numberOfLines={1}>{activeCv.fileName}</Text>
                    <Text style={styles.cvFileMeta}>
                      {readableSize(activeCv.size)} · {activeCv.mimeType.split('/').pop()?.toUpperCase()}
                    </Text>
                    <View style={styles.readableBadge}>
                      <Ionicons name="checkmark" size={12} color="#16A34A" style={{ marginRight: 3 }} />
                      <Text style={styles.readableBadgeText}>Text extracted</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cvActionRow}>
                  <TouchableOpacity
                    style={[styles.replaceButton, styles.cvActionButton]}
                    activeOpacity={0.8}
                    onPress={handleChooseCv}
                    disabled={uploading}
                  >
                    <Text style={styles.replaceButtonText}>Replace</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.replaceButton, styles.cvActionButton]}
                    activeOpacity={0.8}
                    onPress={handleRemoveCv}
                    disabled={uploading}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCvCard}>
                <Ionicons name="document-text-outline" size={24} color="#94A3B8" />
                <Text style={styles.emptyCvText}>No active CV uploaded</Text>
                <TouchableOpacity
                  style={styles.replaceButton}
                  activeOpacity={0.8}
                  onPress={handleChooseCv}
                  disabled={uploading}
                >
                  <Text style={styles.replaceButtonText}>Choose a CV</Text>
                </TouchableOpacity>
              </View>
            )}

            {uploading ? (
              <View style={styles.uploadProgressRow}>
                <ActivityIndicator color="#0066FF" size="small" />
                <Text style={styles.cvFileTypesHint}>
                  Uploading and reading CV{uploadProgress ? ` · ${uploadProgress}%` : '...'}
                </Text>
              </View>
            ) : null}

            <Text style={styles.cvFileTypesHint}>
              PDF, DOCX or photo. Up to 5 MB. Scanned PDFs may not be readable.
            </Text>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>

          {/* What you will get Card */}
          <View style={styles.whatYouGetCard}>
            <Text style={styles.whatYouGetTitle}>What you will get</Text>

            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#0066FF" style={styles.featureIcon} />
              <Text style={styles.featureText}>A match score with the reason behind it.</Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#0066FF" style={styles.featureIcon} />
              <Text style={styles.featureText}>Each requirement: met, partly met or not found.</Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#0066FF" style={styles.featureIcon} />
              <Text style={styles.featureText}>Gaps, CV tips and next steps for this job.</Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#0066FF" style={styles.featureIcon} />
              <Text style={styles.featureText}>8 to 10 interview questions.</Text>
            </View>
          </View>

          {/* Privacy Notice Banner */}
          <View style={styles.privacyBanner}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#059669"
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <Text style={styles.privacyText}>
              <Text style={styles.privacyBold}>Your privacy. </Text>
              We remove detected email addresses, phone numbers and street-address patterns from your CV before sending it to the AI.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom CTA Area */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.analyseButton, (!activeCv || !jobDescriptionId || uploading) && styles.analyseButtonDisabled]}
            activeOpacity={0.9}
            disabled={!activeCv || !jobDescriptionId || uploading}
            onPress={() => {
              if (!activeCv || !jobDescriptionId) return;
              navigation.navigate('Analysing', {
                cvId: activeCv.id,
                jobDescriptionId,
              });
            }}
          >
            <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.analyseButtonText}>
              {uploading ? 'Uploading CV...' : 'Analyse my fit'}
            </Text>
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
    width: '100%',
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 2,
  },
  jobSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  jobIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  jobSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  jobSummaryMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cvSection: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  cvCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
  },
  cvCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cvIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cvFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cvFileMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  cvActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cvActionButton: {
    flex: 1,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyCvCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  emptyCvText: {
    color: '#64748B',
    fontSize: 13,
  },
  uploadProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  readableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  readableBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  replaceButton: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  replaceButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cvFileTypesHint: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 8,
  },
  whatYouGetCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  whatYouGetTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  privacyBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 17,
  },
  privacyBold: {
    fontWeight: '700',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  analyseButton: {
    backgroundColor: '#0066FF',
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyseButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  analyseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
