import { useState } from 'react';

import { Pig } from '@/models/pig';
import { usePiggi } from '@/state/PiggiProvider';

type PigForm = {
  amount: string;
  name: string;
  unlockDate: string;
};

const INITIAL_FORM: PigForm = {
  amount: '',
  name: '',
  unlockDate: '',
};

export function useCreatePigForm() {
  const { addPig } = usePiggi();
  const [form, setForm] = useState<PigForm>(INITIAL_FORM);
  const [error, setError] = useState('');

  function setField<Key extends keyof PigForm>(key: Key, value: PigForm[Key]) {
    setError('');
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(): Pig | null {
    const result = addPig({
      name: form.name,
      protectedAmount: Number(form.amount.replace(/[$,\s]/g, '')),
      unlockDate: form.unlockDate.trim(),
    });

    if (!result.ok) {
      setError(result.error);
      return null;
    }

    return result.pig;
  }

  return { error, form, setField, submit };
}
