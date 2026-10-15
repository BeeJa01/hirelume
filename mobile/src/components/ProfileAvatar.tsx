import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getApiUrl } from '@/constants/config';
import { apiClient } from '@/services/apiClient';
import type { User } from '@/types';

type ProfileAvatarProps = {
  user: User | null;
  size: number;
};

export function ProfileAvatar({ user, size }: ProfileAvatarProps) {
  const [imageSource, setImageSource] = useState<{ uri: string; headers: Record<string, string> } | null>(null);

  useEffect(() => {
    let mounted = true;
    setImageSource(null);

    if (!user?.avatar_url) return () => { mounted = false; };

    apiClient.getAccessToken().then((token) => {
      if (!mounted || !token) return;
      const apiOrigin = getApiUrl().replace(/\/api\/?$/, '');
      setImageSource({
        uri: `${apiOrigin}${user.avatar_url}`,
        headers: { Authorization: `Bearer ${token}` },
      });
    }).catch((error) => {
      console.error('Could not load profile image credentials:', error);
    });

    return () => { mounted = false; };
  }, [user?.avatar_url]);

  const initials = (user?.name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setImageSource(null)}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.max(16, size * 0.32) }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
});
