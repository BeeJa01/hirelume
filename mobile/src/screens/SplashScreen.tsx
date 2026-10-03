import React from 'react';
import { View, Text, StatusBar, SafeAreaView } from 'react-native';
import { styles } from '@/style';
import { SpecialButton } from '@/components/SpecialButton';
import { Ionicons } from '@expo/vector-icons';

type SplashScreenProps = {
  navigation: any;
};

export const SplashScreen = ({ navigation }: SplashScreenProps) => {
  return (
    <SafeAreaView style={styles.splashContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.splash}>
        <View style={styles.logoContainer}>
          <Ionicons name="sparkles" size={44} color="#FFFFFF" />
        </View>

        <Text style={styles.text}>Hirelume</Text>
        <Text style={styles.tagline}>
          Streamlined Recruitment & Transparent Hiring
        </Text>

        <View style={styles.splashActions}>
          <SpecialButton
            title="Sign In"
            variant="primary"
            onPress={() => navigation.navigate('SignIn')}
          />
          <SpecialButton
            title="Create an Account"
            variant="secondary"
            onPress={() => navigation.navigate('SignUp')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};
