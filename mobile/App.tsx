import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SplashScreen } from './src/screens/SplashScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { CreateAccountScreen } from './src/screens/CreateAccountScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddJobPasteTextScreen } from './src/screens/AddJobPasteTextScreen';
import { AddJobScreenshotScreen } from './src/screens/AddJobScreenshotScreen';
import { AddJobLinkFallbackScreen } from './src/screens/AddJobLinkFallbackScreen';
import { AddCvScreen } from './src/screens/AddCvScreen';
import { AnalysingScreen } from './src/screens/AnalysingScreen';
import { AnalysisResultScreen } from './src/screens/AnalysisResultScreen';
import { MyAnalysesScreen } from './src/screens/MyAnalysesScreen';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  CreateAccount: undefined;
  Login: undefined;
  Home: undefined;
  AddJobPasteText: undefined;
  AddJobScreenshot: undefined;
  AddJobLinkFallback: undefined;
  AddCv: undefined;
  Analysing: undefined;
  AnalysisResult: { initialTab?: 'overview' | 'requirements' | 'questions' } | undefined;
  MyAnalyses: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  // While loading, show splash
  if (isLoading) {
    return (
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  // If authenticated, show app screens starting from Home
  // If not authenticated, show auth screens
  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'Home' : 'Welcome'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddJobPasteText" component={AddJobPasteTextScreen} />
          <Stack.Screen name="AddJobScreenshot" component={AddJobScreenshotScreen} />
          <Stack.Screen name="AddJobLinkFallback" component={AddJobLinkFallbackScreen} />
          <Stack.Screen name="AddCv" component={AddCvScreen} />
          <Stack.Screen name="Analysing" component={AnalysingScreen} />
          <Stack.Screen name="AnalysisResult" component={AnalysisResultScreen} />
          <Stack.Screen name="MyAnalyses" component={MyAnalysesScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
