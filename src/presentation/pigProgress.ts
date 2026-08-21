import type { PigVisualState } from '@/domain/pigProgress';
import { colors } from '@/theme/colors';

const PIG_PROGRESS_VISUALS = {
  new: {
    accent: colors.primary,
    icon: 'heart-outline',
    surface: colors.primarySoft,
  },
  growing: {
    accent: colors.primary,
    icon: 'trending-up',
    surface: colors.surfacePink,
  },
  healthy: {
    accent: colors.safe,
    icon: 'shield-checkmark-outline',
    surface: colors.safeSoft,
  },
  almostReady: {
    accent: colors.goldInk,
    icon: 'sparkles-outline',
    surface: colors.goldSoft,
  },
  ready: {
    accent: colors.goldInk,
    icon: 'gift-outline',
    surface: colors.goldSoft,
  },
  completed: {
    accent: colors.completed,
    icon: 'trophy-outline',
    surface: colors.completedSoft,
  },
  broken: {
    accent: colors.broken,
    icon: 'flash-outline',
    surface: colors.brokenSoft,
  },
} as const;

export function getPigProgressVisuals(visualState: PigVisualState) {
  return PIG_PROGRESS_VISUALS[visualState];
}
