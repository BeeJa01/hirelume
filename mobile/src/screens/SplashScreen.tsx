import React, { useEffect } from 'react';
import { View, Image, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import { styles } from '@/style';

type SplashScreenProps = {
  navigation: any;
};

export const SplashScreen = ({ navigation }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.splashContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => navigation.replace('Welcome')}
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
