import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, ImageSourcePropType, StyleSheet, View } from 'react-native';

import { PigStage, PigVisualState } from '@/domain/pigProgress';
import { PigStatus } from '@/models/pig';
import { colors } from '@/theme/colors';
import { radii } from '@/theme/spacing';

export type PigAvatarSize = 'compact' | 'large';
export type PigAvatarTheme = 'classic';

type PigAvatarProps = {
  accessible?: boolean;
  accessibilityLabel?: string;
  size?: PigAvatarSize;
  stage?: PigStage;
  status?: PigStatus;
  theme?: PigAvatarTheme;
  visualState?: PigVisualState;
};

type StageVisual = {
  coinCount: number;
  haloColor: string;
  motion: number;
  scale: number;
  shine: 'none' | 'soft' | 'strong' | 'gold';
};

const STAGE_VISUALS: Record<PigStage, StageVisual> = {
  new: {
    coinCount: 0,
    haloColor: colors.primarySoft,
    motion: 2,
    scale: 0.86,
    shine: 'none',
  },
  growing: {
    coinCount: 1,
    haloColor: '#FADEE7',
    motion: 3,
    scale: 0.91,
    shine: 'soft',
  },
  healthy: {
    coinCount: 2,
    haloColor: colors.safeSoft,
    motion: 3,
    scale: 0.96,
    shine: 'soft',
  },
  almostReady: {
    coinCount: 3,
    haloColor: '#FFF0C7',
    motion: 4,
    scale: 1,
    shine: 'strong',
  },
  ready: {
    coinCount: 4,
    haloColor: colors.goldSoft,
    motion: 5,
    scale: 1.04,
    shine: 'gold',
  },
};

const PIG_THEME_IMAGES: Record<PigAvatarTheme, ImageSourcePropType> = {
  classic: require('../../assets/characters/piggi-classic.png'),
};

export function PigAvatar({
  accessible = true,
  accessibilityLabel = 'Piggi piggy bank',
  size = 'large',
  stage = 'new',
  status = 'locked',
  theme = 'classic',
  visualState,
}: PigAvatarProps) {
  const large = size === 'large';
  const broken = visualState === 'broken' || status === 'broken';
  const completed = !broken && (visualState === 'completed' || status === 'completed');
  const resolvedStage = visualState && visualState !== 'broken' && visualState !== 'completed'
    ? visualState
    : stage;
  const stageVisual = STAGE_VISUALS[resolvedStage];
  const motion = useRef(new Animated.Value(0)).current;
  const shineOpacity = useRef(new Animated.Value(0.45)).current;
  const coinCount = completed ? 5 : broken ? 0 : stageVisual.coinCount;
  const scale = completed ? 1.04 : broken ? 0.94 : stageVisual.scale;
  const haloColor = completed
    ? colors.goldSoft
    : broken
      ? colors.brokenSoft
      : stageVisual.haloColor;

  useEffect(() => {
    let isMounted = true;
    let animation: Animated.CompositeAnimation | undefined;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!isMounted || reduceMotion || broken) {
        motion.setValue(0);
        shineOpacity.setValue(1);
        return;
      }

      animation = Animated.parallel([
        Animated.sequence([
          Animated.timing(motion, {
            duration: completed ? 260 : 420,
            toValue: -(completed ? 5 : stageVisual.motion),
            useNativeDriver: true,
          }),
          Animated.spring(motion, {
            damping: 9,
            stiffness: 125,
            toValue: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shineOpacity, {
            duration: 360,
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(shineOpacity, {
            delay: 140,
            duration: 480,
            toValue: 0.62,
            useNativeDriver: true,
          }),
        ]),
      ]);
      animation.start();
    });

    return () => {
      isMounted = false;
      animation?.stop();
    };
  }, [broken, completed, motion, shineOpacity, stageVisual.motion]);

  return (
    <View
      accessibilityLabel={accessible ? accessibilityLabel : undefined}
      accessibilityRole={accessible ? 'image' : undefined}
      accessible={accessible}
      importantForAccessibility={accessible ? 'yes' : 'no'}
      style={[styles.container, large ? styles.containerLarge : styles.containerCompact]}
    >
      <View
        style={[
          styles.halo,
          large ? styles.haloLarge : styles.haloCompact,
          { backgroundColor: haloColor },
        ]}
      />

      <CoinCluster count={coinCount} large={large} spilled={completed} />
      <StageShine
        large={large}
        opacity={shineOpacity}
        shine={completed ? 'gold' : broken ? 'none' : stageVisual.shine}
      />

      {broken ? (
        <Ionicons
          accessibilityElementsHidden
          color={colors.broken}
          importantForAccessibility="no-hide-descendants"
          name="flash"
          size={large ? 30 : 20}
          style={styles.breakMark}
        />
      ) : null}

      <Animated.Image
        accessible={false}
        resizeMode="contain"
        source={PIG_THEME_IMAGES[theme]}
        style={[
          styles.image,
          large ? styles.imageLarge : styles.imageCompact,
          broken && styles.brokenImage,
          { transform: [{ scale }, { translateY: motion }] },
        ]}
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

type CoinClusterProps = {
  count: number;
  large: boolean;
  spilled: boolean;
};

function CoinCluster({ count, large, spilled }: CoinClusterProps) {
  const coinStyles = [styles.coinOne, styles.coinTwo, styles.coinThree, styles.coinFour, styles.coinFive];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {coinStyles.slice(0, count).map((coinStyle, index) => (
        <View
          key={`coin-${index}`}
          style={[
            styles.coin,
            large ? styles.coinLarge : styles.coinCompact,
            coinStyle,
            spilled && styles.spilledCoin,
          ]}
        >
          <View style={styles.coinInset} />
        </View>
      ))}
    </View>
  );
}

type StageShineProps = {
  large: boolean;
  opacity: Animated.Value;
  shine: StageVisual['shine'];
};

function StageShine({ large, opacity, shine }: StageShineProps) {
  if (shine === 'none') return null;

  const color = shine === 'gold' ? colors.gold : shine === 'strong' ? colors.primary : colors.safe;
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.shineLayer, { opacity }]}
    >
      <Ionicons
        color={color}
        name={shine === 'gold' ? 'sparkles' : 'star'}
        size={large ? shine === 'strong' || shine === 'gold' ? 25 : 18 : 14}
        style={styles.shineLeft}
      />
      {shine === 'strong' || shine === 'gold' ? (
        <Ionicons
          color={shine === 'gold' ? colors.primary : colors.gold}
          name="sparkles"
          size={large ? 18 : 12}
          style={styles.shineRight}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'flex-end' },
  containerLarge: { height: 226, width: 270 },
  containerCompact: { height: 118, width: 112 },
  halo: { position: 'absolute' },
  haloLarge: { borderRadius: radii.pill, height: 190, top: 0, width: 190 },
  haloCompact: { borderRadius: radii.pill, height: 94, top: 4, width: 94 },
  image: { zIndex: 3 },
  imageLarge: { height: 186, marginBottom: -18, width: 214 },
  imageCompact: { height: 96, marginBottom: -9, width: 108 },
  brokenImage: { opacity: 0.78 },
  pedestalTop: { backgroundColor: colors.gold, borderColor: colors.goldDeep, borderRadius: radii.pill, borderWidth: 2, zIndex: 4 },
  pedestalTopLarge: { height: 25, width: 214 },
  pedestalTopCompact: { height: 14, width: 104 },
  pedestalBase: { backgroundColor: colors.primary, marginTop: -6, zIndex: 3 },
  pedestalBaseLarge: { borderBottomLeftRadius: radii.sm, borderBottomRightRadius: radii.sm, height: 30, width: 170 },
  pedestalBaseCompact: { borderBottomLeftRadius: 8, borderBottomRightRadius: 8, height: 17, width: 82 },
  completedBase: { backgroundColor: colors.completed },
  brokenBase: { backgroundColor: colors.broken },
  coin: { alignItems: 'center', backgroundColor: colors.gold, borderColor: colors.goldDeep, borderWidth: 1.5, justifyContent: 'center', position: 'absolute', zIndex: 2 },
  coinLarge: { borderRadius: 13, height: 25, width: 25 },
  coinCompact: { borderRadius: 9, height: 17, width: 17 },
  coinInset: { borderColor: '#FFE5A0', borderRadius: radii.pill, borderWidth: 1, height: '62%', width: '62%' },
  coinOne: { left: '13%', top: '47%', transform: [{ rotate: '-18deg' }] },
  coinTwo: { right: '14%', top: '35%', transform: [{ rotate: '14deg' }] },
  coinThree: { left: '20%', top: '25%', transform: [{ rotate: '8deg' }] },
  coinFour: { right: '23%', top: '18%', transform: [{ rotate: '-10deg' }] },
  coinFive: { bottom: '10%', right: '10%', transform: [{ rotate: '22deg' }], zIndex: 5 },
  spilledCoin: { zIndex: 5 },
  shineLayer: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 6 },
  shineLeft: { left: '5%', position: 'absolute', top: '10%' },
  shineRight: { position: 'absolute', right: '7%', top: '25%' },
  breakMark: { position: 'absolute', right: 8, top: 24, zIndex: 6 },
});
