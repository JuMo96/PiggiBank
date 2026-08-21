import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EMPTY_PIGGI_DATA,
  piggiDataReducer,
  selectPiggiDataForUser,
} from './piggiData.ts';

const pig = {
  createdAt: '2026-01-01',
  icon: 'classic',
  id: 'pig-a',
  name: 'Vacation',
  protectedAmount: 1_000,
  status: 'locked',
  unlockDate: '2026-12-01',
};

test('sign-out immediately clears user-specific financial data', () => {
  const loading = piggiDataReducer(EMPTY_PIGGI_DATA, {
    type: 'authChanged',
    userId: 'user-a',
  });
  const loaded = piggiDataReducer(loading, {
    bankBalance: 6_840,
    pigs: [pig],
    type: 'loaded',
    userId: 'user-a',
  });
  const signedOut = piggiDataReducer(loaded, {
    type: 'authChanged',
    userId: null,
  });

  assert.deepEqual(selectPiggiDataForUser(signedOut, null), EMPTY_PIGGI_DATA);
  assert.deepEqual(signedOut.pigs, []);
  assert.equal(signedOut.bankBalance, 0);
  assert.equal(signedOut.ownerId, null);
});

test('a stale response from the previous user cannot replace the next user data', () => {
  const userBState = piggiDataReducer(EMPTY_PIGGI_DATA, {
    type: 'authChanged',
    userId: 'user-b',
  });
  const staleResult = piggiDataReducer(userBState, {
    bankBalance: 6_840,
    pigs: [pig],
    type: 'loaded',
    userId: 'user-a',
  });

  assert.strictEqual(staleResult, userBState);
  assert.deepEqual(staleResult.pigs, []);
});

test('data owned by another signed-in user is never selected for display', () => {
  const userAState = {
    bankBalance: 6_840,
    hasLoadedData: true,
    ownerId: 'user-a',
    pigs: [pig],
  };

  assert.deepEqual(selectPiggiDataForUser(userAState, 'user-b'), EMPTY_PIGGI_DATA);
});
