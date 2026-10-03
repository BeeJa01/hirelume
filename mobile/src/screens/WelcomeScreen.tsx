import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { styles } from '@/style';
import { HireLumeLogo } from '@/components/HireLumeLogo';
import { SpecialButton } from '@/components/SpecialButton';

type WelcomeScreenProps = {
  navigation: any;
};

export const WelcomeScreen = ({ navigation }: WelcomeScreenProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={[styles.contentWrapper, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Top Header Logo */}
          <View style={{ paddingTop: 16, paddingBottom: 8 }}>
            <HireLumeLogo size="medium" />
          </View>

          {/* AI Job Match Demo Card */}
          <TouchableOpacity
            style={styles.welcomeCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Home')}
          >
            <View style={styles.welcomeCardHeader}>
              <View style={styles.scoreBadgeContainer}>
                <Text style={styles.scoreNumber}>67</Text>
                <Text style={styles.scoreCaption}>out of 100</Text>
              </View>

              <View style={styles.matchDetails}>
                <Text style={styles.matchCategory}>YOUR MATCH</Text>
                <Text style={styles.jobTitle}>Business Development Officer</Text>
                <Text style={styles.companyName}>Greenfield Agro Ltd</Text>
              </View>
            </View>

            {/* Skill / Requirement Tags */}
            <View style={styles.tagsRow}>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>Sales experience</Text>
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>Business degree</Text>
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>CRM tools</Text>
              </View>
            </View>

            {/* Card Prompt Line */}
            <View style={styles.cardInputPrompt}>
              <Text style={styles.cardPromptText}>
                Name a CRM tool you have used, or one you...
              </Text>
            </View>
          </TouchableOpacity>

          {/* Hero Typography */}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.heroHeading}>
              Know where you stand before you apply.
            </Text>
            <Text style={styles.heroDescription}>
              Add a job and your CV. Get a match score with the reason, your skill gaps,
              CV tips and interview questions.
            </Text>
          </View>
        </View>

        {/* Bottom CTA Buttons */}
        <View style={{ marginTop: 28 }}>
          <SpecialButton
            title="Get started"
            variant="primary"
            onPress={() => navigation.navigate('CreateAccount')}
          />
          <SpecialButton
            title="I already have an account"
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
          />
          <Text style={styles.disclaimerText}>
            Guidance, not a verdict. The AI can be wrong.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
