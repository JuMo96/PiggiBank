import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PigCommitmentCard } from '@/components/PigCommitmentCard';
import { PigDetailsHero } from '@/components/PigDetailsHero';
import { Screen } from '@/components/Screen';
import { getPigTimeline } from '@/domain/pigs';
import { formatCurrency } from '@/domain/savings';
import { notifyWarning } from '@/services/feedback';
import { usePiggi } from '@/state/PiggiProvider';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

export default function PigDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { breakPig, getPigById, removePig } = usePiggi();
  const pig = getPigById(id);

  if (!pig) {
    return (
      <Screen>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons color={colors.primary} name="search" size={27} />
          </View>
          <Text style={styles.emptyTitle}>Pig not found</Text>
          <Text style={styles.emptyText}>This Pig may have already been removed from local history.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.dismissTo('/')}
            style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}
          >
            <Text style={styles.homeButtonText}>Back to Your Pigs</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const timeline = getPigTimeline(pig);
  const isActive = pig.status === 'locked';
  const isCompleted = pig.status === 'completed';

  const handleBreak = () => {
    Alert.alert(
      `Break ${pig.name}?`,
      `You’re ending this Pig before its unlock date.\n\n${formatCurrency(pig.protectedAmount)} will return to Safe to Spend. This is currently simulated. No payment will be charged.`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: () => {
            notifyWarning();
            breakPig(pig.id);
            router.dismissTo('/');
          },
          style: 'destructive',
          text: 'Break Pig',
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      `Remove ${pig.name} from history?`,
      'This removes the local record. Your Safe to Spend balance will not change.',
      [
        { style: 'cancel', text: 'Keep It' },
        {
          onPress: () => {
            notifyWarning();
            removePig(pig.id);
            router.dismissTo('/');
          },
          style: 'destructive',
          text: 'Remove',
        },
      ],
    );
  };

  return (
    <Screen>
      <PigDetailsHero pig={pig} timeline={timeline} />
      <PigCommitmentCard pig={pig} timeline={timeline} />

      {isActive ? (
        <View style={styles.breakSection}>
          <View style={styles.breakHeadingRow}>
            <View style={styles.breakIcon}>
              <Ionicons color={colors.danger} name="hammer-outline" size={19} />
            </View>
            <View style={styles.breakHeadingCopy}>
              <Text style={styles.breakTitle}>Need to end early?</Text>
              <Text style={styles.breakDescription}>
                Breaking this Pig early ends your savings commitment.
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityHint="Requires confirmation before ending this Pig"
            accessibilityRole="button"
            onPress={handleBreak}
            style={({ pressed }) => [styles.breakButton, pressed && styles.breakPressed]}
          >
            <Text style={styles.breakButtonText}>Break Pig Early</Text>
          </Pressable>
          <Text style={styles.simulatedNote}>Simulated only. No payment will be charged.</Text>
        </View>
      ) : (
        <>
          <View style={[
            styles.outcomeCard,
            isCompleted ? styles.completedOutcome : styles.brokenOutcome,
          ]}>
            <View style={styles.outcomeIcon}>
              <Ionicons
                color={isCompleted ? colors.completed : colors.broken}
                name={isCompleted ? 'trophy' : 'heart-outline'}
                size={21}
              />
            </View>
            <View style={styles.outcomeCopy}>
              <Text style={styles.outcomeTitle}>
                {isCompleted ? 'Commitment complete' : 'Commitment ended'}
              </Text>
              <Text style={styles.outcomeText}>
                {isCompleted
                  ? 'This win is saved in your Pig history.'
                  : 'No guilt—your money is available in Safe to Spend again.'}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={handleDelete}
            style={({ pressed }) => [styles.historyButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.muted} name="trash-outline" size={18} />
            <Text style={styles.historyButtonText}>Remove from history</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  breakSection: { borderTopColor: colors.border, borderTopWidth: 1, marginTop: spacing.xl, paddingTop: spacing.lg },
  breakHeadingRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.smd },
  breakIcon: { alignItems: 'center', backgroundColor: colors.dangerSoft, borderRadius: 13, height: 42, justifyContent: 'center', width: 42 },
  breakHeadingCopy: { flex: 1 },
  breakTitle: { color: colors.ink, fontSize: fontSizes.body, fontWeight: '800' },
  breakDescription: { color: colors.muted, fontSize: fontSizes.secondary, lineHeight: 19, marginTop: 3 },
  breakButton: { alignItems: 'center', borderColor: '#E8C5CC', borderRadius: radii.md, borderWidth: 1, justifyContent: 'center', marginTop: spacing.md, minHeight: 52 },
  breakPressed: { backgroundColor: colors.dangerSoft },
  breakButtonText: { color: colors.danger, fontSize: 14, fontWeight: '800' },
  simulatedNote: { color: colors.muted, fontSize: 10, marginTop: spacing.sm, textAlign: 'center' },
  outcomeCard: { alignItems: 'flex-start', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.smd, marginTop: spacing.lg, padding: spacing.md },
  completedOutcome: { backgroundColor: colors.completedSoft, borderColor: '#C9E3D6' },
  brokenOutcome: { backgroundColor: colors.brokenSoft, borderColor: '#E5D4CC' },
  outcomeIcon: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 13, height: 42, justifyContent: 'center', width: 42 },
  outcomeCopy: { flex: 1 },
  outcomeTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  outcomeText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  historyButton: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.lg, minHeight: 50 },
  historyButtonText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.62 },
  empty: { alignItems: 'center', justifyContent: 'center', minHeight: 430, paddingHorizontal: spacing.lg },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 22, height: 64, justifyContent: 'center', width: 64 },
  emptyTitle: { color: colors.ink, fontSize: 23, fontWeight: '900', marginTop: spacing.md },
  emptyText: { color: colors.muted, fontSize: fontSizes.body, lineHeight: 22, marginTop: spacing.sm, textAlign: 'center' },
  homeButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.md, justifyContent: 'center', marginTop: spacing.lg, minHeight: 50, paddingHorizontal: spacing.lg },
  homeButtonText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
});
