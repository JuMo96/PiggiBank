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
