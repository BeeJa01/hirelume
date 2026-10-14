import React from 'react';
import { View, Image, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import { styles } from '@/style';
import { useAuth } from '@/contexts/AuthContext';

type SplashScreenProps = {
  navigation: any;
};

export const SplashScreen = ({ navigation }: SplashScreenProps) => {
  const { isLoading } = useAuth();

  // If loading, show splash logo
  // AuthContext in App.tsx will handle navigation based on auth state
  return (
    <SafeAreaView style={styles.splashContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          if (!isLoading) {
            navigation.replace('Welcome');
          }
        }}
        style={styles.splash}
      >
        <Image
          source={require('../../assets/logos/hirelume-logo.png')}
          style={styles.splashLogoImage}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
};
