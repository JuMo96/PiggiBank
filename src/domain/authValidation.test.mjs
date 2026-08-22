import assert from 'node:assert/strict';
import test from 'node:test';

import {
  hasAuthFieldErrors,
  normalizeEmail,
  validateDeleteAccountFields,
  validateResetPasswordFields,
  validateSignInFields,
  validateSignUpFields,
} from './authValidation.ts';

test('normalizes email without changing passwords', () => {
  assert.equal(normalizeEmail('  SAVER@Example.COM  '), 'saver@example.com');
});

test('sign-in validation rejects missing and malformed values', () => {
  assert.deepEqual(validateSignInFields('', ''), {
    email: 'Enter your email address.',
    password: 'Enter your password.',
  });
  assert.equal(
    validateSignInFields('not-an-email', 'secret').email,
    'Please enter a valid email address.',
  );
});

test('sign-up validation enforces password length and confirmation', () => {
  assert.deepEqual(validateSignUpFields('saver@example.com', 'short', 'different'), {
    confirmPassword: 'Passwords do not match.',
    password: 'Use at least 6 characters.',
  });
});

test('valid auth forms return no field errors', () => {
  assert.equal(
    hasAuthFieldErrors(validateSignInFields('saver@example.com', 'secret')),
    false,
  );
  assert.equal(
    hasAuthFieldErrors(validateSignUpFields('saver@example.com', 'secret', 'secret')),
    false,
  );
});

test('reset-password validation requires a matching valid password', () => {
  assert.deepEqual(validateResetPasswordFields('', ''), {
    confirmPassword: 'Confirm your new password.',
    password: 'Enter a new password.',
  });
  assert.equal(validateResetPasswordFields('short', 'short').password, 'Use at least 6 characters.');
  assert.equal(
    validateResetPasswordFields('long-enough', 'different').confirmPassword,
    'Passwords do not match.',
  );
  assert.deepEqual(validateResetPasswordFields('long-enough', 'long-enough'), {});
});

test('account deletion validation requires password and exact confirmation phrase', () => {
  assert.deepEqual(validateDeleteAccountFields('', 'delete'), {
    confirmation: 'Type DELETE exactly to confirm.',
    password: 'Enter your current password.',
  });
  assert.deepEqual(validateDeleteAccountFields('current-password', 'DELETE'), {});
});
