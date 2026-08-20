import { useMemo } from 'react';

import { getActivePigs, getPastPigs, getSavingsSnapshot } from '@/domain/savings';
import { usePiggi } from '@/state/PiggiProvider';

export function useSavingsOverview() {
  const { bankBalance, pigs } = usePiggi();

  return useMemo(
    () => ({
      ...getSavingsSnapshot(bankBalance, pigs),
      activePigs: getActivePigs(pigs),
      pastPigs: getPastPigs(pigs),
    }),
    [bankBalance, pigs],
  );
}
