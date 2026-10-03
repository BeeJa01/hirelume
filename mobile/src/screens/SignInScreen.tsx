import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { styles } from '@/style';
import { SpecialInput } from '@/components/SpecialInput';
import { SpecialButton } from '@/components/SpecialButton';
import { Ionicons } from '@expo/vector-icons';

type SignInScreenProps = {
  navigation: any;
};

export const SignInScreen = ({ navigation }: SignInScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Alex can wire this up to the backend /auth/login endpoint
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Sign In',
          `Welcome back!\nEmail: ${email}\n\nBackend authentication endpoint is ready to connect.`
        );
      }, 800);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Sign In Failed', err?.message || 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.authContainer}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.authHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.authHeaderTitle}>Welcome Back</Text>
        <Text style={styles.authHeaderSubtitle}>
          Sign in to your Hirelume account
        </Text>
      </View>

      <View style={styles.authCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SpecialInput
            label="Email Address"
            placeholder="name@company.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <SpecialInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            secureTextEntry={true}
            error={errors.password}
          />

          <SpecialButton
            title="Sign In"
            variant="primary"
            loading={loading}
            onPress={handleSignIn}
            style={{ marginTop: 8 }}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.switchLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};
