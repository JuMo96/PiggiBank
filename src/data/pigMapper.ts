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
  const closedTimestamp = status === 'broken' ? row.broken_at : row.completed_at;

  if (!row.id.trim()) throw new PigMappingError('ID');
  if (!row.name.trim()) throw new PigMappingError('name');
  assertIsoDate(row.created_at, 'creation date');
  assertIsoDate(row.unlock_date, 'unlock date');

  const closedAt = closedTimestamp ? timestampToLocalIsoDate(closedTimestamp) : undefined;

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

function timestampToLocalIsoDate(value: string) {
  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime())) throw new PigMappingError('closed date');

  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
