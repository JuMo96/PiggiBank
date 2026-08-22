import assert from 'node:assert/strict';
import test from 'node:test';

import { getAuthRouteAccess } from './authRouting.ts';

test('recovery context blocks normal app and auth routes even with a session', () => {
  assert.deepEqual(getAuthRouteAccess(false, true, true), {
    canAccessAppRoutes: false,
    canAccessAuthRoutes: false,
  });
});

test('signed-in and signed-out users receive only their normal route group', () => {
  assert.deepEqual(getAuthRouteAccess(false, true, false), {
    canAccessAppRoutes: true,
    canAccessAuthRoutes: false,
  });
  assert.deepEqual(getAuthRouteAccess(false, false, false), {
    canAccessAppRoutes: false,
    canAccessAuthRoutes: true,
  });
});
