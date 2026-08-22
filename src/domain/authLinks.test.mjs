import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLikelyNetworkAuthError,
  parseAuthLink,
  rememberProcessedAuthLink,
} from './authLinks.ts';

test('parses confirmation and recovery PKCE links', () => {
  assert.deepEqual(parseAuthLink('piggi://auth/confirm?code=confirm-code&type=signup'), {
    code: 'confirm-code',
    fingerprint: 'confirmation:confirm-code',
    ok: true,
    purpose: 'confirmation',
  });
  assert.deepEqual(parseAuthLink('piggi://auth/reset-password?code=recovery-code&type=recovery'), {
    code: 'recovery-code',
    fingerprint: 'recovery:recovery-code',
    ok: true,
    purpose: 'recovery',
  });
});

test('reads callback errors and parameters from URL fragments', () => {
  assert.deepEqual(parseAuthLink('piggi://auth/confirm#error_code=otp_expired'), {
    ok: false,
    purpose: 'confirmation',
    reason: 'provider-error',
  });
  assert.deepEqual(parseAuthLink('piggi://auth/reset-password#code=recovery-code&type=recovery'), {
    code: 'recovery-code',
    fingerprint: 'recovery:recovery-code',
    ok: true,
    purpose: 'recovery',
  });
});

test('rejects malformed, unsupported, implicit-token, and wrong-purpose links', () => {
  assert.equal(parseAuthLink('not a URL').ok, false);
  assert.deepEqual(parseAuthLink('https://example.com/auth/confirm?code=x'), {
    ok: false,
    purpose: null,
    reason: 'unsupported-destination',
  });
  assert.deepEqual(parseAuthLink('piggi://auth/confirm#access_token=x&refresh_token=y'), {
    ok: false,
    purpose: 'confirmation',
    reason: 'wrong-flow',
  });
  assert.deepEqual(parseAuthLink('piggi://auth/confirm?code=x&type=recovery'), {
    ok: false,
    purpose: 'confirmation',
    reason: 'wrong-purpose',
  });
  assert.deepEqual(parseAuthLink('piggi://auth/reset-password?type=recovery'), {
    ok: false,
    purpose: 'recovery',
    reason: 'missing-code',
  });
});

test('classifies only connectivity-shaped failures as retryable network errors', () => {
  assert.equal(isLikelyNetworkAuthError(new Error('Network request failed')), true);
  assert.equal(isLikelyNetworkAuthError({ message: 'Connection timed out' }), true);
  assert.equal(isLikelyNetworkAuthError(new Error('PKCE code verifier not found')), false);
});

test('deduplicates callbacks and keeps a bounded fingerprint history', () => {
  const processed = new Set();
  assert.equal(rememberProcessedAuthLink(processed, 'first', 2), true);
  assert.equal(rememberProcessedAuthLink(processed, 'first', 2), false);
  assert.equal(rememberProcessedAuthLink(processed, 'second', 2), true);
  assert.equal(rememberProcessedAuthLink(processed, 'third', 2), true);
  assert.deepEqual([...processed], ['second', 'third']);
});
