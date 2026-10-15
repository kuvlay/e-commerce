// Basic email format validator for frontend forms
// This utility provides lightweight client-side validation of email syntax only.
// Domain verification, existence checks, homograph detection, and security-related
// validations are intentionally delegated to the backend (Gmail verification system).
// The frontend should only ensure the user-entered value is a plausibly-formed email
// to provide immediate UI feedback. All deeper checks occur server-side.

/**
 * Validate basic email format using a pragmatic RFC-like regex.
 * This function only checks syntax and length constraints.
 *
 * @param {string} email - Email string to validate.
 * @returns {Object} - { isValid: boolean, error: string | null }
 */
export const validateEmailFormat = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email must be a string' };
  }

  const trimmed = email.trim();

  // Accept empty trimmed value as invalid for this format-check function.
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  // Practical email regex for client-side validation (covers common valid cases).
  // This is intentionally permissive enough for UX but rejects obviously malformed inputs.
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // RFC-like length guard: local@domain total should not exceed 320 chars in practice.
  if (trimmed.length > 320) {
    return { isValid: false, error: 'Email address too long' };
  }

  return { isValid: true, error: null };
};

/**
 * Lightweight validateEmail function for form submission flows.
 * This only performs basic presence and format checks and returns a simple result
 * object that the UI logic can consume. All domain-level and security checks are
 * handled by the backend verification middleware.
 *
 * @param {string} email - Email input from the user.
 * @returns {Object} - { isValid, message, type, suggestions }
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return {
      isValid: false,
      message: 'Email is required',
      type: 'required',
      suggestions: []
    };
  }

  const trimmed = email.trim();

  const formatResult = validateEmailFormat(trimmed);
  if (!formatResult.isValid) {
    return {
      isValid: false,
      message: formatResult.error || 'Invalid email format',
      type: 'format',
      suggestions: []
    };
  }

  // At this point the email is syntactically valid. Let the backend perform
  // domain verification, existence checks, and security analyses.
  return {
    isValid: true,
    message: 'Valid email format',
    type: 'valid',
    suggestions: []
  };
};

/**
 * Real-time validation helper intended for UI feedback while typing.
 * Returns a compact object suitable for form components.
 *
 * Note: Empty input returns no error state so that UX can avoid showing
 * premature validation messages. The backend will perform full verification
 * on submission.
 *
 * @param {string} email
 * @returns {Object} - { isValid, message, type, suggestions, showError }
 */
export const validateEmailRealTime = (email) => {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return { isValid: true, message: '', type: 'empty', suggestions: [], showError: false };
  }

  const result = validateEmail(email);

  return {
    isValid: result.isValid,
    message: result.isValid ? '' : result.message,
    type: result.type,
    suggestions: result.suggestions || [],
    // showError is true when invalid and not a suggestion-style result (frontend does not provide suggestions here)
    showError: !result.isValid
  };
};