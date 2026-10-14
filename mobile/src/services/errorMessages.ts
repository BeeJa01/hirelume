/**
 * Maps backend error codes to user-friendly messages
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  ACCOUNT_ALREADY_EXISTS: 'An account with this email already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  INVALID_REFRESH_TOKEN: 'Your session has expired. Please sign in again',
  NOT_AUTHENTICATED: 'You need to sign in to access this feature',
  USER_NOT_FOUND: 'Account not found',
  INVALID_ACCESS_TOKEN: 'Your session has expired. Please sign in again',

  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again',
  INVALID_JSON: 'Invalid data format',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',

  // File errors
  CV_REQUIRED: 'Please upload your CV',
  CV_UNSUPPORTED_FORMAT: 'CV must be a PDF or DOCX file',
  CV_EMPTY: 'The CV file is empty',
  CV_INVALID_CONTENT: 'The CV file could not be read',
  CV_UNREADABLE: 'Could not extract text from the CV',
  CV_TOO_LARGE: 'CV file is too large (max 5MB)',
  AVATAR_REQUIRED: 'Please select an image',
  AVATAR_UNSUPPORTED_FORMAT: 'Avatar must be PNG, JPEG, or WebP',
  AVATAR_EMPTY: 'The image file is empty',
  AVATAR_INVALID_CONTENT: 'The image file could not be read',
  AVATAR_TOO_LARGE: 'Image is too large (max 2MB)',
  AVATAR_NOT_FOUND: 'Avatar not found',
  SCREENSHOT_INVALID_CONTENT: 'Screenshot must be PNG, JPEG, or WebP',
  SCREENSHOT_TEXT_UNREADABLE: 'Could not read text from screenshots',
  SCREENSHOT_TOO_LARGE: 'Screenshot is too large',
  UNEXPECTED_FILE: 'Unexpected file type',

  // Job/Flow2 errors
  JOB_NOT_FOUND: 'Job not found',
  JOB_CLOSED: 'This job is no longer accepting applications',
  JOB_SOURCE_CONFLICT: 'Please provide only one: text, link, or screenshots',
  JOB_CONTEXT_REQUIRED: 'Please provide a job description',
  JOB_TEXT_TOO_SHORT: 'Job description is too short (min 50 characters)',
  JOB_LINK_UNREADABLE: 'Could not read the job page. Try pasting the text instead',
  FLOW2_ANALYSIS_NOT_FOUND: 'Analysis not found',
  FLOW2_ALREADY_CONFIRMED: 'Job description already confirmed',
  FLOW2_NOT_AWAITING_CV: 'Please confirm the job description first',
  FLOW2_NOT_RETRYABLE: 'This analysis cannot be retried',
  FLOW2_DAILY_LIMIT_REACHED: 'Daily analysis limit reached. Try again tomorrow',

  // Application errors
  APPLICATION_NOT_FOUND: 'Application not found',
  DUPLICATE_APPLICATION: 'You have already applied to this job',
  CONSENT_REQUIRED: 'You must agree to the consent terms',
  CONSENT_VERSION_MISMATCH: 'Consent terms have changed. Please review and agree',
  APPLICATION_ALREADY_LINKED: 'Application already linked to your account',
  APPLICATION_EMAIL_MISMATCH: 'Application email does not match your account email',
  CV_NOT_FOUND: 'CV file not found',

  // General errors
  ROUTE_NOT_FOUND: 'Resource not found',
  INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again',
  FORBIDDEN: 'You do not have permission to access this',
  ANONYMOUS_ID_REQUIRED: 'Anonymous ID required',
  EVENT_PROPERTIES_TOO_LARGE: 'Event data is too large',
  INVALID_RESULT_TOKEN: 'Invalid result token',
  JOB_REQUIREMENTS_LOCKED: 'Job requirements cannot be changed after applications',

  // Network errors (not from backend, but for mobile)
  NETWORK_ERROR: 'Network error. Please check your connection',
  TIMEOUT: 'Request timed out. Please try again',
};

/**
 * Normalizes backend error response to standard format
 * Backend returns: { detail: "CODE" } or { detail: "CODE", errors: [...] }
 * Mobile expects: { success: false, error: { code: "CODE", message: "..." } }
 */
export function normalizeError(error: any): { success: false; error: { code: string; message: string; details?: any } } {
  // Network errors
  if (!error.response) {
    return {
      success: false,
      error: {
        code: error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: ERROR_MESSAGES[error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR'],
      },
    };
  }

  // Backend errors
  const data = error.response.data;
  const code = data?.detail || 'INTERNAL_SERVER_ERROR';
  const message = ERROR_MESSAGES[code] || data?.detail || 'Something went wrong';

  return {
    success: false,
    error: {
      code,
      message,
      details: data?.errors || undefined,
    },
  };
}

/**
 * Extracts field-specific validation errors from Zod error format
 */
export function getFieldErrors(details?: any[]): Record<string, string> {
  if (!details || !Array.isArray(details)) return {};

  const fieldErrors: Record<string, string> = {};
  details.forEach((err) => {
    if (err.loc && Array.isArray(err.loc) && err.loc.length > 0) {
      const field = err.loc[0];
      fieldErrors[field] = err.msg || 'Invalid value';
    }
  });

  return fieldErrors;
}
