import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedEntrance } from '@/components/AnimatedEntrance';
import { PigShowcase } from '@/components/PigShowcase';
import { ProgressBar } from '@/components/ProgressBar';
import { formatPigDate, getPigTimeline } from '@/domain/pigs';
import { formatCurrency } from '@/domain/savings';
import { Pig } from '@/models/pig';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

type PigCardProps = { onPress: () => void; pig: Pig };

export function PigCard({ onPress, pig }: PigCardProps) {
  const timeline = getPigTimeline(pig);

  return (
    <AnimatedEntrance>
      <Pressable
        accessibilityHint="Opens progress and Pig actions"
        accessibilityLabel={`${pig.name}, ${formatCurrency(pig.protectedAmount)} protected, ${timeline.daysRemaining} days remaining`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.topRow}>
          <PigShowcase
            accessibilityLabel={`${pig.name} piggy bank`}
            size="compact"
            status={pig.status}
          />
          <View style={styles.content}>
            <View style={styles.statusBadge}>
              <Ionicons color={colors.primary} name="lock-closed" size={12} />
              <Text style={styles.statusText}>PROTECTED</Text>
            </View>
            <Text numberOfLines={2} style={styles.name}>{pig.name}</Text>
            <Text adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={styles.amount}>
              {formatCurrency(pig.protectedAmount)}
            </Text>
            <Text style={styles.amountLabel}>protected</Text>
          </View>
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.daysLeft}>
            {timeline.daysRemaining} {timeline.daysRemaining === 1 ? 'day' : 'days'} left
          </Text>
          <Text style={styles.percent}>{timeline.percentageCompleted}%</Text>
        </View>
        <ProgressBar color={colors.primary} progress={timeline.progress} />
        <View style={styles.footer}>
          <Text numberOfLines={1} style={styles.unlockDate}>Opens {formatPigDate(pig.unlockDate)}</Text>
          <View style={styles.openHint}>
            <Text style={styles.openText}>View Pig</Text>
            <Ionicons color={colors.primary} name="chevron-forward" size={16} />
          </View>
        </View>
      </Pressable>
    </AnimatedEntrance>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.992 }] },
  topRow: { alignItems: 'center', flexDirection: 'row', marginLeft: -8 },
  content: { flex: 1, marginLeft: spacing.smd, minWidth: 0 },
  statusBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radii.pill, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  name: { color: colors.ink, fontSize: fontSizes.cardTitle, fontWeight: '800', letterSpacing: -0.25, lineHeight: 23, marginTop: spacing.sm },
  amount: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.65, marginTop: spacing.sm },
  amountLabel: { color: colors.muted, fontSize: fontSizes.caption, marginTop: 1 },
  progressHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, marginTop: spacing.md },
  daysLeft: { color: colors.ink, fontSize: fontSizes.secondary, fontWeight: '800' },
  percent: { color: colors.muted, fontSize: fontSizes.caption, fontWeight: '700' },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.smd },
  unlockDate: { color: colors.muted, flex: 1, fontSize: fontSizes.caption, marginRight: spacing.sm },
  openHint: { alignItems: 'center', flexDirection: 'row', gap: 1 },
  openText: { color: colors.primary, fontSize: fontSizes.caption, fontWeight: '800' },
});
