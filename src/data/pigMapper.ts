import { parseDatabaseMoney, serializeDatabaseMoney } from '@/data/money';
import type { Pig } from '@/models/pig';
import type { PigInsert, PigRow, PigUpdate } from '@/types/database';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export class PigMappingError extends Error {
  constructor(fieldName: string) {
    super(`The stored Pig has an invalid ${fieldName}.`);
    this.name = 'PigMappingError';
  }
}

export function mapPigRowToDomainPig(row: PigRow): Pig {
  const status = row.status;

  if (!row.id.trim()) throw new PigMappingError('ID');
  if (!row.name.trim()) throw new PigMappingError('name');
  assertIsoDate(row.created_at, 'creation date');
  assertIsoDate(row.unlock_date, 'unlock date');
  if (status === 'broken') {
    if (row.broken_on) assertIsoDate(row.broken_on, 'broken date');
    else if (!row.broken_at) throw new PigMappingError('broken date');
  }

  const closedAt = status === 'completed'
    ? row.unlock_date
    : status === 'broken'
      ? row.broken_on ?? timestampToUtcIsoDate(row.broken_at ?? '')
      : undefined;

  return {
    ...(closedAt ? { closedAt } : {}),
    createdAt: row.created_at,
    icon: 'classic',
    id: row.id,
    name: row.name,
    protectedAmount: parseDatabaseMoney(row.protected_amount, 'protected amount'),
    status,
    unlockDate: row.unlock_date,
  };
}

export function mapDomainPigToInsert(userId: string, pig: Pig): PigInsert {
  assertUserId(userId);
  assertPigDates(pig);

  return {
    created_at: pig.createdAt,
    icon: pig.icon,
    name: pig.name.trim(),
    protected_amount: serializeDatabaseMoney(pig.protectedAmount, 'protected amount'),
    status: pig.status,
    unlock_date: pig.unlockDate,
    user_id: userId,
  };
}

export function mapDomainPigUpdates(
  updates: Partial<Pick<Pig, 'icon' | 'name' | 'protectedAmount' | 'unlockDate'>>,
): PigUpdate {
  const databaseUpdates: PigUpdate = {};

  if (updates.icon !== undefined) databaseUpdates.icon = updates.icon;
  if (updates.name !== undefined) {
    const name = updates.name.trim();
    if (!name) throw new PigMappingError('name');
    databaseUpdates.name = name;
  }
  if (updates.protectedAmount !== undefined) {
    databaseUpdates.protected_amount = serializeDatabaseMoney(
      updates.protectedAmount,
      'protected amount',
    );
  }
  if (updates.unlockDate !== undefined) {
    assertIsoDate(updates.unlockDate, 'unlock date');
    databaseUpdates.unlock_date = updates.unlockDate;
  }

  return databaseUpdates;
}

export function toDatabaseEventTimestamp(value: Date | string) {
  if (typeof value === 'string' && ISO_DATE_PATTERN.test(value)) {
    assertIsoDate(value, 'closed date');
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12).toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new PigMappingError('closed date');
  return date.toISOString();
}

export function toLocalCalendarDate(value: Date | string) {
  if (typeof value === 'string' && ISO_DATE_PATTERN.test(value)) {
    assertIsoDate(value, 'event date');
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new PigMappingError('event date');

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timestampToUtcIsoDate(value: string) {
  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime())) throw new PigMappingError('broken date');

  const year = timestamp.getUTCFullYear();
  const month = String(timestamp.getUTCMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function assertPigDates(pig: Pig) {
  assertIsoDate(pig.createdAt, 'creation date');
  assertIsoDate(pig.unlockDate, 'unlock date');
}

function assertUserId(userId: string) {
  if (!userId.trim()) throw new PigMappingError('user ID');
}

function assertIsoDate(value: string, fieldName: string) {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) throw new PigMappingError(fieldName);

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day)
  ) {
    throw new PigMappingError(fieldName);
  }
}
