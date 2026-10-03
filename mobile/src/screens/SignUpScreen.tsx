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

type SignUpScreenProps = {
  navigation: any;
};

export const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'recruiter' | 'candidate'>('recruiter');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const validate = () => {
    const newErrors: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }
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

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Alex can wire this up to backend /auth/register
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Account Created',
          `Welcome to Hirelume, ${name}!\nRegistered as: ${role}\n\nBackend authentication endpoint is ready to connect.`,
          [
            {
              text: 'Go to Sign In',
              onPress: () => navigation.navigate('SignIn'),
            },
          ]
        );
      }, 800);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Sign Up Failed', err?.message || 'Something went wrong');
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
        <Text style={styles.authHeaderTitle}>Create Account</Text>
        <Text style={styles.authHeaderSubtitle}>
          Join Hirelume for smart hiring
        </Text>
      </View>

      <View style={styles.authCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>I am a:</Text>
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                role === 'recruiter' && styles.roleOptionActive,
              ]}
              onPress={() => setRole('recruiter')}
            >
              <Text
                style={[
                  styles.roleText,
                  role === 'recruiter' && styles.roleTextActive,
                ]}
              >
                Recruiter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleOption,
                role === 'candidate' && styles.roleOptionActive,
              ]}
              onPress={() => setRole('candidate')}
            >
              <Text
                style={[
                  styles.roleText,
                  role === 'candidate' && styles.roleTextActive,
                ]}
              >
                Candidate
              </Text>
            </TouchableOpacity>
          </View>

          <SpecialInput
            label="Full Name"
            placeholder="e.g. Jane Doe"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            autoCapitalize="words"
            error={errors.name}
          />

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
            placeholder="Create a password (min 6 chars)"
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
            title="Create Account"
            variant="primary"
            loading={loading}
            onPress={handleSignUp}
            style={{ marginTop: 8 }}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.switchLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};
