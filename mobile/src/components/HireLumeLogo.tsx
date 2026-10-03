import React from 'react';
import { View, Image, Text, StyleSheet, ImageStyle, StyleProp, ViewStyle } from 'react-native';

type HireLumeLogoProps = {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const HireLumeLogo = ({
  size = 'medium',
  showText = true,
  style,
}: HireLumeLogoProps) => {
  if (!showText) {
    const iconDimensions = {
      small: { width: 32, height: 32 },
      medium: { width: 56, height: 56 },
      large: { width: 84, height: 84 },
    }[size];

    return (
      <View style={[styles.container, style]}>
        <Image
          source={require('../../assets/logos/hirelume-icon.png')}
          style={[iconDimensions as ImageStyle, { resizeMode: 'contain' }]}
        />
      </View>
    );
  }

  const logoDimensions = {
    small: { width: 120, height: 32 },
    medium: { width: 152, height: 40 },
    large: { width: 220, height: 58 },
  }[size];

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../assets/logos/hirelume-logo.png')}
        style={[logoDimensions as ImageStyle, { resizeMode: 'contain' }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});
