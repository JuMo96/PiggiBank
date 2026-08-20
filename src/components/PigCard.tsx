import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPigDate, getPigTimeline } from '@/domain/pigs';
import { formatCurrency } from '@/domain/savings';
import { Pig } from '@/models/pig';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type PigCardProps = { onPress: () => void; pig: Pig };

export function PigCard({ onPress, pig }: PigCardProps) {
  const timeline = getPigTimeline(pig);

  return (
    <Pressable
      accessibilityHint="Opens progress and Pig actions"
      accessibilityLabel={`${pig.name}, ${formatCurrency(pig.protectedAmount)} protected, ${timeline.daysRemaining} days remaining`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.spotlight} />
      <View style={[styles.coin, styles.coinLeft]} />
      <View style={[styles.coin, styles.coinRight]} />

      <Image
        accessibilityLabel={`${pig.name} piggy bank`}
        resizeMode="contain"
        source={require('../../assets/characters/piggi-classic.png')}
        style={styles.pigImage}
      />

      <View style={styles.pedestalTop} />
      <View style={styles.pedestalNeck}>
        <View style={styles.statusBadge}>
          <Ionicons color={colors.mint} name="lock-closed" size={11} />
          <Text style={styles.statusText}>PROTECTED</Text>
        </View>
        <Text numberOfLines={1} style={styles.name}>{pig.name}</Text>
        <Text style={styles.amount}>{formatCurrency(pig.protectedAmount)}</Text>
      </View>
      <View style={styles.pedestalBase}>
        <Text style={styles.unlockDate}>
          {timeline.daysRemaining} {timeline.daysRemaining === 1 ? 'DAY' : 'DAYS'} LEFT · {formatPigDate(pig.unlockDate).toUpperCase()}
        </Text>
        <Ionicons color="#D6B25E" name="chevron-forward" size={16} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#ECE6D9',
    borderColor: '#DED4C1',
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 330,
    overflow: 'hidden',
    paddingTop: spacing.md,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
  spotlight: { backgroundColor: '#F8F0DA', borderRadius: 120, height: 220, position: 'absolute', top: 16, width: 220 },
  pigImage: { height: 196, marginBottom: -20, width: 220, zIndex: 3 },
  coin: { backgroundColor: '#E4BC55', borderColor: '#C59228', borderRadius: 12, borderWidth: 2, height: 24, position: 'absolute', width: 24 },
  coinLeft: { left: 35, top: 142, transform: [{ rotate: '-18deg' }] },
  coinRight: { right: 40, top: 105, transform: [{ rotate: '18deg' }] },
  pedestalTop: { backgroundColor: '#E5C56D', borderColor: '#B88C32', borderRadius: 999, borderWidth: 3, height: 31, width: '78%', zIndex: 2 },
  pedestalNeck: { alignItems: 'center', backgroundColor: colors.ink, marginTop: -9, paddingBottom: spacing.md, paddingHorizontal: spacing.md, paddingTop: spacing.lg, width: '68%' },
  statusBadge: { alignItems: 'center', flexDirection: 'row', gap: 4, marginBottom: 5 },
  statusText: { color: colors.mint, fontSize: 9, fontWeight: '900', letterSpacing: 0.9 },
  name: { color: colors.white, fontSize: 18, fontWeight: '800', maxWidth: '100%' },
  amount: { color: '#F2D986', fontSize: 24, fontWeight: '900', letterSpacing: -0.4, marginTop: 2 },
  pedestalBase: { alignItems: 'center', backgroundColor: '#26352E', borderBottomLeftRadius: 18, borderBottomRightRadius: 18, flexDirection: 'row', justifyContent: 'center', minHeight: 42, paddingHorizontal: spacing.md, width: '82%' },
  unlockDate: { color: '#D8DCD9', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
