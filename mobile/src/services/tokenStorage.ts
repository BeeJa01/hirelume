import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

let secureStoreAvailable: boolean | null = null;

async function canUseSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (secureStoreAvailable !== null) return secureStoreAvailable;
  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureStoreAvailable = false;
  }
  return secureStoreAvailable;
}

export async function getAuthToken(key: string): Promise<string | null> {
  try {
    if (await canUseSecureStore()) {
      return await SecureStore.getItemAsync(key);
    }
  } catch {
    // Native SecureStore can throw on web or when the module is unavailable.
  }
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setAuthToken(key: string, value: string): Promise<void> {
  try {
    if (await canUseSecureStore()) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch {
    // Fall through to AsyncStorage.
  }
  await AsyncStorage.setItem(key, value);
}

export async function deleteAuthToken(key: string): Promise<void> {
  try {
    if (await canUseSecureStore()) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    // Ignore native storage failures on logout.
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Ignore fallback storage failures on logout.
  }
}
