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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ApplicationsScreenProps = {
  navigation: any;
};

export const ApplicationsScreen = ({ navigation }: ApplicationsScreenProps) => {
  const [filter, setFilter] = useState<'All' | 'Shortlisted' | 'Applied'>('All');

  const applications = [
    {
      id: '1',
      title: 'Business Development Officer',
      company: 'Greenfield Agro Ltd',
      status: 'Shortlisted',
      statusColor: '#16A34A',
      statusBg: '#DCFCE7',
      matchScore: 67,
      appliedDate: '2 Oct 2026',
    },
    {
      id: '2',
      title: 'Sales Manager Trainee',
      company: 'Brightpath Foods',
      status: 'Applied',
      statusColor: '#0066FF',
      statusBg: '#EFF6FF',
      matchScore: 78,
      appliedDate: '30 Sep 2026',
    },
  ];

  const filtered = applications.filter((app) => {
    if (filter === 'All') return true;
    return app.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Applications</Text>
            <Text style={styles.subtitle}>Track your submitted job applications</Text>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[styles.filterPill, filter === 'All' && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setFilter('All')}
            >
              <Text style={[styles.filterPillText, filter === 'All' && styles.filterPillTextActive]}>
                All (2)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, filter === 'Shortlisted' && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setFilter('Shortlisted')}
            >
              <Text style={[styles.filterPillText, filter === 'Shortlisted' && styles.filterPillTextActive]}>
                Shortlisted
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, filter === 'Applied' && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setFilter('Applied')}
            >
              <Text style={[styles.filterPillText, filter === 'Applied' && styles.filterPillTextActive]}>
                Applied
              </Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          <View style={styles.list}>
            {filtered.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.jobCol}>
                    <Text style={styles.jobTitle}>{item.title}</Text>
                    <Text style={styles.company}>{item.company}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: item.statusBg }]}>
                    <Text style={[styles.statusText, { color: item.statusColor }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBottom}>
                  <Text style={styles.dateText}>Applied: {item.appliedDate}</Text>
                  <TouchableOpacity
                    style={styles.viewResultBtn}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('AnalysisResult')}
                  >
                    <Text style={styles.viewResultText}>View match report</Text>
                    <Ionicons name="chevron-forward" size={14} color="#0066FF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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

          <TouchableOpacity
            style={styles.navTab}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MyAnalyses')}
          >
            <Ionicons name="document-text-outline" size={20} color="#94A3B8" />
            <Text style={styles.navTabLabel}>Analyses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navTab} activeOpacity={0.8}>
            <Ionicons name="briefcase" size={20} color="#0066FF" />
            <Text style={[styles.navTabLabel, styles.navTabLabelActive]}>Applications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Account')}
          >
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
  container: {
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
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
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
  list: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobCol: {
    flex: 1,
    paddingRight: 12,
  },
  jobTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  company: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
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
