export type AuthFailureCode =
  | 'email-not-confirmed'
  | 'invalid-credentials'
  | 'not-configured'
  | 'offline'
  | 'rate-limited'
  | 'unknown';

export type AuthOperation =
  | 'requestPasswordReset'
  | 'resendConfirmation'
  | 'signIn'
  | 'signOut'
  | 'signUp'
  | 'updatePassword';

type AuthErrorDetails = {
  code?: string;
  message: string;
};

export function getAuthFailureCode(error: AuthErrorDetails): AuthFailureCode {
  const errorCode = error.code ?? '';
  const normalizedMessage = error.message.toLowerCase();

  if (errorCode === 'email_not_confirmed') return 'email-not-confirmed';
  if (errorCode === 'invalid_credentials' || normalizedMessage.includes('invalid login credentials')) {
    return 'invalid-credentials';
  }
  if (errorCode.includes('rate_limit') || normalizedMessage.includes('rate limit')) {
    return 'rate-limited';
  }
  if (/fetch|network|offline|connection|timeout/i.test(normalizedMessage)) return 'offline';
  return 'unknown';
}

export function getFriendlyAuthError(
  error: AuthErrorDetails,
  operation: AuthOperation,
): string {
  const errorCode = error.code ?? '';
  const normalizedMessage = error.message.toLowerCase();

  if (errorCode === 'invalid_credentials' || normalizedMessage.includes('invalid login credentials')) {
    return 'Email or password is incorrect.';
  }
  if (errorCode === 'email_not_confirmed') return 'Confirm your email before signing in.';
  if (errorCode === 'email_address_invalid' || normalizedMessage.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  if (
    errorCode === 'weak_password'
    || normalizedMessage.includes('password should be')
    || normalizedMessage.includes('password must be')
  ) return 'Your password is too short or too easy to guess.';
  if (
    errorCode === 'user_already_exists'
    || normalizedMessage.includes('already registered')
    || normalizedMessage.includes('already exists')
  ) return 'An account already exists with this email.';
  if (errorCode.includes('rate_limit') || normalizedMessage.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (errorCode === 'signup_disabled') return 'Account creation is not available right now.';

  const fallbackByOperation: Record<AuthOperation, string> = {
    requestPasswordReset: 'We could not send a password reset link. Please try again.',
    resendConfirmation: 'We could not resend the confirmation email. Please try again.',
    signIn: 'Something went wrong while signing in. Please try again.',
    signOut: 'Something went wrong while signing out. Please try again.',
    signUp: 'Something went wrong while creating your account. Please try again.',
    updatePassword: 'We could not update your password. Please try again.',
  };
  return fallbackByOperation[operation];
}
