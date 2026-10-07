import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AddCvScreenProps = {
  navigation: any;
};

export const AddCvScreen = ({ navigation }: AddCvScreenProps) => {
  const [cvName, setCvName] = useState('Tobi_Ogunleye_CV.pdf');
  const [cvSize, setCvSize] = useState('1.2 MB');

  const handleReplace = () => {
    Alert.alert('Upload CV', 'Choose a PDF, Word document, or image from your files.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Choose file',
        onPress: () => {
          setCvName('Tobi_Ogunleye_Updated_CV.pdf');
          setCvSize('1.4 MB');
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
              <Text style={styles.jobSummaryTitle}>Business Development Officer</Text>
              <Text style={styles.jobSummaryMeta}>Greenfield Agro Ltd · 112 words</Text>
            </View>
          </View>

          {/* Your CV Section */}
          <View style={styles.cvSection}>
            <Text style={styles.sectionHeaderTitle}>Your CV</Text>

            <View style={styles.cvCard}>
              <View style={styles.cvCardTop}>
                <View style={styles.cvIconBox}>
                  <Ionicons name="document-text-outline" size={22} color="#0066FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cvFileName}>{cvName}</Text>
                  <Text style={styles.cvFileMeta}>{cvSize} · Added just now</Text>
                  <View style={styles.readableBadge}>
                    <Ionicons name="checkmark" size={12} color="#16A34A" style={{ marginRight: 3 }} />
                    <Text style={styles.readableBadgeText}>Readable</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.replaceButton}
                activeOpacity={0.8}
                onPress={handleReplace}
              >
                <Text style={styles.replaceButtonText}>Replace</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cvFileTypesHint}>
              PDF, image or Word file. Up to 5 MB. In English.
            </Text>
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
              We send only your CV content and the job text to the AI. Your email, phone and address are never sent.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom CTA Area */}
        <View style={styles.bottomBar}>
          <View style={styles.limitRow}>
            <Ionicons name="time-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.limitText}>3 of 5 analyses left today</Text>
          </View>

          <TouchableOpacity
            style={styles.analyseButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Analysing')}
          >
            <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.analyseButtonText}>Analyse my fit</Text>
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
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitText: {
    fontSize: 12,
    color: '#64748B',
  },
  analyseButton: {
    backgroundColor: '#0066FF',
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
