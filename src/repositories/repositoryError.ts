import { SupabaseConfigurationError } from '@/services/supabase';

export type RepositoryErrorCode =
  | 'create-failed'
  | 'delete-failed'
  | 'invalid-data'
  | 'load-failed'
  | 'not-authenticated'
  | 'not-configured'
  | 'offline'
  | 'update-failed';

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  readonly cause?: unknown;

  constructor(code: RepositoryErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
    this.cause = cause;
  }
}

export function assertRepositoryUser(userId: string) {
  if (!userId.trim()) {
    throw new RepositoryError(
      'not-authenticated',
      'Please sign in to access your Piggi data.',
    );
  }
}

export function normalizeRepositoryError(
  error: unknown,
  operation: 'create' | 'delete' | 'load' | 'update',
  subject: 'financial state' | 'Pig' | 'Pigs',
) {
  if (error instanceof RepositoryError) return error;

  if (error instanceof SupabaseConfigurationError) {
    return new RepositoryError(
      'not-configured',
      'Piggi cloud storage needs to be configured before you can continue.',
      error,
    );
  }

  if (looksLikeNetworkError(error)) {
    return new RepositoryError(
      'offline',
      `You're offline. Reconnect to ${getOfflineAction(operation, subject)}.`,
      error,
    );
  }

  const code = `${operation}-failed` as RepositoryErrorCode;
  return new RepositoryError(code, getFriendlyMessage(operation, subject), error);
}

export function getRepositoryErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Try again.',
) {
  return error instanceof RepositoryError ? error.message : fallback;
}

function looksLikeNetworkError(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String(error.message)
      : '';

  return /fetch|network|offline|connection|timeout/i.test(message);
}

function getOfflineAction(
  operation: 'create' | 'delete' | 'load' | 'update',
  subject: 'financial state' | 'Pig' | 'Pigs',
) {
  if (operation === 'load') return `load your ${subject}`;
  if (operation === 'delete') return `delete this ${subject}`;
  return `save your ${subject}`;
}

function getFriendlyMessage(
  operation: 'create' | 'delete' | 'load' | 'update',
  subject: 'financial state' | 'Pig' | 'Pigs',
) {
  if (operation === 'load') return `We couldn't load your ${subject}. Try again.`;
  if (operation === 'delete') return `We couldn't delete this ${subject}. Try again.`;
  if (operation === 'create') return `Your ${subject} couldn't be created. Try again.`;
  return `Your ${subject} couldn't be updated. Try again.`;
}
