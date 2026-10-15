import { NativeModules, Platform } from 'react-native';

const API_PORT = 5000;

function isTunnelHost(hostname: string) {
  return (
    hostname.endsWith('.exp.direct') ||
    hostname.endsWith('.exp.host') ||
    hostname.includes('ngrok') ||
    hostname.endsWith('.expo.dev')
  );
}

function hostnameFromUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const withScheme = value.includes('://') ? value : `http://${value}`;
    const { hostname } = new URL(withScheme);
    return hostname || null;
  } catch {
    return value.split('://').pop()?.split(':')[0] || null;
  }
}

function metroHostname(): string | null {
  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
  const fromMetro = hostnameFromUrl(scriptURL);
  if (fromMetro && !isTunnelHost(fromMetro)) return fromMetro;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname;
  }

  return null;
}

export const DEFAULT_API_URL = Platform.select({
  android: `http://10.0.2.2:${API_PORT}/api`,
  ios: `http://localhost:${API_PORT}/api`,
  default: `http://localhost:${API_PORT}/api`,
});

export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const host = metroHostname();
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${API_PORT}/api`;
  }

  return DEFAULT_API_URL;
}

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@hirelume_auth_token',
  USER_DATA: '@hirelume_user_data',
  API_URL: '@hirelume_api_url',
  THEME_MODE: '@hirelume_theme_mode',
};

export const APP_CONFIG = {
  APP_NAME: 'Hirelume',
  APP_VERSION: '1.0.0',
  CONSENT_VERSION: 'v1.0-2026',
  MAX_CV_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  ALLOWED_CV_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};
