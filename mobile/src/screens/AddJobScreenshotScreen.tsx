import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AddJobScreenshotScreenProps = {
  navigation: any;
};

type UploadedFile = {
  id: string;
  name: string;
  size: string;
};

const DEFAULT_EXTRACTED_TEXT = `Greenfield Agro Ltd is hiring a Business Development Officer in Ibadan. You will find and win new business customers for our farm produce and packaging services.

Requirements: 2+ years in sales or business development. Experience writing proposals or quotes. Comfortable presenting to business owners. Familiarity with CRM tools (HubSpot or Zoho). Degree or HND in a business-related field.`;

export const AddJobScreenshotScreen = ({ navigation }: AddJobScreenshotScreenProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([
    { id: '1', name: 'job-post-1.png', size: '340 KB' },
    { id: '2', name: 'job-post-2.png', size: '410 KB' },
  ]);

  const [extractedText, setExtractedText] = useState(DEFAULT_EXTRACTED_TEXT);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddAnother = () => {
    if (files.length >= 3) {
      Alert.alert('Limit Reached', 'You can upload up to 3 screenshots.');
      return;
    }
    const nextNum = files.length + 1;
    setFiles((prev) => [
      ...prev,
      { id: Date.now().toString(), name: `job-post-${nextNum}.png`, size: '385 KB' },
    ]);
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
              onPress={() => navigation.navigate('AddJobPasteText')}
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
              onPress={() => {}}
            >
              <Text style={styles.segmentTabText}>Link</Text>
            </TouchableOpacity>
          </View>

          {/* Uploaded Files List */}
          <View style={styles.filesList}>
            {files.map((file) => (
              <View key={file.id} style={styles.fileCard}>
                <View style={styles.fileIconBox}>
                  <Ionicons name="image-outline" size={20} color="#0066FF" />
                </View>

                <View style={styles.fileDetails}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <Text style={styles.fileSize}>{file.size}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeFile(file.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add Another Card */}
          <TouchableOpacity
            style={styles.addAnotherCard}
            activeOpacity={0.8}
            onPress={handleAddAnother}
          >
            <Ionicons name="add-circle-outline" size={24} color="#0066FF" />
            <Text style={styles.addAnotherTitle}>Add another</Text>
            <Text style={styles.addAnotherSubtitle}>
              Up to 3 images - JPG or PNG, up to 5 MB each.
            </Text>
          </TouchableOpacity>

          {/* AI Banner */}
          <View style={styles.aiAlertBanner}>
            <Ionicons
              name="warning-outline"
              size={18}
              color="#D97706"
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <Text style={styles.aiAlertText}>
              <Text style={styles.aiAlertBold}>Check what we read. </Text>
              We used AI to read your screenshots. Fix anything that looks wrong before you continue.
            </Text>
          </View>

          {/* Job text we read section */}
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
                onChangeText={setExtractedText}
                placeholder="Extracted job text..."
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Bottom Sticky Action */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.9}
            onPress={() => {
              Alert.alert(
                'Job Ready',
                'Job details captured successfully. Continuing to Step 2: Add your CV.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
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
});
