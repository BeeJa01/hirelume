import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { styles } from '@/style';
import { SpecialInput } from '@/components/SpecialInput';
import { SpecialButton } from '@/components/SpecialButton';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getFieldErrors } from '@/services/errorMessages';

type LoginScreenProps = {
  navigation: any;
};

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
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
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setFormError('');
    try {
      await login({ email, password });
      // Navigation is handled by AuthContext
    } catch (err: any) {
      setLoading(false);
      const apiError = err;
      if (apiError?.error?.details) {
        const fieldErrors = getFieldErrors(apiError.error.details);
        setErrors(fieldErrors);
      } else if (apiError?.error?.code === 'EMAIL_NOT_FOUND') {
        setErrors({ email: apiError.error.message });
      } else if (apiError?.error?.code === 'WRONG_PASSWORD') {
        setErrors({ password: apiError.error.message });
      } else {
        setFormError(apiError?.error?.message || 'Something went wrong. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.contentWrapper, { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            {/* Header with Back Arrow */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>Welcome back.</Text>
            <Text style={styles.subtitle}>
              Your analyses are saved and waiting.
            </Text>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <SpecialInput
                label="Email"
                placeholder="tobi.ogunleye@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setFormError('');
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <SpecialInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setFormError('');
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                secureTextEntry={true}
                error={errors.password}
              />
              {formError ? (
                <Text accessibilityRole="alert" style={{ color: '#DC2626', fontSize: 13, marginTop: 8 }}>
                  {formError}
                </Text>
              ) : null}

              {/* Forgot Password Link */}
              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={() =>
                  Alert.alert(
                    'Reset Password',
                    'A password reset link will be sent to your registered email address.'
                  )
                }
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={{ marginTop: 32 }}>
            <SpecialButton
              title="Log in"
              variant="primary"
              loading={loading}
              onPress={handleLogin}
            />

            <View style={styles.footerSwitchRow}>
              <Text style={styles.footerSwitchText}>New to Hirelume?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateAccount')}
              >
                <Text style={styles.footerSwitchLink}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
