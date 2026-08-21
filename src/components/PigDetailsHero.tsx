import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PigAvatar } from '@/components/PigAvatar';
import { PigProgression } from '@/domain/pigProgress';
import { formatCurrency } from '@/domain/savings';
import { Pig } from '@/models/pig';
import { getPigProgressVisuals } from '@/presentation/pigProgress';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

type PigDetailsHeroProps = {
  pig: Pig;
  progression: PigProgression;
};

export function PigDetailsHero({ pig, progression }: PigDetailsHeroProps) {
  const completed = progression.visualState === 'completed';
  const broken = progression.visualState === 'broken';
  const active = !completed && !broken;
  const visual = getPigProgressVisuals(progression.visualState);

  return (
    <View style={[
      styles.card,
      completed && styles.completedCard,
      broken && styles.brokenCard,
    ]}>
      <PigAvatar
        accessibilityLabel={`${pig.name}, ${progression.stageLabel}`}
        size="large"
        stage={progression.stage}
        status={pig.status}
        theme={pig.icon}
        visualState={progression.visualState}
      />
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: visual.accent }]}>
          {active ? 'YOUR PIG IS GROWING' : completed ? 'YOU DID IT!' : 'PIG BROKEN'}
        </Text>
        <Text style={styles.name}>{pig.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: visual.surface }]}>
          <Ionicons color={visual.accent} name={visual.icon} size={14} />
          <Text style={[styles.statusText, { color: visual.accent }]}>
            {progression.stageLabel}
          </Text>
        </View>
        <Text style={styles.personality}>{progression.personality}</Text>
        <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.amount}>
          {formatCurrency(pig.protectedAmount)}
        </Text>
        <Text style={styles.amountLabel}>
          {active
            ? 'protected from everyday spending'
            : completed
              ? `protected for ${progression.totalDays} ${progression.totalDays === 1 ? 'day' : 'days'}`
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
  personality: { color: colors.muted, fontSize: fontSizes.secondary, lineHeight: 19, marginTop: spacing.sm, textAlign: 'center' },
  amount: { color: colors.ink, fontSize: 40, fontWeight: '900', letterSpacing: -1.3, marginTop: spacing.smd, maxWidth: '100%' },
  amountLabel: { color: colors.muted, fontSize: fontSizes.secondary, lineHeight: 19, marginTop: spacing.xs, textAlign: 'center' },
});
