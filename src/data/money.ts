import type { DatabaseMoney } from '@/types/database';

export class InvalidMoneyValueError extends Error {
  constructor(fieldName: string) {
    super(`${fieldName} must be a finite, non-negative currency value.`);
    this.name = 'InvalidMoneyValueError';
  }
}

export function parseDatabaseMoney(value: DatabaseMoney, fieldName: string) {
  const numericValue = typeof value === 'string' && value.trim() === ''
    ? Number.NaN
    : Number(value);
  const cents = Math.round((numericValue + Number.EPSILON) * 100);

  if (
    !Number.isFinite(numericValue)
    || numericValue < 0
    || !Number.isSafeInteger(cents)
  ) {
    throw new InvalidMoneyValueError(fieldName);
  }

  return cents / 100;
}

export function serializeDatabaseMoney(value: number, fieldName: string) {
  const normalizedValue = parseDatabaseMoney(value, fieldName);
  return normalizedValue.toFixed(2);
}
