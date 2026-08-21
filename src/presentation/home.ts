import { getPigProgression } from '@/domain/pigProgress';
import { formatCurrency } from '@/domain/savings';
import { Pig } from '@/models/pig';

export type HomeHeaderCopy = {
  dateLabel: string;
  greeting: string;
};

export function getHomeHeaderCopy(now = new Date()): HomeHeaderCopy {
  const hour = now.getHours();
  const greeting = hour < 12
    ? 'Good morning'
    : hour < 18
      ? 'Good afternoon'
      : 'Good evening';

  return {
    dateLabel: new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      weekday: 'long',
    }).format(now).toUpperCase(),
    greeting,
  };
}

export function getHomeSavingsSummary(activePigs: Pig[], currentDate = new Date()) {
  const pig = activePigs[0];
  if (!pig) return 'Your next saving win starts with one small promise.';

  const progression = getPigProgression(pig, currentDate);
  const countdown = /[.!?]$/.test(progression.countdown)
    ? progression.countdown
    : `${progression.countdown}.`;
  return `You’re protecting ${formatCurrency(pig.protectedAmount)} for ${pig.name}. ${countdown}`;
}
