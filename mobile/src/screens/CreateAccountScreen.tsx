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

type CreateAccountScreenProps = {
  navigation: any;
};

export const CreateAccountScreen = ({ navigation }: CreateAccountScreenProps) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    privacy?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      fullName?: string;
      email?: string;
      password?: string;
      privacy?: string;
    } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!agreePrivacy) {
      newErrors.privacy = 'You must agree to the privacy notice';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Home');
    }, 250);
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Check how well you fit any job. It takes under a minute.
            </Text>

            {/* Role Badge */}
            <View style={styles.rolePillBadge}>
              <Text style={styles.rolePillText}>Signing up as a job seeker</Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <SpecialInput
                label="Full name"
                placeholder="Tobi Ogunleye"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName)
                    setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                autoCapitalize="words"
                error={errors.fullName}
              />

              <SpecialInput
                label="Email"
                placeholder="tobi.ogunleye@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
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
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                secureTextEntry={true}
                helperText="At least 8 characters."
                error={errors.password}
              />

              {/* Privacy Notice Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                activeOpacity={0.8}
                onPress={() => setAgreePrivacy(!agreePrivacy)}
              >
                <View
                  style={[
                    styles.checkbox,
                    agreePrivacy && styles.checkboxActive,
                  ]}
                >
                  {agreePrivacy ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : null}
                </View>

                <Text style={styles.checkboxLabel}>
                  I agree to the{' '}
                  <Text style={styles.linkHighlight}>privacy notice</Text>. My CV
                  and job text are sent to an AI service to produce my result.
                </Text>
              </TouchableOpacity>

              {errors.privacy ? (
                <Text
                  style={{
                    color: '#EF4444',
                    fontSize: 12,
                    marginTop: -12,
                    marginBottom: 12,
                  }}
                >
                  {errors.privacy}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={{ marginTop: 24 }}>
            <SpecialButton
              title="Create account"
              variant="primary"
              loading={loading}
              onPress={handleCreateAccount}
            />

            <View style={styles.footerSwitchRow}>
              <Text style={styles.footerSwitchText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerSwitchLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
