import type { Pig } from '@/models/pig';

export type PiggiDataState = {
  bankBalance: number;
  hasLoadedData: boolean;
  ownerId: string | null;
  pigs: Pig[];
};

export type PiggiDataAction =
  | { type: 'authChanged'; userId: string | null }
  | { bankBalance: number; pigs: Pig[]; type: 'loaded'; userId: string }
  | { pigs: Pig[]; type: 'pigsChanged'; userId: string }
  | { bankBalance: number; type: 'balanceChanged'; userId: string };

export const EMPTY_PIGGI_DATA: PiggiDataState = {
  bankBalance: 0,
  hasLoadedData: false,
  ownerId: null,
  pigs: [],
};

export function piggiDataReducer(
  state: PiggiDataState,
  action: PiggiDataAction,
): PiggiDataState {
  if (action.type === 'authChanged') {
    return {
      ...EMPTY_PIGGI_DATA,
      ownerId: action.userId,
    };
  }

  if (state.ownerId !== action.userId) return state;

  if (action.type === 'loaded') {
    return {
      bankBalance: action.bankBalance,
      hasLoadedData: true,
      ownerId: action.userId,
      pigs: action.pigs,
    };
  }

  if (action.type === 'pigsChanged') {
    return { ...state, pigs: action.pigs };
  }

  return { ...state, bankBalance: action.bankBalance };
}

export function selectPiggiDataForUser(
  state: PiggiDataState,
  userId: string | null,
): PiggiDataState {
  if (!userId || state.ownerId !== userId) return EMPTY_PIGGI_DATA;
  return state;
}
