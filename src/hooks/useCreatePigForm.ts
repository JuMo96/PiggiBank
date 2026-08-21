import { useState } from 'react';

import { Pig } from '@/models/pig';
import { usePiggi } from '@/state/PiggiProvider';

type PigForm = {
  amount: string;
  name: string;
  unlockDate: string;
};

type PigFormErrors = Partial<Record<keyof PigForm | 'form', string>>;

const INITIAL_FORM: PigForm = {
  amount: '',
  name: '',
  unlockDate: '',
};

export function useCreatePigForm() {
  const { addPig } = usePiggi();
  const [form, setForm] = useState<PigForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<PigFormErrors>({});

  function setField<Key extends keyof PigForm>(key: Key, value: PigForm[Key]) {
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(): Pig | null {
    const result = addPig({
      name: form.name,
      protectedAmount: Number(form.amount.replace(/[$,\s]/g, '')),
      unlockDate: form.unlockDate.trim(),
    });

    if (!result.ok) {
      setErrors({ [result.field]: result.error });
      return null;
    }

    return result.pig;
  }

  return { errors, form, setField, submit };
}
