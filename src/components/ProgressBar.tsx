import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

type ProgressBarProps = { color: string; progress: number };

export function ProgressBar({ color, progress }: ProgressBarProps) {
  const width = `${Math.min(Math.max(progress, 0), 1) * 100}%` as `${number}%`;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { backgroundColor: color, width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.progressTrack, borderRadius: 999, height: 7, overflow: 'hidden' },
  fill: { borderRadius: 999, height: '100%' },
});
