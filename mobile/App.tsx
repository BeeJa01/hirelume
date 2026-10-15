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
import { ApplicationsScreen } from './src/screens/ApplicationsScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { PrivacyNoticeScreen } from './src/screens/PrivacyNoticeScreen';
import { InsideHirelumeScreen } from './src/screens/InsideHirelumeScreen';
import { HelpContactScreen } from './src/screens/HelpContactScreen';
import { HowItWorksScreen } from './src/screens/HowItWorksScreen';
import { BuiltForNigeriaScreen } from './src/screens/BuiltForNigeriaScreen';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  CreateAccount: undefined;
  Login: undefined;
  Home: undefined;
  AddJobPasteText: { sourceUrl?: string } | undefined;
  AddJobScreenshot: { sourceUrl?: string } | undefined;
  AddJobLinkFallback: { sourceUrl?: string } | undefined;
  AddCv: { jobDescriptionId: string; rawText: string; source?: 'text' | 'image' | 'link' } | undefined;
  Analysing: { cvId: string; jobDescriptionId: string };
  AnalysisResult: {
    analysisId: string;
    initialTab?: 'overview' | 'requirements' | 'questions';
    questionsError?: string;
  };
  MyAnalyses: undefined;
  Applications: undefined;
  Account: undefined;
  PrivacyNotice: undefined;
  InsideHirelume: undefined;
  HelpContact: undefined;
  HowItWorks: undefined;
  BuiltForNigeria: undefined;
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
          <Stack.Screen name="Applications" component={ApplicationsScreen} />
          <Stack.Screen name="Account" component={AccountScreen} />
          <Stack.Screen name="PrivacyNotice" component={PrivacyNoticeScreen} />
          <Stack.Screen name="InsideHirelume" component={InsideHirelumeScreen} />
          <Stack.Screen name="HelpContact" component={HelpContactScreen} />
          <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
          <Stack.Screen name="BuiltForNigeria" component={BuiltForNigeriaScreen} />
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
