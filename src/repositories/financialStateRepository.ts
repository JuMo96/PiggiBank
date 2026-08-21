import { parseDatabaseMoney, serializeDatabaseMoney } from '@/data/money';
import {
  assertRepositoryUser,
  normalizeRepositoryError,
  RepositoryError,
} from '@/repositories/repositoryError';
import { assertSupabaseConfigured, supabase } from '@/services/supabase';

export type UserFinancialState = {
  mockBankBalance: number;
};

export async function getFinancialStateForUser(
  userId: string,
): Promise<UserFinancialState> {
  try {
    prepareRepositoryCall(userId);
    const { data, error } = await supabase
      .from('user_financial_state')
      .select('mock_bank_balance')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return {
      mockBankBalance: parseDatabaseMoney(data.mock_bank_balance, 'mock bank balance'),
    };
  } catch (error) {
    throw normalizeRepositoryError(error, 'load', 'financial state');
  }
}

export async function updateMockBankBalanceForUser(
  userId: string,
  mockBankBalance: number,
): Promise<UserFinancialState> {
  try {
    prepareRepositoryCall(userId);
    const { data, error } = await supabase
      .from('user_financial_state')
      .update({
        mock_bank_balance: serializeDatabaseMoney(mockBankBalance, 'mock bank balance'),
      })
      .eq('user_id', userId)
      .select('mock_bank_balance')
      .single();

    if (error) throw error;
    return {
      mockBankBalance: parseDatabaseMoney(data.mock_bank_balance, 'mock bank balance'),
    };
  } catch (error) {
    throw normalizeRepositoryError(error, 'update', 'financial state');
  }
}

function prepareRepositoryCall(userId: string) {
  assertRepositoryUser(userId);
  assertSupabaseConfigured();
}

export function assertValidMockBankBalance(value: number) {
  try {
    return parseDatabaseMoney(value, 'mock bank balance');
  } catch (error) {
    throw new RepositoryError(
      'invalid-data',
      'Enter a valid demo bank balance.',
      error,
    );
  }
}
