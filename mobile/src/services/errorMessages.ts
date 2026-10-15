/**
 * Maps backend error codes to user-friendly messages
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  ACCOUNT_ALREADY_EXISTS: 'An account with this email already exists',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  EMAIL_NOT_FOUND: 'No account was found for this email',
  WRONG_PASSWORD: 'The password is incorrect',
  INVALID_CREDENTIALS: 'Invalid email or password',
  NOT_AUTHENTICATED: 'You need to sign in to access this feature',
  UNAUTHORIZED: 'You need to sign in again',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again',
  USER_NOT_FOUND: 'Account not found',

  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again',
  INVALID_JSON: 'Invalid data format',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',

  // File errors
  CV_UNSUPPORTED_FORMAT: 'CV must be a PDF or DOCX file',
  CV_EMPTY: 'The CV file is empty',
  CV_INVALID_CONTENT: 'The CV file could not be read',
  CV_UNREADABLE: 'Could not extract text from the CV',
  CV_TOO_LARGE: 'CV file is too large (max 5MB)',
  CV_REQUIRED: 'Choose a CV file to continue',
  EMPTY_CV: 'No readable text was found in the CV',
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
  JOB_DESCRIPTION_TOO_SHORT: 'Job description is too short (min 50 characters)',
  JOB_LINK_UNREADABLE: 'Could not read the job page. Try pasting the text instead',
  INVALID_URL: 'Enter a valid public HTTP or HTTPS job-posting link',
  LINK_UNREACHABLE: 'The job page could not be reached. Check the link and try again',
  LINK_TIMEOUT: 'The job page took too long to respond. Try again or use another input method',
  LOGIN_REQUIRED: 'This job page requires sign-in. Paste the text or upload a screenshot instead',
  CONTENT_NOT_FOUND: 'No readable job description was found on that page',
  NOT_A_JOB_POSTING: 'That link does not appear to contain a job posting',
  FLOW2_ANALYSIS_NOT_FOUND: 'Analysis not found',
  FLOW2_ALREADY_CONFIRMED: 'Job description already confirmed',
  FLOW2_NOT_AWAITING_CV: 'Please confirm the job description first',
  FLOW2_NOT_RETRYABLE: 'This analysis cannot be retried',
  FLOW2_DAILY_LIMIT_REACHED: 'Daily analysis limit reached. Try again tomorrow',
  CV_NOT_FOUND: 'Upload a readable CV before running an analysis',
  JOB_DESCRIPTION_NOT_FOUND: 'Save a job description before running an analysis',
  ANALYSIS_NOT_FOUND: 'Analysis not found',
  ANALYSIS_INPUT_NOT_FOUND: 'The CV or job description could not be found',
  AI_NOT_CONFIGURED: 'AI analysis is not configured on the server',
  AI_TIMEOUT: 'AI analysis took too long. Please try again',
  AI_RATE_LIMITED: 'AI requests are temporarily rate limited. Please try again shortly',
  AI_INVALID_RESPONSE: 'The AI returned an invalid result. Please try again',
  AI_UNAVAILABLE: 'The AI service is unavailable. Please try again',

  // Application errors
  APPLICATION_NOT_FOUND: 'Application not found',
  DUPLICATE_APPLICATION: 'You have already applied to this job',
  CONSENT_REQUIRED: 'You must agree to the consent terms',
  CONSENT_VERSION_MISMATCH: 'Consent terms have changed. Please review and agree',
  APPLICATION_ALREADY_LINKED: 'Application already linked to your account',
  APPLICATION_EMAIL_MISMATCH: 'Application email does not match your account email',

  // General errors
  ROUTE_NOT_FOUND: 'Resource not found',
  INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again',
  SERVER_ERROR: 'Something went wrong. Please try again',
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
 * Normalizes this API's { detail } and { message } error responses for the UI.
 */
export function normalizeError(error: any): { success: false; error: { code: string; message: string; details?: any } } {
  // Network errors
  if (!error.response) {
    const isTimeout = error.code === 'ECONNABORTED';
    const extra = typeof error.message === 'string' && error.message && error.message !== 'Network Error'
      ? ` (${error.message})`
      : '';
    return {
      success: false,
      error: {
        code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: `${ERROR_MESSAGES[isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR']}${__DEV__ ? extra : ''}`,
      },
    };
  }

  // Backend errors
  const data = error.response.data;
  if (data?.success === false && data?.error?.code) {
    const code = data.error.code;
    return {
      success: false,
      error: {
        code,
        message: ERROR_MESSAGES[code] || data.error.message || 'Something went wrong',
        details: data.error.details,
      },
    };
  }
  const detail = data?.detail;
  const rawMessage = typeof detail === 'string' ? detail : data?.message;
  let code = 'INTERNAL_SERVER_ERROR';

  if (Array.isArray(detail)) {
    code = 'VALIDATION_ERROR';
  } else if (rawMessage === 'Account already exists') {
    code = 'ACCOUNT_ALREADY_EXISTS';
  } else if (rawMessage === 'Unable to sign in with those details') {
    code = 'INVALID_CREDENTIALS';
  } else if (rawMessage === 'Authentication required') {
    code = 'UNAUTHORIZED';
  } else if (rawMessage === 'Invalid or expired token') {
    code = 'TOKEN_EXPIRED';
  } else if (rawMessage === 'Invalid JSON body') {
    code = 'INVALID_JSON';
  } else if (rawMessage && ERROR_MESSAGES[rawMessage]) {
    code = rawMessage;
  }

  const message = ERROR_MESSAGES[code] || rawMessage || 'Something went wrong';

  return {
    success: false,
    error: {
      code,
      message,
      details: Array.isArray(detail) ? detail : data?.errors || undefined,
    },
  };
}

/**
 * Extracts field-specific validation errors from Zod error format
 */
export function getFieldErrors(details?: unknown): Record<string, string> {
  if (!details) return {};

  if (!Array.isArray(details) && typeof details === 'object') {
    const fieldErrors: Record<string, string> = {};
    Object.entries(details).forEach(([field, message]) => {
      if (typeof message === 'string') {
        fieldErrors[field === 'name' ? 'fullName' : field] = message;
      }
    });
    return fieldErrors;
  }
  if (!Array.isArray(details)) return {};

  const fieldErrors: Record<string, string> = {};
  details.forEach((err) => {
    if (err.loc && Array.isArray(err.loc) && err.loc.length > 0) {
      const field = err.loc[0] === 'name' ? 'fullName' : String(err.loc[0]);
      fieldErrors[field] = err.msg || 'Invalid value';
    }
  });

  return fieldErrors;
}
