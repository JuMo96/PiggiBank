import { getActivePigs, getSavingsSnapshot } from '@/domain/savings';
import { CreatePigInput, Pig } from '@/models/pig';

export type CreatePigResult =
  | { ok: true; pig: Pig }
  | { error: string; ok: false };

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
export const MAX_ACTIVE_PIGS = 1;

export type PigTimeline = {
  daysRemaining: number;
  percentageCompleted: number;
  progress: number;
};

export function createPig(
  input: CreatePigInput,
  bankBalance: number,
  currentPigs: Pig[],
  now = new Date(),
): CreatePigResult {
  const name = input.name.trim();
  const protectedAmount = roundToCents(input.protectedAmount);
  const today = toLocalIsoDate(now);
  const safeToSpend = getSavingsSnapshot(bankBalance, currentPigs).safeToSpend;

  if (getActivePigs(currentPigs).length >= MAX_ACTIVE_PIGS) {
    return { error: 'You can have one active Pig right now.', ok: false };
  }

  if (!name) {
    return { error: 'Give your Pig a name.', ok: false };
  }

  if (!Number.isFinite(protectedAmount) || protectedAmount <= 0) {
    return { error: 'Enter an amount greater than zero.', ok: false };
  }

  if (protectedAmount > safeToSpend) {
    return {
      error: `This Pig can protect at most ${formatValidationCurrency(safeToSpend)}, your current Safe to Spend balance.`,
      ok: false,
    };
  }

  if (!isValidIsoDate(input.unlockDate)) {
    return { error: 'Enter a valid unlock date in YYYY-MM-DD format.', ok: false };
  }

  if (input.unlockDate <= today) {
    return { error: 'Choose an unlock date after today.', ok: false };
  }

  return {
    ok: true,
    pig: {
      createdAt: today,
      id: `pig-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      icon: 'classic',
      name,
      protectedAmount,
      status: 'locked',
      unlockDate: input.unlockDate,
    },
  };
}

export function removePigById(pigs: Pig[], pigId: string) {
  return pigs.filter((pig) => pig.id !== pigId);
}

export function breakPigById(pigs: Pig[], pigId: string, now = new Date()) {
  const today = toLocalIsoDate(now);
  return pigs.map((pig) => (
    pig.id === pigId && pig.status === 'locked'
      ? { ...pig, closedAt: today, status: 'broken' as const }
      : pig
  ));
}

export function completeMaturePigs(pigs: Pig[], now = new Date()) {
  const today = toLocalIsoDate(now);
  let changed = false;
  const nextPigs = pigs.map((pig) => {
    if (pig.status !== 'locked' || pig.unlockDate > today) return pig;
    changed = true;
    return { ...pig, closedAt: pig.unlockDate, status: 'completed' as const };
  });

  return changed ? nextPigs : pigs;
}

export function getPigTimeline(pig: Pig, now = new Date()): PigTimeline {
  const today = toLocalIsoDate(now);
  const referenceDate = pig.closedAt ?? today;
  const totalDays = Math.max(daysBetween(pig.createdAt, pig.unlockDate), 1);
  const elapsedDays = Math.min(Math.max(daysBetween(pig.createdAt, referenceDate), 0), totalDays);
  const progress = pig.status === 'completed' ? 1 : elapsedDays / totalDays;

  return {
    daysRemaining: pig.status === 'locked'
      ? Math.max(daysBetween(today, pig.unlockDate), 0)
      : 0,
    percentageCompleted: Math.round(progress * 100),
    progress,
  };
}

export function getPigStatusLabel(pig: Pig) {
  if (pig.status === 'broken') return 'Broken early';
  if (pig.status === 'completed') return 'Completed';
  return 'Protected';
}

export function formatPigDate(isoDate: string) {
  const match = ISO_DATE_PATTERN.exec(isoDate);
  if (!match) return isoDate;

  const [, year, month, day] = match;
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
}

function isValidIsoDate(value: string) {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  );
}

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysBetween(startIsoDate: string, endIsoDate: string) {
  const start = isoDateToUtc(startIsoDate);
  const end = isoDateToUtc(endIsoDate);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function isoDateToUtc(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function roundToCents(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatValidationCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(value);
}
