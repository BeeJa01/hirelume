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

type AnalysisResultScreenProps = {
  navigation: any;
  route?: {
    params?: {
      initialTab?: 'overview' | 'requirements' | 'questions';
    };
  };
};

export const AnalysisResultScreen = ({ navigation, route }: AnalysisResultScreenProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'questions'>(
    route?.params?.initialTab || 'overview'
  );
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);

  const handleFeedback = (type: 'helpful' | 'not-helpful') => {
    setFeedback(type);
    Alert.alert('Thank you!', 'Your feedback helps improve our analysis recommendations.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={{ flex: 1 }}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Home')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={20} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.helpButton}
              onPress={() =>
                Alert.alert(
                  'About Analysis',
                  'This score is based on matching your CV skills against required and nice-to-have job criteria.'
                )
              }
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="help-circle-outline" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.jobTitle}>Business Development Officer</Text>
          <Text style={styles.jobSubtitle}>
            Greenfield Agro Ltd · Analysed 1 Oct 2026
          </Text>

          {/* Segmented Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.tabButtonTextActive]}>
                Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'requirements' && styles.tabButtonActive]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('requirements')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'requirements' && styles.tabButtonTextActive]}>
                Requirements
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'questions' && styles.tabButtonActive]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('questions')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'questions' && styles.tabButtonTextActive]}>
                Questions
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Contents */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW (a10-result-overview) */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <View>
              {/* Disclaimer Banner */}
              <View style={styles.disclaimerBanner}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#0066FF"
                  style={{ marginRight: 8, marginTop: 1 }}
                />
                <Text style={styles.disclaimerText}>
                  <Text style={styles.disclaimerBold}>This is AI guidance and it can be wrong. </Text>
                  Use it to improve your CV and prepare. It is not a decision about you.
                </Text>
              </View>

              {/* Match Score Gauge Card */}
              <View style={styles.scoreGaugeCard}>
                <View style={styles.circularGauge}>
                  <Text style={styles.gaugeNumber}>67</Text>
                  <Text style={styles.gaugeSub}>out of 100</Text>
                </View>

                <View style={styles.matchBadgeRow}>
                  <Text style={styles.matchTitle}>Good match</Text>
                  <View style={styles.goodBadge}>
                    <Text style={styles.goodBadgeText}>Good</Text>
                  </View>
                </View>

                <Text style={styles.matchDescription}>
                  You meet three of the five Required skills fully and two partly. Your sales record and degree fit well. Proposal writing and CRM use are only partly shown, and the agribusiness sector is not mentioned in your CV.
                </Text>
              </View>

              {/* Matched & Missing Skills Card */}
              <View style={styles.cardBox}>
                <Text style={styles.skillsSectionTitle}>Matched skills</Text>
                <View style={styles.tagsWrapRow}>
                  <View style={styles.matchedTag}>
                    <Text style={styles.matchedTagText}>Sales experience</Text>
                  </View>
                  <View style={styles.matchedTag}>
                    <Text style={styles.matchedTagText}>Customer presentations</Text>
                  </View>
                  <View style={styles.matchedTag}>
                    <Text style={styles.matchedTagText}>Business degree</Text>
                  </View>
                </View>

                <Text style={[styles.skillsSectionTitle, { marginTop: 16 }]}>Missing skills</Text>
                <View style={styles.tagsWrapRow}>
                  <View style={styles.missingTag}>
                    <Text style={styles.missingTagText}>Agribusiness knowledge</Text>
                  </View>
                  <View style={styles.missingTag}>
                    <Text style={styles.missingTagText}>Willingness to travel</Text>
                  </View>
                </View>
              </View>

              {/* CV Tips for this Job */}
              <View style={styles.cardBox}>
                <Text style={styles.cardBoxTitle}>CV tips for this job</Text>

                <View style={styles.tipItem}>
                  <Ionicons name="bulb-outline" size={18} color="#D97706" style={styles.tipIcon} />
                  <Text style={styles.tipText}>Add one proposal you wrote, and the result.</Text>
                </View>

                <View style={styles.tipItem}>
                  <Ionicons name="bulb-outline" size={18} color="#D97706" style={styles.tipIcon} />
                  <Text style={styles.tipText}>Name a CRM tool you have used, or one you are learning.</Text>
                </View>

                <View style={styles.tipItem}>
                  <Ionicons name="bulb-outline" size={18} color="#D97706" style={styles.tipIcon} />
                  <Text style={styles.tipText}>If you can travel, say so in your summary.</Text>
                </View>
              </View>

              {/* Your Next Steps */}
              <View style={styles.cardBox}>
                <Text style={styles.cardBoxTitle}>Your next steps</Text>

                <View style={styles.stepItem}>
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepItemTitle}>Update your CV</Text>
                    <Text style={styles.stepItemSubtitle}>Use the tips above.</Text>
                  </View>
                </View>

                <View style={styles.stepItem}>
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepItemTitle}>Learn a basic CRM</Text>
                    <Text style={styles.stepItemSubtitle}>Many CRM tools have free plans.</Text>
                  </View>
                </View>

                <View style={styles.stepItem}>
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepItemTitle}>Prepare interview answers</Text>
                    <Text style={styles.stepItemSubtitle}>Start with the gap questions.</Text>
                  </View>
                </View>
              </View>

              {/* Was this result useful? */}
              <View style={styles.usefulSection}>
                <Text style={styles.usefulTitle}>Was this result useful?</Text>
                <View style={styles.usefulButtonsRow}>
                  <TouchableOpacity
                    style={[styles.usefulBtn, feedback === 'helpful' && styles.usefulBtnSelected]}
                    activeOpacity={0.8}
                    onPress={() => handleFeedback('helpful')}
                  >
                    <Text style={styles.usefulBtnText}>👍 Helpful</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.usefulBtn, feedback === 'not-helpful' && styles.usefulBtnSelected]}
                    activeOpacity={0.8}
                    onPress={() => handleFeedback('not-helpful')}
                  >
                    <Text style={styles.usefulBtnText}>👎 Not helpful</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.primaryActionButton}
                activeOpacity={0.9}
                onPress={() => setActiveTab('questions')}
              >
                <Text style={styles.primaryActionButtonText}>View interview questions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryLinkButton}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AddJobPasteText')}
              >
                <Text style={styles.secondaryLinkText}>Analyse another job</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: REQUIREMENTS (a11-result-requirements) */}
          {/* ========================================================================= */}
          {activeTab === 'requirements' && (
            <View>
              {/* Stat Counters Row */}
              <View style={styles.statsCountersRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: '#16A34A' }]}>3</Text>
                  <View style={[styles.statPill, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.statPillText, { color: '#16A34A' }]}>Met</Text>
                  </View>
                </View>

                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: '#D97706' }]}>2</Text>
                  <View style={[styles.statPill, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.statPillText, { color: '#D97706' }]}>Partly met</Text>
                  </View>
                </View>

                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: '#64748B' }]}>2</Text>
                  <View style={[styles.statPill, { backgroundColor: '#F1F5F9' }]}>
                    <Text style={[styles.statPillText, { color: '#64748B' }]}>Not found</Text>
                  </View>
                </View>
              </View>

              {/* Requirement Header */}
              <View style={{ marginTop: 20, marginBottom: 12 }}>
                <Text style={styles.reqSectionTitle}>Requirement by requirement</Text>
                <Text style={styles.reqSectionSubtitle}>Required skills count double in your score.</Text>
              </View>

              {/* Requirements Cards */}
              <View style={styles.reqList}>
                {/* 1 */}
                <View style={styles.reqCard}>
                  <Text style={styles.reqTitle}>2+ years in sales or business development</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badgeDark}>
                      <Text style={styles.badgeDarkText}>Required</Text>
                    </View>
                    <View style={styles.badgeGreen}>
                      <Ionicons name="checkmark" size={12} color="#16A34A" style={{ marginRight: 2 }} />
                      <Text style={styles.badgeGreenText}>Met</Text>
                    </View>
                  </View>
                  <Text style={styles.reqEvidence}>3 years as a Sales Representative</Text>
                </View>

                {/* 2 */}
                <View style={styles.reqCard}>
                  <Text style={styles.reqTitle}>Experience writing proposals or quotes</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badgeDark}>
                      <Text style={styles.badgeDarkText}>Required</Text>
                    </View>
                    <View style={styles.badgeAmber}>
                      <Text style={styles.badgeAmberText}>Partly met</Text>
                    </View>
                  </View>
                  <Text style={styles.reqEvidence}>
                    "Prepared price quotes for retail customers." No proposals mentioned.
                  </Text>
                </View>

                {/* 3 */}
                <View style={styles.reqCard}>
                  <Text style={styles.reqTitle}>Comfortable presenting to business owners</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badgeDark}>
                      <Text style={styles.badgeDarkText}>Required</Text>
                    </View>
                    <View style={styles.badgeGreen}>
                      <Ionicons name="checkmark" size={12} color="#16A34A" style={{ marginRight: 2 }} />
                      <Text style={styles.badgeGreenText}>Met</Text>
                    </View>
                  </View>
                  <Text style={styles.reqEvidence}>
                    Visited and pitched to 15 to 20 business customers a week.
                  </Text>
                </View>

                {/* 4 */}
                <View style={styles.reqCard}>
                  <Text style={styles.reqTitle}>Familiarity with CRM tools</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badgeDark}>
                      <Text style={styles.badgeDarkText}>Required</Text>
                    </View>
                    <View style={styles.badgeAmber}>
                      <Text style={styles.badgeAmberText}>Partly met</Text>
                    </View>
                  </View>
                  <Text style={styles.reqEvidence}>
                    Customer notes kept in a shared tracker. No CRM tool named.
                  </Text>
                </View>

                {/* 5 */}
                <View style={styles.reqCard}>
                  <Text style={styles.reqTitle}>Degree or HND in a business-related field</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badgeDark}>
                      <Text style={styles.badgeDarkText}>Required</Text>
                    </View>
                    <View style={styles.badgeGreen}>
                      <Ionicons name="checkmark" size={12} color="#16A34A" style={{ marginRight: 2 }} />
                      <Text style={styles.badgeGreenText}>Met</Text>
                    </View>
                  </View>
                  <Text style={styles.reqEvidence}>B.Sc. Business Administration, 2022</Text>
                </View>

                {/* 6 */}
                <View style={styles.reqCard}>
                  <Text style={styles.reqTitle}>Knowledge of the agribusiness sector</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badgeMuted}>
                      <Text style={styles.badgeMutedText}>Nice-to-have</Text>
                    </View>
                    <View style={styles.badgeMuted}>
                      <Text style={styles.badgeMutedText}>Not found</Text>
                    </View>
                  </View>
                  <Text style={styles.reqEvidence}>No agribusiness experience in the CV.</Text>
                </View>

                {/* 7 */}
                <View style={styles.reqCard}>
                  <Text style={styles.reqTitle}>Willingness to travel across the South-West</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badgeMuted}>
                      <Text style={styles.badgeMutedText}>Nice-to-have</Text>
                    </View>
                    <View style={styles.badgeMuted}>
                      <Text style={styles.badgeMutedText}>Not found</Text>
                    </View>
                  </View>
                  <Text style={styles.reqEvidence}>Not mentioned in the CV.</Text>
                </View>
              </View>

              {/* Bottom CTA */}
              <TouchableOpacity
                style={[styles.primaryActionButton, { marginTop: 20 }]}
                activeOpacity={0.9}
                onPress={() => setActiveTab('questions')}
              >
                <Text style={styles.primaryActionButtonText}>View interview questions</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: QUESTIONS (a12-result-interview-questions) */}
          {/* ========================================================================= */}
          {activeTab === 'questions' && (
            <View>
              {/* Pill Header Banner */}
              <View style={styles.questionsPillBanner}>
                <Ionicons name="help-buoy-outline" size={16} color="#0066FF" style={{ marginRight: 8 }} />
                <Text style={styles.questionsPillText}>
                  <Text style={styles.questionsPillBold}>9 questions </Text>based on this job and your CV
                </Text>
              </View>

              {/* Category 1: ABOUT THE ROLE */}
              <View style={styles.questionCategorySection}>
                <Text style={styles.categoryHeader}>ABOUT THE ROLE</Text>

                <View style={styles.questionCard}>
                  <View style={styles.questionNumberBox}>
                    <Text style={styles.questionNumberText}>1</Text>
                  </View>
                  <Text style={styles.questionText}>
                    Why do you want to work in business development for an agribusiness?
                  </Text>
                </View>

                <View style={styles.questionCard}>
                  <View style={styles.questionNumberBox}>
                    <Text style={styles.questionNumberText}>2</Text>
                  </View>
                  <Text style={styles.questionText}>
                    How would you find and approach new business customers in Ibadan?
                  </Text>
                </View>

                <View style={styles.questionCard}>
                  <View style={styles.questionNumberBox}>
                    <Text style={styles.questionNumberText}>3</Text>
                  </View>
                  <Text style={styles.questionText}>
                    What would you do in your first 30 days in this role?
                  </Text>
                </View>
              </View>

              {/* Category 2: YOUR EXPERIENCE */}
              <View style={styles.questionCategorySection}>
                <Text style={styles.categoryHeader}>YOUR EXPERIENCE</Text>

                <View style={styles.questionCard}>
                  <View style={styles.questionNumberBox}>
                    <Text style={styles.questionNumberText}>4</Text>
                  </View>
                  <Text style={styles.questionText}>
                    You visit 15 to 20 customers a week. How do you decide who to prioritise?
                  </Text>
                </View>

                <View style={styles.questionCard}>
                  <View style={styles.questionNumberBox}>
                    <Text style={styles.questionNumberText}>5</Text>
                  </View>
                  <Text style={styles.questionText}>
                    Tell us about a time you prepared a quote that won a customer.
                  </Text>
                </View>

                <View style={styles.questionCard}>
                  <View style={styles.questionNumberBox}>
                    <Text style={styles.questionNumberText}>6</Text>
                  </View>
                  <Text style={styles.questionText}>
                    Describe how you present your offer to a business owner who is not sure.
                  </Text>
                </View>
              </View>

              {/* Category 3: GAPS TO PREPARE FOR */}
              <View style={styles.questionCategorySection}>
                <Text style={styles.categoryHeader}>GAPS TO PREPARE FOR</Text>

                <View style={styles.questionCard}>
                  <View style={styles.questionNumberBox}>
                    <Text style={styles.questionNumberText}>7</Text>
                  </View>
                  <Text style={styles.questionText}>
                    You have not worked in agribusiness. What would you learn first, and how?
                  </Text>
                </View>

                <View style={styles.questionCard}>
                  <View style={styles.questionNumberBox}>
                    <Text style={styles.questionNumberText}>8</Text>
                  </View>
                  <Text style={styles.questionText}>
                    Which CRM tool would you want to use, and how would you get comfortable with it?
                  </Text>
                </View>

                <View style={styles.questionCard}>
                  <View style={styles.questionNumberBox}>
                    <Text style={styles.questionNumberText}>9</Text>
                  </View>
                  <Text style={styles.questionText}>
                    This role involves travel across the South-West. How would you plan your weeks?
                  </Text>
                </View>
              </View>

              {/* How to use these Card */}
              <View style={[styles.cardBox, { marginTop: 24 }]}>
                <Text style={styles.cardBoxTitle}>How to use these</Text>

                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#0066FF" style={styles.tipIcon} />
                  <Text style={styles.tipText}>Write short answers using real examples from your work.</Text>
                </View>

                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#0066FF" style={styles.tipIcon} />
                  <Text style={styles.tipText}>Use numbers where you can.</Text>
                </View>

                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#0066FF" style={styles.tipIcon} />
                  <Text style={styles.tipText}>Practise the gap questions out loud. They are the likeliest to come up.</Text>
                </View>
              </View>

              {/* Was this useful? */}
              <View style={styles.usefulSection}>
                <Text style={styles.usefulTitle}>Was this useful?</Text>
                <View style={styles.usefulButtonsRow}>
                  <TouchableOpacity
                    style={[styles.usefulBtn, feedback === 'helpful' && styles.usefulBtnSelected]}
                    activeOpacity={0.8}
                    onPress={() => handleFeedback('helpful')}
                  >
                    <Text style={styles.usefulBtnText}>👍 Helpful</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.usefulBtn, feedback === 'not-helpful' && styles.usefulBtnSelected]}
                    activeOpacity={0.8}
                    onPress={() => handleFeedback('not-helpful')}
                  >
                    <Text style={styles.usefulBtnText}>👎 Not helpful</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Analyse another job button */}
              <TouchableOpacity
                style={styles.outlineActionButton}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AddJobPasteText')}
              >
                <Text style={styles.outlineActionButtonText}>Analyse another job</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  },
  helpButton: {
    padding: 6,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  jobSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabButtonTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
  },
  disclaimerBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11.5,
    color: '#1E40AF',
    lineHeight: 16,
  },
  disclaimerBold: {
    fontWeight: '700',
  },
  scoreGaugeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  circularGauge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gaugeNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28,
  },
  gaugeSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  matchBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  matchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  goodBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  goodBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0066FF',
  },
  matchDescription: {
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  skillsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  tagsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  matchedTag: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  matchedTagText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  missingTag: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  missingTagText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#475569',
  },
  cardBoxTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumberCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0066FF',
  },
  stepItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  usefulSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  usefulTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  usefulButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  usefulBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  usefulBtnSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#EFF6FF',
  },
  usefulBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  primaryActionButton: {
    backgroundColor: '#0066FF',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryLinkButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLinkText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0066FF',
  },
  statsCountersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  statPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reqSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  reqSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  reqList: {
    gap: 10,
  },
  reqCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
  },
  reqTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  badgeDark: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeDarkText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgeGreen: {
    backgroundColor: '#DCFCE7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeGreenText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#16A34A',
  },
  badgeAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeAmberText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D97706',
  },
  badgeMuted: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeMutedText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  reqEvidence: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  questionsPillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  questionsPillText: {
    fontSize: 12.5,
    color: '#0F172A',
  },
  questionsPillBold: {
    fontWeight: '700',
  },
  questionCategorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  questionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  questionNumberBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  questionNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0066FF',
  },
  questionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
  },
  outlineActionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  outlineActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});
