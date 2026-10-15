import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { apiClient } from '@/services/apiClient';
import type { ApiError, JobDescription } from '@/types';

type AddJobScreenshotScreenProps = {
  navigation: any;
  route?: {
    params?: {
      sourceUrl?: string;
    };
  };
};

const MAX_IMAGES = 5;
const MIN_JOB_DESCRIPTION_LENGTH = 50;
const MAX_JOB_DESCRIPTION_LENGTH = 50000;

export const AddJobScreenshotScreen = ({ navigation, route }: AddJobScreenshotScreenProps) => {
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [extractedText, setExtractedText] = useState('');
  const [reviewReady, setReviewReady] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'ocr' | 'save' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const characterCount = extractedText.trim().length;

  const readableSize = (bytes?: number) => {
    if (bytes === undefined) return 'Image';
    return bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePermissionDenied = (canAskAgain: boolean) => {
    setErrorMessage('Allow photo access to select job-description screenshots.');
    if (!canAskAgain) {
      Alert.alert(
        'Photo access is off',
        'Allow Hirelume to access your photos in Settings to upload screenshots.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open settings', onPress: () => void Linking.openSettings() },
        ],
      );
    }
  };

  const handleAddImages = async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setErrorMessage(`You can select up to ${MAX_IMAGES} screenshots.`);
      return;
    }

    try {
      const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      const permission = currentPermission.granted
        ? currentPermission
        : currentPermission.canAskAgain
          ? await ImagePicker.requestMediaLibraryPermissionsAsync()
          : currentPermission;
      if (!permission.granted) {
        handlePermissionDenied(permission.canAskAgain);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 1,
      });
      if (result.canceled) return;
      const selected = result.assets.filter((asset) => asset.type === 'image');
      if (!selected.length) {
        setErrorMessage('Select one or more image screenshots.');
        return;
      }

      setImages((current) => [...current, ...selected].slice(0, MAX_IMAGES));
      setReviewReady(false);
      setExtractedText('');
      setErrorMessage('');
    } catch {
      setErrorMessage('Could not open your photo library. Please try again.');
    }
  };

  const removeImage = (uri: string) => {
    setImages((current) => current.filter((image) => image.uri !== uri));
    setReviewReady(false);
    setExtractedText('');
  };

  const readErrorMessage = (error: unknown) => {
    const apiError = error as ApiError;
    switch (apiError.error?.code) {
      case 'FILE_TOO_LARGE':
        return 'A screenshot is too large to upload. Try selecting fewer or smaller images.';
      case 'UNSUPPORTED_FILE_TYPE':
        return 'Use JPEG, PNG, or WebP screenshots.';
      case 'NO_TEXT_FOUND':
        return apiError.error.message || 'No readable text was found. Try clearer screenshots or paste the text instead.';
      case 'OCR_FAILED':
        return apiError.error.message || 'Could not read the screenshots. Please try again.';
      case 'TOO_MANY_IMAGES':
        return `Select no more than ${MAX_IMAGES} screenshots.`;
      default:
        return apiError.error?.message || 'Could not upload the screenshots. Check your connection and try again.';
    }
  };

  const readScreenshots = async () => {
    if (!images.length || loadingAction) return;
    setLoadingAction('ocr');
    setErrorMessage('');
    try {
      const formData = new FormData();
      for (let index = 0; index < images.length; index += 1) {
        const image = images[index];
        const manipulator = ImageManipulator.manipulate(image.uri);
        if (image.width > 1800) manipulator.resize({ width: 1800 });
        const compressed = await manipulator.renderAsync();
        const saved = await compressed.saveAsync({
          format: SaveFormat.JPEG,
          compress: 0.75,
        });
        formData.append('images', {
          uri: saved.uri,
          name: `job-screenshot-${index + 1}.jpg`,
          type: 'image/jpeg',
        } as unknown as Blob);
      }

      const response = await apiClient.upload<{ rawText: string }>(
        '/job-descriptions/images/extract',
        formData,
      );
      setExtractedText(response.rawText);
      setReviewReady(true);
    } catch (error) {
      setErrorMessage(readErrorMessage(error));
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
        source: 'image',
      });
      navigation.navigate('AddCv', {
        jobDescriptionId: savedJob.id,
        rawText: savedJob.rawText,
        source: 'image',
      });
    } catch (error) {
      setErrorMessage(readErrorMessage(error));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              onPress={() => navigation.navigate('AddJobPasteText', { sourceUrl: route?.params?.sourceUrl })}
            >
              <Text style={styles.segmentTabText}>Paste text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentTab, styles.segmentTabActive]}
              activeOpacity={0.9}
            >
              <Text style={styles.segmentTabTextActive}>Screenshot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.segmentTab}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AddJobLinkFallback', { sourceUrl: route?.params?.sourceUrl })}
            >
              <Text style={styles.segmentTabText}>Link</Text>
            </TouchableOpacity>
          </View>

          {/* Uploaded Files List */}
          <View style={styles.filesList}>
            {images.map((image) => (
              <View key={image.uri} style={styles.fileCard}>
                <View style={styles.fileIconBox}>
                  <Image source={{ uri: image.uri }} style={styles.thumbnail} />
                </View>

                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {image.fileName || `Screenshot ${images.indexOf(image) + 1}`}
                  </Text>
                  <Text style={styles.fileSize}>{readableSize(image.fileSize)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeImage(image.uri)}
                  accessibilityRole="button"
                  accessibilityLabel="Remove screenshot"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add Another Card */}
          {images.length < MAX_IMAGES ? (
            <TouchableOpacity
              style={styles.addAnotherCard}
              activeOpacity={0.8}
              onPress={handleAddImages}
              disabled={loadingAction !== null}
            >
              <Ionicons name="add-circle-outline" size={24} color="#0066FF" />
              <Text style={styles.addAnotherTitle}>
                {images.length ? 'Add another' : 'Choose screenshots'}
              </Text>
              <Text style={styles.addAnotherSubtitle}>
                Up to {MAX_IMAGES} images · JPG, PNG or WebP · 5 MB each
              </Text>
            </TouchableOpacity>
          ) : null}

          {reviewReady ? (
            <>
              <View style={styles.aiAlertBanner}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color="#D97706"
                  style={{ marginRight: 8, marginTop: 1 }}
                />
                <Text style={styles.aiAlertText}>
                  <Text style={styles.aiAlertBold}>Check what we read. </Text>
                  Review and correct the extracted text before saving it.
                </Text>
              </View>

              <View style={styles.jobTextSection}>
                <View style={styles.jobTextHeaderRow}>
                  <Text style={styles.jobTextTitle}>Job text we read</Text>
                  <Text style={styles.jobTextSublabel}>You can edit this</Text>
                </View>

                <View style={styles.jobTextCard}>
                  <TextInput
                    style={styles.jobTextInput}
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
                <Text style={styles.extractedCount}>
                  {characterCount} / {MAX_JOB_DESCRIPTION_LENGTH} characters · at least {MIN_JOB_DESCRIPTION_LENGTH} required
                </Text>
              </View>
            </>
          ) : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {!images.length ? (
            <Text style={styles.emptyHint}>
              {route?.params?.sourceUrl
                ? `Link tried: ${route.params.sourceUrl}\nChoose screenshots of the job post to continue.`
                : 'Choose screenshots of the job post to continue.'}
            </Text>
          ) : null}
        </ScrollView>

        {/* Bottom Sticky Action */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.9}
            onPress={reviewReady ? saveJobDescription : readScreenshots}
            disabled={
              loadingAction !== null ||
              (!reviewReady && images.length === 0) ||
              (reviewReady && characterCount < MIN_JOB_DESCRIPTION_LENGTH)
            }
          >
            {loadingAction ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.continueButtonText}>
                  {loadingAction === 'ocr' ? 'Reading screenshots...' : 'Saving...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.continueButtonText}>
                {reviewReady ? 'Save and continue' : 'Read text from screenshots'}
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
    marginBottom: 16,
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
  filesList: {
    gap: 8,
    marginBottom: 10,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  fileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  fileSize: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  addAnotherCard: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  addAnotherTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
  },
  addAnotherSubtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  aiAlertBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  aiAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  aiAlertBold: {
    fontWeight: '700',
  },
  jobTextSection: {
    marginBottom: 16,
  },
  jobTextHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTextTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  jobTextSublabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
  },
  jobTextCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
  },
  jobTextInput: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 19,
    minHeight: 100,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  continueButton: {
    backgroundColor: '#0066FF',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extractedCount: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 6,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginBottom: 12,
  },
  emptyHint: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 10,
  },
});
