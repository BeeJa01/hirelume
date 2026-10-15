import React from 'react';
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type HelpContactScreenProps = {
  navigation: any;
};

export const HelpContactScreen = ({ navigation }: HelpContactScreenProps) => {
  const faqs = [
    {
      q: 'How does Hirelume score my CV?',
      a: 'The analysis compares evidence in your CV with the job description and returns a score, breakdown, strengths, gaps, and suggestions.',
    },
    {
      q: 'What does "Met, partly met, and not found" mean?',
      a: 'The analysis describes how closely the evidence in your CV matches the job requirements. Review the listed evidence and gaps rather than treating the score as a hiring decision.',
    },
    {
      q: 'Does Hirelume submit job applications?',
      a: 'No. Hirelume compares your CV with a job and helps you prepare. You apply directly through the employer or job-board website.',
    },
  ];

  const openSupportEmail = async () => {
    try {
      await Linking.openURL('mailto:support@hirelume.com');
    } catch {
      Alert.alert('Could not open email', 'Set up an email app on your device, or contact support@hirelume.com directly.');
    }
  };

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>We're here to help</Text>
        <Text style={styles.subtitle}>Get quick answers or reach out to our team directly.</Text>

        {/* Support contact */}
        <View style={styles.channelsContainer}>
          <TouchableOpacity
            style={styles.channelCard}
            activeOpacity={0.8}
            onPress={() => void openSupportEmail()}
          >
            <View style={[styles.channelIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="mail-outline" size={22} color="#0066FF" />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelTitle}>Email Support</Text>
              <Text style={styles.channelDesc}>support@hirelume.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Frequently Asked Questions */}
        <Text style={styles.faqHeading}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {faqs.map((faq, idx) => (
            <View key={idx} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </View>
          ))}
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
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
  },
  channelsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
  },
  channelIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelInfo: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  channelDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  faqHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
  },
  faqQuestion: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
});
