import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardTypeOptions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { styles } from '@/style';
import { Ionicons } from '@expo/vector-icons';

type SpecialInputProps = {
  label?: string;
  placeholder?: string;
  placeholderTextColor?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  helperText?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  containerStyle?: StyleProp<ViewStyle>;
  borderColor?: string;
};

export const SpecialInput = ({
  label,
  placeholder = 'type here...',
  placeholderTextColor = '#9CA3AF',
  value,
  onChangeText,
  secureTextEntry = false,
  helperText,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  containerStyle,
  borderColor,
}: SpecialInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={[styles.fieldGroup, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={{ position: 'relative', justifyContent: 'center' }}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            borderColor ? { borderColor } : null,
            isFocused && styles.inputFocused,
            error ? { borderColor: '#EF4444' } : null,
            secureTextEntry && { paddingRight: 40 },
          ]}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            style={{ position: 'absolute', right: 12, height: '100%', justifyContent: 'center' }}
            onPress={() => setIsSecure(!isSecure)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {helperText && !error ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      {error ? (
        <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};
