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

type InsideHirelumeScreenProps = {
  navigation: any;
};

export const InsideHirelumeScreen = ({ navigation }: InsideHirelumeScreenProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F7FF" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Badge */}
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>Inside Hirelume</Text>
        </View>

        {/* Hero Title & Subtitle */}
        <Text style={styles.heroTitle}>Every score comes with a reason</Text>
        <Text style={styles.heroSubtitle}>
          Recruiters see who fits best why. Jobseekers see exactly how they match.
        </Text>

        {/* Phone Mockup Frame */}
        <View style={styles.phoneMockupOuter}>
          <View style={styles.phoneMockupInner}>
            <Text style={styles.mockupTitle}>Check my fit</Text>

            {/* Mock input */}
            <View style={styles.mockupInput}>
              <Text style={styles.mockupInputText}>Paste a job or add a link</Text>
            </View>

            {/* List of matched roles */}
            <View style={styles.mockupCardsList}>
              {/* Role 1 */}
              <View style={styles.mockupCardItem}>
                <View style={styles.mockupRoleInfo}>
                  <Text style={styles.mockupRoleTitle}>Product Designer</Text>
                  <Text style={styles.mockupMatchLabel}>Strong match</Text>
                </View>
                <View style={[styles.mockupBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.mockupBadgeText, { color: '#15803D' }]}>Strong</Text>
                </View>
              </View>

              {/* Role 2 */}
              <View style={styles.mockupCardItem}>
                <View style={styles.mockupRoleInfo}>
                  <Text style={styles.mockupRoleTitle}>UX Researcher</Text>
                  <Text style={styles.mockupMatchLabel}>Partial match</Text>
                </View>
                <View style={[styles.mockupBadge, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={[styles.mockupBadgeText, { color: '#64748B' }]}>Partial</Text>
                </View>
              </View>

              {/* Role 3 */}
              <View style={styles.mockupCardItem}>
                <View style={styles.mockupRoleInfo}>
                  <Text style={styles.mockupRoleTitle}>Data Analyst</Text>
                  <Text style={styles.mockupMatchLabel}>Good match</Text>
                </View>
                <View style={[styles.mockupBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.mockupBadgeText, { color: '#D97706' }]}>Good</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Dark Reason Callout Box */}
        <View style={styles.darkReasonCard}>
          <Text style={styles.darkReasonTitle}>Why this score?</Text>
          <Text style={styles.darkReasonText}>
            Every score comes with a reason and evidence from the CV, so you can check it and decide for yourself.
          </Text>
        </View>

        {/* Action Button Row */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('HowItWorks')}
          >
            <Text style={styles.primaryButtonText}>Next: How it works</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0066FF',
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 14,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066FF',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 20,
  },
  phoneMockupOuter: {
    borderWidth: 4,
    borderColor: '#0F172A',
    borderRadius: 28,
    backgroundColor: '#0F172A',
    padding: 6,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  phoneMockupInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
  },
  mockupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  mockupInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  mockupInputText: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  mockupCardsList: {
    gap: 8,
  },
  mockupCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mockupRoleInfo: {
    flex: 1,
  },
  mockupRoleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  mockupMatchLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  mockupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mockupBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  darkReasonCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  darkReasonTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  darkReasonText: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
  },
  bottomActions: {
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#0066FF',
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
