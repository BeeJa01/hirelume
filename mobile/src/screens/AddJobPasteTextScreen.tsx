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
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AddJobPasteTextScreenProps = {
  navigation: any;
};

const DEFAULT_JOB_TEXT = `Greenfield Agro Ltd is hiring a Business Development Officer in Ibadan. You will find and win new business customers for our farm produce and packaging services.

Requirements: 2+ years in sales or business development. Experience writing proposals or quotes. Comfortable presenting to business owners. Familiarity with CRM tools (HubSpot or Zoho). Degree or HND in a business-related field.

Nice to have: knowledge of the agribusiness sector. Willingness to travel across the South-West.`;

export const AddJobPasteTextScreen = ({ navigation }: AddJobPasteTextScreenProps) => {
  const [jobText, setJobText] = useState(DEFAULT_JOB_TEXT);

  // Calculate word count
  const wordCount = jobText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
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
              style={[styles.segmentTab, styles.segmentTabActive]}
              activeOpacity={0.9}
            >
              <Text style={styles.segmentTabTextActive}>Paste text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.segmentTab}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AddJobScreenshot')}
            >
              <Text style={styles.segmentTabText}>Screenshot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.segmentTab}
              activeOpacity={0.7}
              onPress={() => {}}
            >
              <Text style={styles.segmentTabText}>Link</Text>
            </TouchableOpacity>
          </View>

          {/* Main Multiline Input */}
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              multiline
              value={jobText}
              onChangeText={setJobText}
              placeholder="Paste job description here..."
              placeholderTextColor="#94A3B8"
              textAlignVertical="top"
            />
          </View>

          {/* Word count & Tips */}
          <View style={styles.hintRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.hintPrimary}>
                Add the full job post for the best match.
              </Text>
              <Text style={styles.hintSecondary}>
                About 50 words or more works best.
              </Text>
            </View>
            <Text style={styles.wordCountText}>{wordCount} words</Text>
          </View>
        </ScrollView>

        {/* Bottom Sticky Action */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('AddJobScreenshot')}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    minHeight: 220,
    marginBottom: 10,
  },
  textInput: {
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 20,
    minHeight: 190,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  hintPrimary: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  hintSecondary: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 16,
  },
  wordCountText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
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
