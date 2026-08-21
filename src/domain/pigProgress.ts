import type { Pig } from '@/models/pig';

const MILLISECONDS_PER_DAY = 86_400_000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export type PigStage = 'new' | 'growing' | 'healthy' | 'almostReady' | 'ready';
export type PigVisualState = 'broken' | 'completed' | PigStage;

export type PigStageDefinition = {
  label: string;
  minimumProgress: number;
  personality: string;
  stage: PigStage;
};

export type PigMilestone = {
  label: string;
  threshold: 25 | 50 | 75 | 90 | 100;
};

export type PigProgression = {
  countdown: string;
  daysRemaining: number;
  milestone: PigMilestone | null;
  percentage: number;
  personality: string;
  progress: number;
  stage: PigStage;
  stageLabel: string;
  totalDays: number;
  visualState: PigVisualState;
};

export const PIG_STAGE_THRESHOLDS = {
  almostReady: 0.7,
  growing: 0.2,
  healthy: 0.4,
  ready: 0.95,
} as const;

export const PIG_STAGE_DEFINITIONS: readonly PigStageDefinition[] = [
  {
    label: 'Just Started',
    minimumProgress: 0,
    personality: 'Your Pig is settling in.',
    stage: 'new',
  },
  {
    label: 'Growing',
    minimumProgress: PIG_STAGE_THRESHOLDS.growing,
    personality: 'Your Pig is getting stronger.',
    stage: 'growing',
  },
  {
    label: 'Going Strong',
    minimumProgress: PIG_STAGE_THRESHOLDS.healthy,
    personality: 'Your savings are staying protected.',
    stage: 'healthy',
  },
  {
    label: 'Almost Ready',
    minimumProgress: PIG_STAGE_THRESHOLDS.almostReady,
    personality: 'Not much longer now.',
    stage: 'almostReady',
  },
  {
    label: 'Ready Soon',
    minimumProgress: PIG_STAGE_THRESHOLDS.ready,
    personality: 'Your Pig is almost ready to open.',
    stage: 'ready',
  },
] as const;

export const PIG_MILESTONES: readonly PigMilestone[] = [
  { label: 'Your Pig is growing!', threshold: 25 },
  { label: 'Halfway there', threshold: 50 },
  { label: 'The finish line is getting close', threshold: 75 },
  { label: 'Almost ready', threshold: 90 },
  { label: 'You did it!', threshold: 100 },
] as const;

export function getPigProgress(pig: Pig, currentDate = new Date()) {
  if (pig.status === 'completed') return 1;

  const createdAt = parseIsoDate(pig.createdAt);
  const unlockDate = parseIsoDate(pig.unlockDate);

  if (createdAt === null || unlockDate === null) return 0;
  if (unlockDate <= createdAt) return 1;

  const referenceDate = pig.status === 'broken'
    ? parseIsoDate(pig.closedAt ?? '') ?? createdAt
    : getLocalCalendarTimestamp(currentDate) ?? createdAt;

  return clampProgress((referenceDate - createdAt) / (unlockDate - createdAt));
}

export function getPigStage(pig: Pig, currentDate = new Date()): PigStage {
  return getPigStageForProgress(getPigProgress(pig, currentDate));
}

export function getPigStageForProgress(progress: number): PigStage {
  const clampedProgress = clampProgress(progress);

  for (let index = PIG_STAGE_DEFINITIONS.length - 1; index >= 0; index -= 1) {
    const definition = PIG_STAGE_DEFINITIONS[index];
    if (clampedProgress >= definition.minimumProgress) return definition.stage;
  }

  return 'new';
}

export function getPigVisualState(pig: Pig, currentDate = new Date()): PigVisualState {
  if (pig.status === 'broken') return 'broken';
  if (pig.status === 'completed') return 'completed';

  const progress = getPigProgress(pig, currentDate);
  return progress >= 1 ? 'completed' : getPigStageForProgress(progress);
}

export function getPigMilestone(progress: number): PigMilestone | null {
  const percentage = clampProgress(progress) * 100;

  for (let index = PIG_MILESTONES.length - 1; index >= 0; index -= 1) {
    const milestone = PIG_MILESTONES[index];
    if (percentage >= milestone.threshold) return milestone;
  }

  return null;
}

export function getPigCountdown(pig: Pig, currentDate = new Date()) {
  const visualState = getPigVisualState(pig, currentDate);
  if (visualState === 'broken') return 'Commitment ended';
  if (visualState === 'completed') return 'Ready to open';

  const unlockDate = parseIsoDate(pig.unlockDate);
  const now = getLocalCalendarTimestamp(currentDate);
  if (unlockDate === null) return 'Unlock date unavailable';
  if (now === null || unlockDate <= now) return 'Ready to open';

  const remainingMilliseconds = unlockDate - now;
  const daysRemaining = Math.ceil(remainingMilliseconds / MILLISECONDS_PER_DAY);
  if (daysRemaining > 30) return `${daysRemaining} days remaining`;
  if (daysRemaining >= 7) return `${daysRemaining} days left`;
  if (daysRemaining === 1) return 'Opens tomorrow';
  return `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left!`;
}

export function getPigProgression(pig: Pig, currentDate = new Date()): PigProgression {
  const progress = getPigProgress(pig, currentDate);
  const stage = getPigStageForProgress(progress);
  const visualState = getPigVisualState(pig, currentDate);
  const stageDefinition = getStageDefinition(stage);
  const createdAt = parseIsoDate(pig.createdAt);
  const unlockDate = parseIsoDate(pig.unlockDate);
  const now = getLocalCalendarTimestamp(currentDate);
  const hasValidDuration = createdAt !== null && unlockDate !== null && unlockDate > createdAt;
  const totalDays = hasValidDuration
    ? Math.max(Math.round((unlockDate - createdAt) / MILLISECONDS_PER_DAY), 1)
    : 1;
  const daysRemaining = visualState === 'broken' || visualState === 'completed' || unlockDate === null || now === null
    ? 0
    : Math.max(Math.ceil((unlockDate - now) / MILLISECONDS_PER_DAY), 0);

  return {
    countdown: getPigCountdown(pig, currentDate),
    daysRemaining,
    milestone: visualState === 'broken' ? null : getPigMilestone(progress),
    percentage: Math.round(progress * 100),
    personality: getPersonality(visualState, stageDefinition),
    progress,
    stage,
    stageLabel: getStageLabel(visualState, stageDefinition),
    totalDays,
    visualState,
  };
}

function getStageDefinition(stage: PigStage) {
  return PIG_STAGE_DEFINITIONS.find((definition) => definition.stage === stage)
    ?? PIG_STAGE_DEFINITIONS[0];
}

function getStageLabel(visualState: PigVisualState, stageDefinition: PigStageDefinition) {
  if (visualState === 'broken') return 'Pig Broken';
  if (visualState === 'completed') return 'Completed';
  return stageDefinition.label;
}

function getPersonality(visualState: PigVisualState, stageDefinition: PigStageDefinition) {
  if (visualState === 'broken') return 'This savings commitment has ended.';
  if (visualState === 'completed') return 'You did it!';
  return stageDefinition.personality;
}

function clampProgress(progress: number) {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(Math.max(progress, 0), 1);
}

function getLocalCalendarTimestamp(date: Date) {
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return null;

  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIsoDate(value: string) {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const timestamp = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const date = new Date(timestamp);

  if (
    date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return timestamp;
}
