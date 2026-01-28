// Username validation constants
export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 15;

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validates a username and returns validation result
 */
export function validateUsername(username: string): ValidationResult {
  const trimmed = username.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: null }; // Empty is not an error, just not valid
  }

  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
    };
  }

  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Username must be ${USERNAME_MAX_LENGTH} characters or less`,
    };
  }

  return { isValid: true, error: null };
}
