import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

type ProgressBarProps = {
  color: string;
  progress: number;
  showMilestones?: boolean;
};

const MILESTONE_MARKERS = [0.25, 0.5, 0.75] as const;

export function ProgressBar({ color, progress, showMilestones = false }: ProgressBarProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const clampedProgress = Number.isFinite(progress)
    ? Math.min(Math.max(progress, 0), 1)
    : 0;

  useEffect(() => {
    let isMounted = true;
    let animation: Animated.CompositeAnimation | undefined;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!isMounted) return;
      if (reduceMotion) {
        animatedProgress.setValue(clampedProgress);
        return;
      }

      animation = Animated.timing(animatedProgress, {
        duration: 650,
        easing: (value) => 1 - ((1 - value) ** 3),
        toValue: clampedProgress,
        useNativeDriver: false,
      });
      animation.start();
    });

    return () => {
      isMounted = false;
      animation?.stop();
    };
  }, [animatedProgress, clampedProgress]);

  const width = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 100, min: 0, now: Math.round(clampedProgress * 100) }}
      style={styles.track}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color, width }]} />
      {showMilestones ? MILESTONE_MARKERS.map((milestone) => (
        <View
          key={milestone}
          style={[styles.milestone, { left: `${milestone * 100}%` as `${number}%` }]}
        />
      )) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.progressTrack, borderRadius: 999, height: 7, overflow: 'hidden' },
  fill: { borderRadius: 999, height: '100%' },
  milestone: { backgroundColor: colors.white, height: '100%', marginLeft: -1, opacity: 0.82, position: 'absolute', width: 2 },
});
