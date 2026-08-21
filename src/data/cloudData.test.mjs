import assert from 'node:assert/strict';
import test from 'node:test';

import { parseDatabaseMoney, serializeDatabaseMoney } from './money.ts';
import {
  mapDomainPigToInsert,
  mapPigRowToDomainPig,
  toDatabaseEventTimestamp,
} from './pigMapper.ts';
import { getSavingsSnapshot } from '../domain/savings.ts';

const baseRow = {
  broken_at: null,
  completed_at: null,
  created_at: '2026-08-01',
  icon: 'classic',
  id: '2ffb6ec1-56ca-440b-a52b-3c60a5326730',
  name: 'Japan Trip',
  protected_amount: '1000.00',
  status: 'locked',
  unlock_date: '2026-10-01',
  updated_at: '2026-08-01T19:00:00.000Z',
  user_id: 'e774592a-5f01-4762-aae7-3319fb9e74ea',
};

test('maps a database Pig into the existing date-only domain model', () => {
  assert.deepEqual(mapPigRowToDomainPig(baseRow), {
    createdAt: '2026-08-01',
    icon: 'classic',
    id: '2ffb6ec1-56ca-440b-a52b-3c60a5326730',
    name: 'Japan Trip',
    protectedAmount: 1000,
    status: 'locked',
    unlockDate: '2026-10-01',
  });
});

test('maps broken and completed database timestamps to the domain closed date', () => {
  const brokenPig = mapPigRowToDomainPig({
    ...baseRow,
    broken_at: '2026-08-15T12:00:00.000Z',
    status: 'broken',
  });
  const completedPig = mapPigRowToDomainPig({
    ...baseRow,
    completed_at: '2026-10-01T12:00:00.000Z',
    status: 'completed',
  });

  assert.equal(brokenPig.closedAt, '2026-08-15');
  assert.equal(completedPig.closedAt, '2026-10-01');
});

test('round-trips a date-only close event without a timezone day shift', () => {
  const brokenPig = mapPigRowToDomainPig({
    ...baseRow,
    broken_at: toDatabaseEventTimestamp('2026-08-15'),
    status: 'broken',
  });

  assert.equal(brokenPig.closedAt, '2026-08-15');
});

test('serializes Pig money as two-decimal database numeric text', () => {
  const insert = mapDomainPigToInsert(baseRow.user_id, {
    createdAt: '2026-08-01',
    icon: 'classic',
    id: 'temporary-client-id',
    name: '  Japan Trip  ',
    protectedAmount: 19.99,
    status: 'locked',
    unlockDate: '2026-10-01',
  });

  assert.equal(insert.protected_amount, '19.99');
  assert.equal(insert.name, 'Japan Trip');
  assert.equal('id' in insert, false);
  assert.equal(serializeDatabaseMoney(1.005, 'amount'), '1.01');
});

test('rejects non-finite, negative, and unsafe database money', () => {
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -1, 'not-money', '']) {
    assert.throws(() => parseDatabaseMoney(value, 'amount'));
  }

  assert.throws(() => serializeDatabaseMoney(Number.MAX_SAFE_INTEGER, 'amount'));
});

test('calculates balances from Supabase-loaded Pigs without counting closed Pigs', () => {
  const pigs = [
    mapPigRowToDomainPig(baseRow),
    mapPigRowToDomainPig({
      ...baseRow,
      completed_at: '2026-07-01T12:00:00.000Z',
      id: 'completed-pig',
      protected_amount: '300.00',
      status: 'completed',
    }),
    mapPigRowToDomainPig({
      ...baseRow,
      broken_at: '2026-07-15T12:00:00.000Z',
      id: 'broken-pig',
      protected_amount: '500.00',
      status: 'broken',
    }),
  ];

  assert.deepEqual(getSavingsSnapshot(3250, pigs), {
    bankBalance: 3250,
    protectedMoney: 1000,
    safeToSpend: 2250,
  });
});
