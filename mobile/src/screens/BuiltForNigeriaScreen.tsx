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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

type BuiltForNigeriaScreenProps = {
  navigation: any;
};

export const BuiltForNigeriaScreen = ({ navigation }: BuiltForNigeriaScreenProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#EFF6FF" />
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
          <Text style={styles.badgePillText}>Built for Nigeria</Text>
        </View>

        {/* Hero Title */}
        <Text style={styles.heroTitle}>Made for how Nigerians hire and apply</Text>

        {/* 4 Feature Cards */}
        <View style={styles.cardsContainer}>
          {/* Card 1: Phone first */}
          <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="phone-portrait-outline" size={22} color="#D97706" />
            </View>
            <Text style={styles.cardTitle}>Phone first</Text>
            <Text style={styles.cardDescription}>
              Every screen works on a phone. Most job seekers apply from one.
            </Text>
          </View>

          {/* Card 2: Link friendly */}
          <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="share-social-outline" size={22} color="#0066FF" />
            </View>
            <Text style={styles.cardTitle}>Link friendly</Text>
            <Text style={styles.cardDescription}>
              One link that works in WhatsApp groups, LinkedIn posts and more.
            </Text>
          </View>

          {/* Card 3: Local qualifications */}
          <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#16A34A" />
            </View>
            <Text style={styles.cardTitle}>Local qualifications</Text>
            <Text style={styles.cardDescription}>
              HND, OND, NCE, B.Sc. and NYSC are understood and never penalised.
            </Text>
          </View>

          {/* Card 4: Privacy by design */}
          <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#0066FF" />
            </View>
            <Text style={styles.cardTitle}>Privacy by design</Text>
            <Text style={styles.cardDescription}>
              Consent before you apply. We follow the Nigeria Data Protection Act 2023.
            </Text>
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.primaryButtonText}>Get started with HireLume</Text>
            <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EFF6FF',
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
    borderColor: '#DBEAFE',
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
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 14,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 20,
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#475569',
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
