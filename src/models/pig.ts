export type PigStatus = 'locked' | 'broken' | 'completed';
export type PigIcon = 'classic';

export type Pig = {
  closedAt?: string;
  createdAt: string;
  id: string;
  icon: PigIcon;
  name: string;
  protectedAmount: number;
  status: PigStatus;
  unlockDate: string;
};

export type CreatePigInput = Pick<Pig, 'name' | 'protectedAmount' | 'unlockDate'>;
