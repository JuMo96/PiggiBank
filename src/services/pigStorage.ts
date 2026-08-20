import AsyncStorage from '@react-native-async-storage/async-storage';

import { Pig, PigStatus } from '@/models/pig';

const PIG_STORAGE_KEY = '@piggi/pigs/v1';
const VALID_STATUSES: PigStatus[] = ['locked', 'broken', 'completed'];

let writeQueue = Promise.resolve();

export async function loadStoredPigs(): Promise<Pig[] | null> {
  const value = await AsyncStorage.getItem(PIG_STORAGE_KEY);
  if (!value) return null;

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) return null;
  return parsed.filter(isStoredPig);
}

export function saveStoredPigs(pigs: Pig[]) {
  const serialized = JSON.stringify(pigs);
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(() => AsyncStorage.setItem(PIG_STORAGE_KEY, serialized));
  return writeQueue;
}

function isStoredPig(value: unknown): value is Pig {
  if (!value || typeof value !== 'object') return false;
  const pig = value as Partial<Pig>;
  return (
    typeof pig.createdAt === 'string' &&
    typeof pig.id === 'string' &&
    pig.icon === 'classic' &&
    typeof pig.name === 'string' &&
    typeof pig.protectedAmount === 'number' &&
    typeof pig.status === 'string' &&
    VALID_STATUSES.includes(pig.status as PigStatus) &&
    typeof pig.unlockDate === 'string' &&
    (pig.closedAt === undefined || typeof pig.closedAt === 'string')
  );
}
