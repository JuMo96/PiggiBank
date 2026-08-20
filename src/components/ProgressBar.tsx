import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

type ProgressBarProps = { color: string; progress: number };

export function ProgressBar({ color, progress }: ProgressBarProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

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
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.progressTrack, borderRadius: 999, height: 7, overflow: 'hidden' },
  fill: { borderRadius: 999, height: '100%' },
});
