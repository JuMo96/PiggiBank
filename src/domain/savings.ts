import { Pig } from '@/models/pig';

export type SavingsSnapshot = {
  bankBalance: number;
  protectedMoney: number;
  safeToSpend: number;
};

export function calculateProtectedMoney(pigs: Pig[]) {
  return pigs
    .filter((pig) => pig.status === 'locked')
    .reduce((total, pig) => total + pig.protectedAmount, 0);
}

export function calculateSafeToSpend(bankBalance: number, protectedMoney: number) {
  return Math.max(bankBalance - protectedMoney, 0);
}

export function getSavingsSnapshot(bankBalance: number, pigs: Pig[]): SavingsSnapshot {
  const protectedMoney = calculateProtectedMoney(pigs);
  return {
    bankBalance,
    protectedMoney,
    safeToSpend: calculateSafeToSpend(bankBalance, protectedMoney),
  };
}

export function getActivePigs(pigs: Pig[]) {
  return pigs.filter((pig) => pig.status === 'locked');
}

export function getPastPigs(pigs: Pig[]) {
  return pigs.filter((pig) => pig.status !== 'locked');
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(value);
}
