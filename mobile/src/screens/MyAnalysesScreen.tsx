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

type MyAnalysesScreenProps = {
  navigation: any;
};

export const MyAnalysesScreen = ({ navigation }: MyAnalysesScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Strong' | 'Good' | 'Partial'>('All');

  const allAnalyses = [
    {
      id: '1',
      title: 'Business Development Officer',
      company: 'Greenfield Agro Ltd',
      score: 67,
      scoreLabel: 'Good',
      scoreColor: '#0066FF',
      scoreBg: '#EFF6FF',
      date: '1 Oct 2026',
    },
    {
      id: '2',
      title: 'Sales Manager Trainee',
      company: 'Brightpath Foods',
      score: 78,
      scoreLabel: 'Strong',
      scoreColor: '#16A34A',
      scoreBg: '#DCFCE7',
      date: '29 Sep 2026',
    },
    {
      id: '3',
      title: 'Customer Success Associate',
      company: 'Paylink Services',
      score: 52,
      scoreLabel: 'Partial',
      scoreColor: '#D97706',
      scoreBg: '#FEF3C7',
      date: '27 Sep 2026',
    },
  ];

  const filteredAnalyses = allAnalyses.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === 'All' || item.scoreLabel.toLowerCase() === selectedFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

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
            <Text style={styles.title}>My analyses</Text>
            <Text style={styles.subtitle}>Every job you have checked, newest first.</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarBox}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search analyses"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filter Pills */}
          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[styles.filterPill, selectedFilter === 'All' && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setSelectedFilter('All')}
            >
              <Text style={[styles.filterPillText, selectedFilter === 'All' && styles.filterPillTextActive]}>
                All 3
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, selectedFilter === 'Strong' && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setSelectedFilter('Strong')}
            >
              <Text style={[styles.filterPillText, selectedFilter === 'Strong' && styles.filterPillTextActive]}>
                Strong
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, selectedFilter === 'Good' && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setSelectedFilter('Good')}
            >
              <Text style={[styles.filterPillText, selectedFilter === 'Good' && styles.filterPillTextActive]}>
                Good
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, selectedFilter === 'Partial' && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setSelectedFilter('Partial')}
            >
              <Text style={[styles.filterPillText, selectedFilter === 'Partial' && styles.filterPillTextActive]}>
                Partial
              </Text>
            </TouchableOpacity>
          </View>

          {/* Analyses Cards List */}
          <View style={styles.analysesList}>
            {filteredAnalyses.map((item) => (
              <View key={item.id} style={styles.analysisCard}>
                <View style={styles.analysisCardTop}>
                  <View style={styles.jobInfoCol}>
                    <Text style={styles.analysisJobTitle}>{item.title}</Text>
                    <Text style={styles.analysisCompany}>{item.company}</Text>
                  </View>
                  <View style={styles.scoreCol}>
                    <Text style={[styles.scoreNumber, { color: item.scoreColor }]}>
                      {item.score}
                    </Text>
                    <View style={[styles.scoreBadge, { backgroundColor: item.scoreBg }]}>
                      <Text style={[styles.scoreBadgeText, { color: item.scoreColor }]}>
                        {item.scoreLabel}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.analysisCardBottom}>
                  <Text style={styles.analysisDate}>{item.date}</Text>
                  <TouchableOpacity
                    style={styles.viewResultBtn}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('AnalysisResult')}
                  >
                    <Text style={styles.viewResultText}>View result</Text>
                    <Ionicons name="chevron-forward" size={14} color="#0066FF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Bottom Card (from Screenshot 3): Found another job? */}
          <View style={styles.startNewCard}>
            <Text style={styles.startNewTitle}>Found another job?</Text>
            <Text style={styles.startNewSubtitle}>You have 3 of 5 analyses left today.</Text>
            <TouchableOpacity
              style={styles.startNewButton}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('AddJobPasteText')}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.startNewButtonText}>Start new analysis</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity
            style={styles.navTab}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="sparkles-outline" size={20} color="#94A3B8" />
            <Text style={styles.navTabLabel}>New</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navTab} activeOpacity={0.8}>
            <Ionicons name="document-text" size={20} color="#0066FF" />
            <Text style={[styles.navTabLabel, styles.navTabLabelActive]}>Analyses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navTab} activeOpacity={0.8}>
            <Ionicons name="briefcase-outline" size={20} color="#94A3B8" />
            <Text style={styles.navTabLabel}>Applications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navTab} activeOpacity={0.8}>
            <Ionicons name="person-outline" size={20} color="#94A3B8" />
            <Text style={styles.navTabLabel}>Account</Text>
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
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1E293B',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  analysesList: {
    marginBottom: 16,
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  analysisCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobInfoCol: {
    flex: 1,
    paddingRight: 12,
  },
  analysisJobTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  analysisCompany: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  scoreBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  analysisCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  viewResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewResultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066FF',
  },
  startNewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  startNewTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  startNewSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  startNewButton: {
    backgroundColor: '#0066FF',
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  startNewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    justifyContent: 'space-around',
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  navTabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 4,
  },
  navTabLabelActive: {
    color: '#0066FF',
    fontWeight: '700',
  },
});
