/**
 * Error codes for authentication and API errors
 * Format: ERR_[CATEGORY]_[SPECIFIC]
 */
export const ERROR_CODES = {
  // Beacon API errors
  BEACON_API_FAILED: 'ERR_BEACON_API_FAILED',
  BEACON_API_400: 'ERR_BEACON_API_400',
  BEACON_API_500: 'ERR_BEACON_API_500',
  BEACON_JSON_PARSE: 'ERR_BEACON_JSON_PARSE',
  BEACON_NOT_FOUND: 'ERR_BEACON_NOT_FOUND',
  BEACON_NO_ACTIVE_MEMBERSHIP: 'ERR_BEACON_NO_ACTIVE_MEMBERSHIP',
  BEACON_BUSINESS_DIRECTORY: 'ERR_BEACON_BUSINESS_DIRECTORY',
  
  // Superadmin check errors
  SUPERADMIN_CHECK_FAILED: 'ERR_SUPERADMIN_CHECK_FAILED',
  SUPERADMIN_JSON_PARSE: 'ERR_SUPERADMIN_JSON_PARSE',
  
  // Supabase errors
  SUPABASE_SIGNUP_FAILED: 'ERR_SUPABASE_SIGNUP_FAILED',
  SUPABASE_SIGNIN_FAILED: 'ERR_SUPABASE_SIGNIN_FAILED',
  SUPABASE_NO_USER: 'ERR_SUPABASE_NO_USER',
  SUPABASE_ACCOUNT_EXISTS: 'ERR_SUPABASE_ACCOUNT_EXISTS',
  SUPABASE_EMAIL_NOT_CONFIRMED: 'ERR_SUPABASE_EMAIL_NOT_CONFIRMED',
  
  // Network errors
  NETWORK_ERROR: 'ERR_NETWORK_ERROR',
  NETWORK_TIMEOUT: 'ERR_NETWORK_TIMEOUT',
  
  // Navigation errors
  ROUTER_NAVIGATION: 'ERR_ROUTER_NAVIGATION',
  
  // Generic errors
  UNKNOWN_ERROR: 'ERR_UNKNOWN_ERROR',
} as const;

/**
 * Hash email for privacy in logs
 */
function hashEmail(email: string): string {
  // Simple hash for logging - not cryptographically secure, just for privacy
  if (!email || typeof email !== 'string') return 'no_email';
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const charCode = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + charCode;
    hash = hash | 0; // Convert to 32bit integer
  }
  return `email_${Math.abs(hash).toString(16)}`;
}

/**
 * Format error message with error code prefix
 */
export function formatErrorMessage(errorCode: string, message: string): string {
  return `${message}\n\n[Error Code: ${errorCode}]`;
}

/**
 * Structured error logging for authentication flows
 */
export function logAuthError(context: {
  errorCode: string;
  step: string;
  error: unknown;
  email?: string;
  additionalData?: Record<string, any>;
}): void {
  const {
    errorCode,
    step,
    error,
    email,
    additionalData = {},
  } = context;

  const timestamp = new Date().toISOString();
  const hashedEmail = email ? hashEmail(email) : 'no_email';
  
  // Extract error details
  let errorDetails: any = {};
  if (error instanceof Error) {
    errorDetails = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  } else if (typeof error === 'object' && error !== null) {
    errorDetails = error;
  } else {
    errorDetails = { raw: String(error) };
  }

  // Log structured error
  console.error('[AUTH_ERROR]', {
    timestamp,
    errorCode,
    step,
    emailHash: hashedEmail,
    error: errorDetails,
    ...additionalData,
  });
}

/**
 * Safely parse JSON response with error handling
 */
export async function safeJsonParse<T>(
  response: Response,
  errorCode: string,
  step: string,
  email?: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const text = await response.text();
    try {
      const data = JSON.parse(text) as T;
      return { data, error: null };
    } catch (parseError) {
      logAuthError({
        errorCode,
        step: `${step}_json_parse`,
        error: parseError,
        email,
        additionalData: {
          httpStatus: response.status,
          httpStatusText: response.statusText,
          responsePreview: text.substring(0, 500), // First 500 chars
          contentType: response.headers.get('content-type'),
        },
      });
      return {
        data: null,
        error: formatErrorMessage(
          errorCode,
          'Failed to parse server response. Please try again or contact support.'
        ),
      };
    }
  } catch (textError) {
    logAuthError({
      errorCode,
      step: `${step}_read_response`,
      error: textError,
      email,
      additionalData: {
        httpStatus: response.status,
        httpStatusText: response.statusText,
      },
    });
    return {
      data: null,
      error: formatErrorMessage(
        errorCode,
        'Failed to read server response. Please try again or contact support.'
      ),
    };
  }
}

/**
 * Safely execute fetch with comprehensive error handling
 */
export async function safeFetch(
  url: string,
  options: RequestInit,
  errorCode: string,
  step: string,
  email?: string
): Promise<{ response: Response | null; error: string | null }> {
  try {
    const response = await fetch(url, options);
    return { response, error: null };
  } catch (fetchError) {
    // Determine error type
    let specificErrorCode = errorCode;
    let errorMessage = 'Network request failed. Please check your connection and try again.';
    
    if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
      specificErrorCode = ERROR_CODES.NETWORK_ERROR;
      errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else if (fetchError instanceof Error) {
      if (fetchError.message.includes('timeout') || fetchError.message.includes('aborted')) {
        specificErrorCode = ERROR_CODES.NETWORK_TIMEOUT;
        errorMessage = 'Request timed out. Please try again.';
      }
    }

    logAuthError({
      errorCode: specificErrorCode,
      step: `${step}_fetch`,
      error: fetchError,
      email,
      additionalData: {
        url,
        method: options.method || 'GET',
      },
    });

    return {
      response: null,
      error: formatErrorMessage(specificErrorCode, errorMessage),
    };
  }
}
