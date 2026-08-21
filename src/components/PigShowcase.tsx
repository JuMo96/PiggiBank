import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';

import { PigStatus } from '@/models/pig';
import { colors } from '@/theme/colors';
import { radii } from '@/theme/spacing';

type PigShowcaseProps = {
  accessibilityLabel?: string;
  size?: 'compact' | 'large';
  status?: PigStatus;
};

export function PigShowcase({
  accessibilityLabel = 'Piggi piggy bank',
  size = 'large',
  status = 'locked',
}: PigShowcaseProps) {
  const large = size === 'large';
  const completed = status === 'completed';
  const broken = status === 'broken';

  return (
    <View style={[styles.container, large ? styles.containerLarge : styles.containerCompact]}>
      <View style={[
        styles.halo,
        large ? styles.haloLarge : styles.haloCompact,
        completed && styles.completedHalo,
        broken && styles.brokenHalo,
      ]} />

      {completed ? (
        <>
          <Ionicons color={colors.gold} name="sparkles" size={large ? 26 : 18} style={styles.sparkleLeft} />
          <Ionicons color={colors.primary} name="star" size={large ? 20 : 14} style={styles.sparkleRight} />
        </>
      ) : null}
      {broken ? (
        <Ionicons color={colors.broken} name="flash" size={large ? 30 : 20} style={styles.breakMark} />
      ) : null}

      <Image
        accessibilityLabel={accessibilityLabel}
        resizeMode="contain"
        source={require('../../assets/characters/piggi-classic.png')}
        style={[styles.image, large ? styles.imageLarge : styles.imageCompact]}
      />
      <View style={[styles.pedestalTop, large ? styles.pedestalTopLarge : styles.pedestalTopCompact]} />
      <View style={[
        styles.pedestalBase,
        large ? styles.pedestalBaseLarge : styles.pedestalBaseCompact,
        completed && styles.completedBase,
        broken && styles.brokenBase,
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'flex-end' },
  containerLarge: { height: 226, width: 270 },
  containerCompact: { height: 134, width: 142 },
  halo: { position: 'absolute' },
  haloLarge: { backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 190, top: 0, width: 190 },
  haloCompact: { backgroundColor: colors.primarySoft, borderRadius: radii.pill, height: 112, top: 4, width: 112 },
  completedHalo: { backgroundColor: colors.goldSoft },
  brokenHalo: { backgroundColor: colors.brokenSoft },
  image: { zIndex: 3 },
  imageLarge: { height: 186, marginBottom: -18, width: 214 },
  imageCompact: { height: 113, marginBottom: -11, width: 132 },
  pedestalTop: { backgroundColor: colors.gold, borderColor: colors.goldDeep, borderRadius: radii.pill, borderWidth: 2, zIndex: 2 },
  pedestalTopLarge: { height: 25, width: 214 },
  pedestalTopCompact: { height: 16, width: 132 },
  pedestalBase: { backgroundColor: colors.primary, marginTop: -6 },
  pedestalBaseLarge: { borderBottomLeftRadius: radii.sm, borderBottomRightRadius: radii.sm, height: 30, width: 170 },
  pedestalBaseCompact: { borderBottomLeftRadius: 8, borderBottomRightRadius: 8, height: 19, width: 104 },
  completedBase: { backgroundColor: colors.completed },
  brokenBase: { backgroundColor: colors.broken },
  sparkleLeft: { left: 8, position: 'absolute', top: 22, zIndex: 4 },
  sparkleRight: { position: 'absolute', right: 11, top: 48, zIndex: 4 },
  breakMark: { position: 'absolute', right: 8, top: 24, zIndex: 4 },
});
