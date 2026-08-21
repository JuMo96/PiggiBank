import type { Pig } from '@/models/pig';
import {
  mapDomainPigToInsert,
  mapDomainPigUpdates,
  mapPigRowToDomainPig,
  toDatabaseEventTimestamp,
  toLocalCalendarDate,
} from '@/data/pigMapper';
import {
  assertRepositoryUser,
  normalizeRepositoryError,
  RepositoryError,
} from '@/repositories/repositoryError';
import { assertSupabaseConfigured, supabase } from '@/services/supabase';

export type PigEditableFields = Partial<
  Pick<Pig, 'icon' | 'name' | 'protectedAmount' | 'unlockDate'>
>;

export async function getPigsForUser(userId: string): Promise<Pig[]> {
  try {
    prepareRepositoryCall(userId);
    const { data, error } = await supabase
      .from('pigs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(mapPigRowToDomainPig);
  } catch (error) {
    throw normalizeRepositoryError(error, 'load', 'Pigs');
  }
}

export async function createPigForUser(userId: string, pig: Pig): Promise<Pig> {
  try {
    prepareRepositoryCall(userId);
    const insert = mapDomainPigToInsert(userId, pig);
    const { data, error } = await supabase
      .from('pigs')
      .insert(insert)
      .select('*')
      .single();

    if (error) throw error;
    return mapPigRowToDomainPig(data);
  } catch (error) {
    throw normalizeRepositoryError(error, 'create', 'Pig');
  }
}

export async function updatePigForUser(
  userId: string,
  pigId: string,
  updates: PigEditableFields,
): Promise<Pig> {
  try {
    preparePigMutation(userId, pigId);
    const { data, error } = await supabase
      .from('pigs')
      .update(mapDomainPigUpdates(updates))
      .eq('user_id', userId)
      .eq('id', pigId)
      .select('*')
      .single();

    if (error) throw error;
    return mapPigRowToDomainPig(data);
  } catch (error) {
    throw normalizeRepositoryError(error, 'update', 'Pig');
  }
}

export async function breakPigForUser(
  userId: string,
  pigId: string,
  closedAt: Date | string = new Date(),
): Promise<Pig> {
  return updatePigStatusForUser(userId, pigId, 'broken', closedAt);
}

export async function completePigForUser(
  userId: string,
  pigId: string,
  completedAt: Date | string = new Date(),
): Promise<Pig> {
  return updatePigStatusForUser(userId, pigId, 'completed', completedAt);
}

export async function deletePigForUser(userId: string, pigId: string): Promise<void> {
  try {
    preparePigMutation(userId, pigId);
    const { error } = await supabase
      .from('pigs')
      .delete()
      .eq('user_id', userId)
      .eq('id', pigId);

    if (error) throw error;
  } catch (error) {
    throw normalizeRepositoryError(error, 'delete', 'Pig');
  }
}

async function updatePigStatusForUser(
  userId: string,
  pigId: string,
  status: 'broken' | 'completed',
  eventTime: Date | string,
) {
  try {
    preparePigMutation(userId, pigId);
    const eventTimestamp = toDatabaseEventTimestamp(eventTime);
    const statusUpdate = status === 'broken'
      ? {
          broken_at: eventTimestamp,
          broken_on: toLocalCalendarDate(eventTime),
          completed_at: null,
          status,
        }
      : {
          broken_at: null,
          broken_on: null,
          completed_at: eventTimestamp,
          status,
        };
    const lifecycleUpdate = supabase
      .from('pigs')
      .update(statusUpdate)
      .eq('user_id', userId)
      .eq('id', pigId)
      .eq('status', 'locked');
    const guardedUpdate = status === 'completed'
      ? lifecycleUpdate.lte('unlock_date', toLocalCalendarDate(eventTime))
      : lifecycleUpdate;
    const { data, error } = await guardedUpdate
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new RepositoryError(
        'conflict',
        'This Pig changed on another device. Refresh and try again.',
      );
    }
    return mapPigRowToDomainPig(data);
  } catch (error) {
    throw normalizeRepositoryError(error, 'update', 'Pig');
  }
}

function prepareRepositoryCall(userId: string) {
  assertRepositoryUser(userId);
  assertSupabaseConfigured();
}

function preparePigMutation(userId: string, pigId: string) {
  prepareRepositoryCall(userId);
  if (!pigId.trim()) {
    throw new RepositoryError('invalid-data', 'Choose a valid Pig and try again.');
  }
}
