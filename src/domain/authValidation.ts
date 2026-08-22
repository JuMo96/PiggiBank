export const MINIMUM_PASSWORD_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInField = 'email' | 'password';
export type SignUpField = SignInField | 'confirmPassword';
export type ResetPasswordField = 'confirmPassword' | 'password';
export type DeleteAccountField = 'confirmation' | 'password';
export type AuthFieldErrors<Field extends string> = Partial<Record<Field, string>>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

export function validateSignInFields(
  email: string,
  password: string,
): AuthFieldErrors<SignInField> {
  const errors: AuthFieldErrors<SignInField> = {};

  if (!email.trim()) {
    errors.email = 'Enter your email address.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Enter your password.';
  }

  return errors;
}

export function validateSignUpFields(
  email: string,
  password: string,
  confirmPassword: string,
): AuthFieldErrors<SignUpField> {
  const errors: AuthFieldErrors<SignUpField> = validateSignInFields(email, password);

  if (password && password.length < MINIMUM_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export function validateResetPasswordFields(
  password: string,
  confirmPassword: string,
): AuthFieldErrors<ResetPasswordField> {
  const errors: AuthFieldErrors<ResetPasswordField> = {};

  if (!password) {
    errors.password = 'Enter a new password.';
  } else if (password.length < MINIMUM_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm your new password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export function validateDeleteAccountFields(
  password: string,
  confirmation: string,
): AuthFieldErrors<DeleteAccountField> {
  const errors: AuthFieldErrors<DeleteAccountField> = {};

  if (!password) errors.password = 'Enter your current password.';
  if (confirmation !== 'DELETE') {
    errors.confirmation = 'Type DELETE exactly to confirm.';
  }

  return errors;
}

export function hasAuthFieldErrors<Field extends string>(
  errors: AuthFieldErrors<Field>,
): boolean {
  return Object.keys(errors).length > 0;
}
