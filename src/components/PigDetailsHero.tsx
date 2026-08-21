import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PigShowcase } from '@/components/PigShowcase';
import { getPigStatusLabel, PigTimeline } from '@/domain/pigs';
import { formatCurrency } from '@/domain/savings';
import { Pig } from '@/models/pig';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

type PigDetailsHeroProps = {
  pig: Pig;
  timeline: PigTimeline;
};

export function PigDetailsHero({ pig, timeline }: PigDetailsHeroProps) {
  const completed = pig.status === 'completed';
  const broken = pig.status === 'broken';
  const active = pig.status === 'locked';
  const icon = active ? 'lock-closed' : completed ? 'trophy' : 'flash';
  const accentColor = completed ? colors.completed : broken ? colors.broken : colors.primary;

  return (
    <View style={[
      styles.card,
      completed && styles.completedCard,
      broken && styles.brokenCard,
    ]}>
      <PigShowcase
        accessibilityLabel={`${pig.name} piggy bank`}
        size="large"
        status={pig.status}
      />
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: accentColor }]}>
          {active ? 'YOUR SAVINGS COMMITMENT' : completed ? 'YOU DID IT!' : 'PIG BROKEN'}
        </Text>
        <Text style={styles.name}>{pig.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${accentColor}14` }]}>
          <Ionicons color={accentColor} name={icon} size={13} />
          <Text style={[styles.statusText, { color: accentColor }]}>{getPigStatusLabel(pig)}</Text>
        </View>
        <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.amount}>
          {formatCurrency(pig.protectedAmount)}
        </Text>
        <Text style={styles.amountLabel}>
          {active
            ? 'protected from everyday spending'
            : completed
              ? `protected for ${timeline.totalDays} ${timeline.totalDays === 1 ? 'day' : 'days'}`
              : 'returned to Safe to Spend'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.surfacePink, borderColor: '#F0C8D4', borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden', paddingBottom: spacing.xl, paddingTop: spacing.md },
  completedCard: { backgroundColor: colors.goldSoft, borderColor: '#EED99A' },
  brokenCard: { backgroundColor: colors.brokenSoft, borderColor: '#E5D4CC' },
  copy: { alignItems: 'center', paddingHorizontal: spacing.lg, width: '100%' },
  eyebrow: { fontSize: fontSizes.caption, fontWeight: '900', letterSpacing: 1.2, marginTop: spacing.md },
  name: { color: colors.ink, fontSize: fontSizes.screenTitle, fontWeight: '900', letterSpacing: -0.9, marginTop: spacing.xs, textAlign: 'center' },
  statusBadge: { alignItems: 'center', borderRadius: radii.pill, flexDirection: 'row', gap: 5, marginTop: spacing.sm, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: fontSizes.caption, fontWeight: '800' },
  amount: { color: colors.ink, fontSize: 40, fontWeight: '900', letterSpacing: -1.3, marginTop: spacing.md, maxWidth: '100%' },
  amountLabel: { color: colors.muted, fontSize: fontSizes.secondary, lineHeight: 19, marginTop: spacing.xs, textAlign: 'center' },
});
