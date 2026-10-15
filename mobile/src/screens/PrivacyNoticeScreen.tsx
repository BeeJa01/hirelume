import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PrivacyNoticeScreenProps = {
  navigation: any;
};

export const PrivacyNoticeScreen = ({ navigation }: PrivacyNoticeScreenProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Notice</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#0066FF" style={{ marginRight: 6 }} />
          <Text style={styles.badgeText}>How your data is used</Text>
        </View>

        <Text style={styles.mainTitle}>How Hirelume uses your data</Text>
        <Text style={styles.lastUpdated}>Product information</Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>1. CV and job description processing</Text>
          <Text style={styles.paragraph}>
            When you request an analysis, your CV text and the job description are sent from Hirelume's backend to its configured AI provider to generate your result. The backend attempts to remove detected email addresses, phone numbers, and street-address patterns from CV text first. Pattern matching may not find every personal detail.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>2. Account access</Text>
          <Text style={styles.paragraph}>
            Saved job descriptions, CV records, and analysis results are associated with your signed-in account. The app requests your account's records when you open the relevant screens.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>3. File storage</Text>
          <Text style={styles.paragraph}>
            Uploaded CV files are stored by the backend and are not returned as public file links. Do not upload information you do not want processed for your requested analysis.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>4. Data deletion requests</Text>
          <Text style={styles.paragraph}>
            The app does not currently delete your account data automatically. From Account settings you can open an email draft to request deletion; sending the email and completing the request require follow-up.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>5. Contact Our Data Protection Officer</Text>
          <Text style={styles.paragraph}>
            For questions regarding privacy, reach out to our Data Privacy team at <Text style={styles.linkText}>privacy@hirelume.com</Text>.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066FF',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  linkText: {
    color: '#0066FF',
    fontWeight: '600',
  },
});
