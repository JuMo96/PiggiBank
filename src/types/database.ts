export type Json =
  | boolean
  | null
  | number
  | string
  | Json[]
  | { [key: string]: Json | undefined };

export type DatabaseMoney = number | string;
export type DatabasePigStatus = 'broken' | 'completed' | 'locked';

export type ProfileRow = {
  created_at: string;
  display_name: string | null;
  email: string | null;
  id: string;
  updated_at: string;
};

export type PigRow = {
  broken_at: string | null;
  completed_at: string | null;
  created_at: string;
  icon: string | null;
  id: string;
  name: string;
  protected_amount: DatabaseMoney;
  status: DatabasePigStatus;
  unlock_date: string;
  updated_at: string;
  user_id: string;
};

export type PigInsert = {
  broken_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  icon?: string | null;
  id?: string;
  name: string;
  protected_amount: DatabaseMoney;
  status?: DatabasePigStatus;
  unlock_date: string;
  updated_at?: string;
  user_id: string;
};

export type PigUpdate = Partial<Omit<PigInsert, 'user_id'>>;

export type UserFinancialStateRow = {
  created_at: string;
  mock_bank_balance: DatabaseMoney;
  updated_at: string;
  user_id: string;
};

export type UserFinancialStateInsert = {
  created_at?: string;
  mock_bank_balance?: DatabaseMoney;
  updated_at?: string;
  user_id: string;
};

export type UserFinancialStateUpdate = Partial<
  Omit<UserFinancialStateInsert, 'user_id'>
>;

export type Database = {
  public: {
    CompositeTypes: Record<never, never>;
    Enums: Record<never, never>;
    Functions: Record<never, never>;
    Tables: {
      pigs: {
        Insert: PigInsert;
        Relationships: [];
        Row: PigRow;
        Update: PigUpdate;
      };
      profiles: {
        Insert: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          updated_at?: string;
        };
        Relationships: [];
        Row: ProfileRow;
        Update: Partial<{
          display_name: string | null;
          email: string | null;
          updated_at: string;
        }>;
      };
      user_financial_state: {
        Insert: UserFinancialStateInsert;
        Relationships: [];
        Row: UserFinancialStateRow;
        Update: UserFinancialStateUpdate;
      };
    };
    Views: Record<never, never>;
  };
};
