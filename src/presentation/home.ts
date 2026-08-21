import { getPigTimeline } from '@/domain/pigs';
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

export function getHomeSavingsSummary(activePigs: Pig[]) {
  const pig = activePigs[0];
  if (!pig) return 'Your next saving win starts with one small promise.';

  const { daysRemaining } = getPigTimeline(pig);
  const dayLabel = daysRemaining === 1 ? 'day' : 'days';
  return `You’re protecting ${formatCurrency(pig.protectedAmount)} for ${pig.name}. ${daysRemaining} ${dayLabel} until it opens.`;
}
