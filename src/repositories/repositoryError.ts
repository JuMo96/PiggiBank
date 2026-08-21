import { SupabaseConfigurationError } from '@/services/supabase';

export type RepositoryErrorCode =
  | 'conflict'
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

  if (hasDatabaseErrorCode(error, '23505')) {
    return new RepositoryError(
      'conflict',
      operation === 'create' && subject === 'Pig'
        ? 'You already have an active Pig. Refresh to see it.'
        : `This ${subject} changed on another device. Refresh and try again.`,
      error,
    );
  }

  if (hasDatabaseErrorMessage(error, 'piggi_safe_to_spend_conflict')) {
    return new RepositoryError(
      'conflict',
      'Your Safe to Spend changed on another device. Refresh and choose a lower amount.',
      error,
    );
  }

  if (hasDatabaseErrorMessage(error, 'piggi_demo_balance_below_protected')) {
    return new RepositoryError(
      'conflict',
      'Your demo balance cannot be lower than your currently protected money.',
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

export function isRepositoryConflict(error: unknown): error is RepositoryError {
  return error instanceof RepositoryError && error.code === 'conflict';
}

function looksLikeNetworkError(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String(error.message)
      : '';

  return /fetch|network|offline|connection|timeout/i.test(message);
}

function hasDatabaseErrorCode(error: unknown, code: string) {
  return Boolean(
    error
    && typeof error === 'object'
    && 'code' in error
    && error.code === code,
  );
}

function hasDatabaseErrorMessage(error: unknown, expectedMessage: string) {
  return Boolean(
    error
    && typeof error === 'object'
    && 'message' in error
    && String(error.message).includes(expectedMessage),
  );
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
