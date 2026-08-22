import assert from 'node:assert/strict';
import test from 'node:test';

import { getAuthFailureCode, getFriendlyAuthError } from './authErrors.ts';

test('maps known authentication errors to friendly messages and stable codes', () => {
  const unconfirmed = { code: 'email_not_confirmed', message: 'raw provider detail' };
  assert.equal(getAuthFailureCode(unconfirmed), 'email-not-confirmed');
  assert.equal(getFriendlyAuthError(unconfirmed, 'signIn'), 'Confirm your email before signing in.');

  const rateLimit = { code: 'over_email_send_rate_limit', message: 'raw detail' };
  assert.equal(getAuthFailureCode(rateLimit), 'rate-limited');
  assert.match(getFriendlyAuthError(rateLimit, 'requestPasswordReset'), /Too many attempts/);
});

test('does not expose unknown provider messages', () => {
  const privateDetail = { code: 'unexpected', message: 'internal service stack trace' };
  assert.equal(
    getFriendlyAuthError(privateDetail, 'updatePassword'),
    'We could not update your password. Please try again.',
  );
});
