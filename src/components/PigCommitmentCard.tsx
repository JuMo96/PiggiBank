import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { PigProgression } from '@/domain/pigProgress';
import { formatPigDate } from '@/domain/pigs';
import { Pig } from '@/models/pig';
import { getPigProgressVisuals } from '@/presentation/pigProgress';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

type PigCommitmentCardProps = {
  pig: Pig;
  progression: PigProgression;
};

export function PigCommitmentCard({ pig, progression }: PigCommitmentCardProps) {
  const completed = progression.visualState === 'completed';
  const broken = progression.visualState === 'broken';
  const active = !completed && !broken;
  const visual = getPigProgressVisuals(progression.visualState);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>COMMITMENT PROGRESS</Text>
        <Text style={styles.headline}>
          {active
            ? progression.countdown
            : completed
              ? 'Commitment complete'
              : 'Commitment ended'}
        </Text>
        <View style={[styles.stageRow, { backgroundColor: visual.surface }]}>
          <Ionicons color={visual.accent} name={visual.icon} size={15} />
          <Text style={[styles.stageText, { color: visual.accent }]}>
            {progression.stageLabel}
          </Text>
        </View>
        <Text style={styles.headlineLabel}>
          {active
            ? `${progression.percentage}% of the way there`
            : completed
              ? 'Your protected money is available again.'
              : `${progression.percentage}% completed before ending.`}
        </Text>
      </View>

      <ProgressBar
        color={visual.accent}
        progress={progression.progress}
        showMilestones={!broken}
      />

      {active && progression.milestone ? (
        <View style={[styles.milestoneCard, { backgroundColor: visual.surface }]}>
          <View style={[styles.milestoneIcon, { backgroundColor: colors.surface }]}>
            <Ionicons color={visual.accent} name="flag-outline" size={17} />
          </View>
          <View style={styles.milestoneCopy}>
            <Text style={[styles.milestoneLabel, { color: visual.accent }]}>MILESTONE</Text>
            <Text style={styles.milestoneText}>{progression.milestone.label}</Text>
          </View>
          <Text style={[styles.milestonePercent, { color: visual.accent }]}>
            {progression.milestone.threshold}%
          </Text>
        </View>
      ) : null}

      <View style={styles.dates}>
        <DateStat color={visual.accent} icon="calendar-outline" label="Started" value={formatPigDate(pig.createdAt)} />
        <View style={styles.divider} />
        <DateStat color={visual.accent} icon="lock-open-outline" label="Unlock date" value={formatPigDate(pig.unlockDate)} />
      </View>

      {pig.closedAt ? (
        <View style={styles.closedRow}>
          <Ionicons color={visual.accent} name={completed ? 'checkmark-circle' : 'flag'} size={17} />
          <Text style={styles.closedText}>
            {completed ? 'Completed' : 'Ended'} {formatPigDate(pig.closedAt)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

type DateStatProps = {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function DateStat({ color, icon, label, value }: DateStatProps) {
  return (
    <View style={styles.dateStat}>
      <Ionicons color={color} name={icon} size={17} />
      <View style={styles.dateCopy}>
        <Text style={styles.dateLabel}>{label}</Text>
        <Text adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={styles.dateValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, marginTop: spacing.lg, padding: spacing.lg },
  header: { marginBottom: spacing.md },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.9 },
  headline: { color: colors.ink, fontSize: 27, fontWeight: '900', letterSpacing: -0.65, lineHeight: 32, marginTop: spacing.xs },
  headlineLabel: { color: colors.muted, fontSize: fontSizes.caption, marginTop: spacing.sm },
  stageRow: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, flexDirection: 'row', gap: 6, marginTop: spacing.sm, paddingHorizontal: 10, paddingVertical: 6 },
  stageText: { fontSize: fontSizes.caption, fontWeight: '900' },
  milestoneCard: { alignItems: 'center', borderRadius: radii.md, flexDirection: 'row', gap: spacing.smd, marginTop: spacing.md, padding: spacing.smd },
  milestoneIcon: { alignItems: 'center', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  milestoneCopy: { flex: 1, minWidth: 0 },
  milestoneLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  milestoneText: { color: colors.ink, fontSize: fontSizes.secondary, fontWeight: '800', marginTop: 2 },
  milestonePercent: { fontSize: fontSizes.secondary, fontWeight: '900' },
  dates: { flexDirection: 'row', marginTop: spacing.lg },
  dateStat: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm, minWidth: 0 },
  dateCopy: { flex: 1, minWidth: 0 },
  dateLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  dateValue: { color: colors.ink, fontSize: fontSizes.secondary, fontWeight: '800', marginTop: 3 },
  divider: { backgroundColor: colors.border, marginHorizontal: spacing.smd, width: 1 },
  closedRow: { alignItems: 'center', backgroundColor: colors.background, borderRadius: radii.sm, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, padding: spacing.smd },
  closedText: { color: colors.muted, fontSize: fontSizes.secondary, fontWeight: '700' },
});
