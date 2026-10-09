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
          <Ionicons name="shield-checkmark" size={16} color="#0066FF" style={{ marginRight: 6 }} />
          <Text style={styles.badgeText}>NDPA 2023 Compliant</Text>
        </View>

        <Text style={styles.mainTitle}>How HireLume Protects & Uses Your Data</Text>
        <Text style={styles.lastUpdated}>Last updated: October 2026</Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>1. Purpose-Bound CV Processing</Text>
          <Text style={styles.paragraph}>
            When you upload your CV or paste job text, our AI algorithms evaluate your qualifications exclusively against the specific job description provided. We do not use your resume to train public AI models.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>2. Local Qualification Fairness</Text>
          <Text style={styles.paragraph}>
            HireLume is engineered specifically for Nigerian jobseekers. Academic credentials including OND, HND, NCE, B.Sc., B.Tech, and NYSC discharge/exemption certificates are recognized natively and never penalized.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>3. Storage & Encryption</Text>
          <Text style={styles.paragraph}>
            All documents and analysis reports are encrypted both in transit (TLS 1.3) and at rest (AES-256). Your personal details are never shared with recruiters until you explicitly choose to apply.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>4. Right to Erasure (Data Deletion)</Text>
          <Text style={styles.paragraph}>
            Under the Nigeria Data Protection Act (NDPA 2023), you hold complete ownership of your data. You may request total erasure of your CVs, scores, and account history at any time from your Account settings.
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
