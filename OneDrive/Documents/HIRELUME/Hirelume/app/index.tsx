import { styles } from '@/style';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, View } from 'react-native';

export default function HomeScreen() {
  const navigator = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigator.replace('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigator]);

  return (
    <View style={styles.splashContainer}>
      <Image
        style={styles.splash}
        source={require('../assets/images/splashscreen.jpeg')}
        resizeMode="cover"
      />
    </View>
  );
}
