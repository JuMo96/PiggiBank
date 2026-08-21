import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { formatPigDate, PigTimeline } from '@/domain/pigs';
import { Pig } from '@/models/pig';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

type PigCommitmentCardProps = {
  pig: Pig;
  timeline: PigTimeline;
};

export function PigCommitmentCard({ pig, timeline }: PigCommitmentCardProps) {
  const active = pig.status === 'locked';
  const completed = pig.status === 'completed';
  const progressColor = completed ? colors.completed : pig.status === 'broken' ? colors.broken : colors.primary;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>COMMITMENT PROGRESS</Text>
          <Text style={styles.headline}>
            {active ? timeline.daysRemaining : timeline.percentageCompleted}%
          </Text>
          <Text style={styles.headlineLabel}>
            {active
              ? timeline.daysRemaining === 1 ? 'day remaining' : 'days remaining'
              : completed ? 'complete' : 'completed before ending'}
          </Text>
        </View>
        <View style={styles.percentBadge}>
          <Text style={styles.percentValue}>{timeline.percentageCompleted}%</Text>
        </View>
      </View>

      <ProgressBar color={progressColor} progress={timeline.progress} />

      <View style={styles.dates}>
        <DateStat icon="calendar-outline" label="Started" value={formatPigDate(pig.createdAt)} />
        <View style={styles.divider} />
        <DateStat icon="lock-open-outline" label="Unlock date" value={formatPigDate(pig.unlockDate)} />
      </View>

      {pig.closedAt ? (
        <View style={styles.closedRow}>
          <Ionicons color={progressColor} name={completed ? 'checkmark-circle' : 'flag'} size={17} />
          <Text style={styles.closedText}>
            {completed ? 'Completed' : 'Ended'} {formatPigDate(pig.closedAt)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

type DateStatProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function DateStat({ icon, label, value }: DateStatProps) {
  return (
    <View style={styles.dateStat}>
      <Ionicons color={colors.primary} name={icon} size={17} />
      <View style={styles.dateCopy}>
        <Text style={styles.dateLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.dateValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, marginTop: spacing.lg, padding: spacing.lg },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.9 },
  headline: { color: colors.ink, fontSize: 31, fontWeight: '900', letterSpacing: -0.8, marginTop: spacing.xs },
  headlineLabel: { color: colors.muted, fontSize: fontSizes.caption, marginTop: 1 },
  percentBadge: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 15, height: 52, justifyContent: 'center', width: 62 },
  percentValue: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  dates: { flexDirection: 'row', marginTop: spacing.lg },
  dateStat: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm, minWidth: 0 },
  dateCopy: { flex: 1, minWidth: 0 },
  dateLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  dateValue: { color: colors.ink, fontSize: fontSizes.secondary, fontWeight: '800', marginTop: 3 },
  divider: { backgroundColor: colors.border, marginHorizontal: spacing.smd, width: 1 },
  closedRow: { alignItems: 'center', backgroundColor: colors.background, borderRadius: radii.sm, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, padding: spacing.smd },
  closedText: { color: colors.muted, fontSize: fontSizes.secondary, fontWeight: '700' },
});
