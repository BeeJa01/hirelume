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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AddJobLinkFallbackScreenProps = {
  navigation: any;
};

export const AddJobLinkFallbackScreen = ({ navigation }: AddJobLinkFallbackScreenProps) => {
  const [jobUrl, setJobUrl] = useState('https://example.com/jobs/business-develo...');

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
              onPress={() => navigation.navigate('AddJobPasteText')}
            >
              <Text style={styles.segmentTabText}>Paste text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.segmentTab}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AddJobScreenshot')}
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
                onChangeText={setJobUrl}
                placeholder="https://..."
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <Text style={styles.inputHint}>We try to read the page for you.</Text>
          </View>

          {/* Fallback Warning Box */}
          <View style={styles.warningBox}>
            <Ionicons
              name="warning-outline"
              size={18}
              color="#D97706"
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <Text style={styles.warningText}>
              <Text style={styles.warningBold}>We could not read that page.</Text> Some sites block this. Paste the job text or upload a screenshot instead.
            </Text>
          </View>

          {/* Fallback Action Buttons */}
          <View style={styles.actionButtonsCol}>
            <TouchableOpacity
              style={styles.fallbackButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AddJobPasteText')}
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
              onPress={() => navigation.navigate('AddJobScreenshot')}
            >
              <Ionicons
                name="images-outline"
                size={18}
                color="#0F172A"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.fallbackButtonText}>Upload a screenshot instead</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Disabled Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueButtonDisabled}
            disabled={true}
          >
            <Text style={styles.continueButtonDisabledText}>Continue</Text>
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
  continueButtonDisabledText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
