import React, { useState } from 'react';
import { styles } from '@/style';
import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  KeyboardTypeOptions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SpecialInputProps = {
  placeholder?: string;
  placeholderTextColor?: string;
  label?: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  borderColor?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
};

export const SpecialInput = ({
  placeholder = 'type here...',
  placeholderTextColor = '#94A3B8',
  label,
  secureTextEntry = false,
  value,
  onChangeText,
  borderColor,
  keyboardType = 'default',
  autoCapitalize = 'none',
  containerStyle,
  error,
}: SpecialInputProps) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.inputWrapper}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={isSecure}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            secureTextEntry && styles.inputWithIcon,
            borderColor ? { borderColor } : null,
            isFocused && { borderColor: '#4F46E5', backgroundColor: '#FFFFFF' },
            error ? { borderColor: '#EF4444' } : null,
          ]}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setIsSecure(!isSecure)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isSecure ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#64748B"
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 2 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};
