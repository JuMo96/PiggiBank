import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPigCountdown,
  getPigMilestone,
  getPigProgress,
  getPigProgression,
  getPigStage,
  getPigStageForProgress,
  getPigVisualState,
} from './pigProgress.ts';

const localDate = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};

function makePig(overrides = {}) {
  return {
    createdAt: '2025-01-01',
    id: 'pig-test',
    icon: 'classic',
    name: 'Test Pig',
    protectedAmount: 500,
    status: 'locked',
    unlockDate: '2025-01-21',
    ...overrides,
  };
}

test('calculates newly created Pig progress without using the real current date', () => {
  const pig = makePig();

  assert.equal(getPigProgress(pig, localDate('2025-01-01')), 0);
  assert.equal(getPigStage(pig, localDate('2025-01-01')), 'new');
  assert.equal(getPigVisualState(pig, localDate('2025-01-01')), 'new');
});

test('calculates the required 25%, 50%, 75%, and 95% progress cases', () => {
  const pig = makePig();

  assert.equal(getPigProgress(pig, localDate('2025-01-06')), 0.25);
  assert.equal(getPigProgress(pig, localDate('2025-01-11')), 0.5);
  assert.equal(getPigProgress(pig, localDate('2025-01-16')), 0.75);
  assert.equal(getPigProgress(pig, localDate('2025-01-20')), 0.95);
});

test('uses all five stage thresholds at their exact boundaries', () => {
  assert.equal(getPigStageForProgress(0), 'new');
  assert.equal(getPigStageForProgress(0.199999), 'new');
  assert.equal(getPigStageForProgress(0.2), 'growing');
  assert.equal(getPigStageForProgress(0.399999), 'growing');
  assert.equal(getPigStageForProgress(0.4), 'healthy');
  assert.equal(getPigStageForProgress(0.699999), 'healthy');
  assert.equal(getPigStageForProgress(0.7), 'almostReady');
  assert.equal(getPigStageForProgress(0.949999), 'almostReady');
  assert.equal(getPigStageForProgress(0.95), 'ready');
  assert.equal(getPigStageForProgress(1), 'ready');
});

test('clamps progress at the unlock date and after it, then presents completion', () => {
  const pig = makePig();

  assert.equal(getPigProgress(pig, localDate('2025-01-21')), 1);
  assert.equal(getPigVisualState(pig, localDate('2025-01-21')), 'completed');
  assert.equal(getPigProgress(pig, localDate('2025-02-01')), 1);
  assert.equal(getPigVisualState(pig, localDate('2025-02-01')), 'completed');
});

test('treats identical and reversed Pig dates safely as complete', () => {
  const identical = makePig({ unlockDate: '2025-01-01' });
  const reversed = makePig({ unlockDate: '2024-12-31' });

  for (const pig of [identical, reversed]) {
    const progress = getPigProgress(pig, localDate('2025-01-01'));
    assert.equal(progress, 1);
    assert.equal(Number.isFinite(progress), true);
    assert.equal(getPigVisualState(pig, localDate('2025-01-01')), 'completed');
  }
});

test('keeps malformed dates finite without falsely presenting completion', () => {
  const invalidUnlock = makePig({ unlockDate: 'not-a-date' });
  const invalidCreation = makePig({ createdAt: '2025-02-30' });

  for (const pig of [invalidUnlock, invalidCreation]) {
    const progress = getPigProgress(pig, localDate('2025-01-01'));
    assert.equal(progress, 0);
    assert.equal(Number.isFinite(progress), true);
    assert.equal(getPigVisualState(pig, localDate('2025-01-01')), 'new');
  }

  assert.equal(getPigCountdown(invalidUnlock, localDate('2025-01-01')), 'Unlock date unavailable');
});

test('clamps a current date before creation to zero', () => {
  const pig = makePig();

  assert.equal(getPigProgress(pig, localDate('2024-12-01')), 0);
});

test('freezes a broken Pig at closedAt and gives broken status priority', () => {
  const pig = makePig({ closedAt: '2025-01-11', status: 'broken' });

  assert.equal(getPigProgress(pig, localDate('2025-01-15')), 0.5);
  assert.equal(getPigProgress(pig, localDate('2026-01-01')), 0.5);
  assert.equal(getPigVisualState(pig, localDate('2026-01-01')), 'broken');
  assert.equal(getPigProgression(pig, localDate('2026-01-01')).stageLabel, 'Pig Broken');
  assert.equal(getPigProgression(pig, localDate('2026-01-01')).milestone, null);
});

test('gives an explicit completed status priority even before its unlock date', () => {
  const pig = makePig({ closedAt: '2025-01-21', status: 'completed' });

  assert.equal(getPigProgress(pig, localDate('2025-01-02')), 1);
  assert.equal(getPigVisualState(pig, localDate('2025-01-02')), 'completed');
  assert.equal(getPigProgression(pig, localDate('2025-01-02')).personality, 'You did it!');
});

test('supports one-day and one-year Pigs with finite progress', () => {
  const shortPig = makePig({ unlockDate: '2025-01-02' });
  const longPig = makePig({ unlockDate: '2026-01-01' });

  assert.equal(getPigProgress(shortPig, localDate('2025-01-01')), 0);
  assert.equal(getPigProgress(shortPig, localDate('2025-01-02')), 1);
  assert.equal(getPigProgress(longPig, localDate('2025-07-02')), 182 / 365);
});

test('returns zero rather than NaN when the injected current date is invalid', () => {
  const progress = getPigProgress(makePig(), new Date('invalid'));

  assert.equal(progress, 0);
  assert.equal(Number.isNaN(progress), false);
});

test('returns the most recent contextual milestone', () => {
  assert.equal(getPigMilestone(0.24), null);
  assert.deepEqual(getPigMilestone(0.25), { label: 'Your Pig is growing!', threshold: 25 });
  assert.deepEqual(getPigMilestone(0.5), { label: 'Halfway there', threshold: 50 });
  assert.deepEqual(getPigMilestone(0.75), { label: 'The finish line is getting close', threshold: 75 });
  assert.deepEqual(getPigMilestone(0.9), { label: 'Almost ready', threshold: 90 });
  assert.deepEqual(getPigMilestone(1), { label: 'You did it!', threshold: 100 });
});

test('formats countdown wording based on proximity to unlock', () => {
  const currentDate = localDate('2025-01-01');

  assert.equal(getPigCountdown(makePig({ unlockDate: '2025-02-12' }), currentDate), '42 days remaining');
  assert.equal(getPigCountdown(makePig({ unlockDate: '2025-01-13' }), currentDate), '12 days left');
  assert.equal(getPigCountdown(makePig({ unlockDate: '2025-01-04' }), currentDate), '3 days left!');
  assert.equal(getPigCountdown(makePig({ unlockDate: '2025-01-02' }), currentDate), 'Opens tomorrow');
});

test('high-level progression exposes one consistent derived view', () => {
  const progression = getPigProgression(makePig(), localDate('2025-01-16'));

  assert.deepEqual(progression, {
    countdown: '5 days left!',
    daysRemaining: 5,
    milestone: { label: 'The finish line is getting close', threshold: 75 },
    percentage: 75,
    personality: 'Not much longer now.',
    progress: 0.75,
    stage: 'almostReady',
    stageLabel: 'Almost Ready',
    totalDays: 20,
    visualState: 'almostReady',
  });
});
