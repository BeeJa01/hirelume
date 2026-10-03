import { Platform } from 'react-native';

// Default base URL depending on platform
// Android emulator uses 10.0.2.2 to access host machine localhost
// iOS simulator & Web can use localhost:8000
export const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api',
  ios: 'http://localhost:8000/api',
  default: 'http://localhost:8000/api',
});

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
