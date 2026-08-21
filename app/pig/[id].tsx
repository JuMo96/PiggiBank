import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorNotice } from '@/components/ErrorNotice';
import { PigCommitmentCard } from '@/components/PigCommitmentCard';
import { PigDetailsHero } from '@/components/PigDetailsHero';
import { Screen } from '@/components/Screen';
import { getPigProgression } from '@/domain/pigProgress';
import { formatCurrency } from '@/domain/savings';
import { notifyWarning } from '@/services/feedback';
import { usePiggi } from '@/state/PiggiProvider';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

export default function PigDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    breakPig,
    getPigById,
    hasLoadedData,
    isHydrated,
    loadError,
    progressionDate,
    refreshData,
    removePig,
  } = usePiggi();
  const mutationStartedRef = useRef(false);
  const [pendingMutation, setPendingMutation] = useState<'break' | 'remove' | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const pig = getPigById(id);

  if (!isHydrated || (!hasLoadedData && !loadError)) {
    return (
      <Screen>
        <View accessibilityLiveRegion="polite" style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Finding your Pig…</Text>
        </View>
      </Screen>
    );
  }

  if (loadError && !hasLoadedData) {
    return (
      <Screen>
        <View style={styles.detailsLoadError}>
          <ErrorNotice
            message={loadError}
            onRetry={() => void refreshData()}
            title="Couldn’t load this Pig"
          />
        </View>
      </Screen>
    );
  }

  if (!pig) {
    return (
      <Screen>
        <View style={styles.empty}>
          {loadError ? (
            <View style={styles.missingPigError}>
              <ErrorNotice
                message={loadError}
                onRetry={() => void refreshData()}
                title="Showing older account data"
              />
            </View>
          ) : null}
          <View style={styles.emptyIcon}>
            <Ionicons color={colors.primary} name="search" size={27} />
          </View>
          <Text style={styles.emptyTitle}>Pig not found</Text>
          <Text style={styles.emptyText}>This Pig may have been removed or may not be available in your account.</Text>
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

  const progression = getPigProgression(pig, progressionDate);
  const isActive = progression.visualState !== 'broken' && progression.visualState !== 'completed';
  const isCompleted = progression.visualState === 'completed';

  const performBreak = async () => {
    if (mutationStartedRef.current) return;
    mutationStartedRef.current = true;
    setPendingMutation('break');
    setMutationError(null);

    try {
      const result = await breakPig(pig.id);
      if (!result.ok) {
        setMutationError(result.error);
        return;
      }

      notifyWarning();
      router.dismissTo('/');
    } catch {
      setMutationError('Your Pig could not be broken. Check your connection and try again.');
    } finally {
      mutationStartedRef.current = false;
      setPendingMutation(null);
    }
  };

  const handleBreak = () => {
    if (mutationStartedRef.current) return;
    Alert.alert(
      `Break ${pig.name}?`,
      `You’re ending this Pig before its unlock date.\n\n${formatCurrency(pig.protectedAmount)} will return to Safe to Spend after Piggi saves this change. This is currently simulated. No payment will be charged.`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: () => void performBreak(),
          style: 'destructive',
          text: 'Break Pig',
        },
      ],
    );
  };

  const performDelete = async () => {
    if (mutationStartedRef.current) return;
    mutationStartedRef.current = true;
    setPendingMutation('remove');
    setMutationError(null);

    try {
      const result = await removePig(pig.id);
      if (!result.ok) {
        setMutationError(result.error);
        return;
      }

      notifyWarning();
      router.dismissTo('/');
    } catch {
      setMutationError('This Pig could not be removed. Check your connection and try again.');
    } finally {
      mutationStartedRef.current = false;
      setPendingMutation(null);
    }
  };

  const handleDelete = () => {
    if (mutationStartedRef.current) return;
    Alert.alert(
      `Remove ${pig.name} from history?`,
      'This permanently removes the Pig from your saved history. Your Safe to Spend balance will not change.',
      [
        { style: 'cancel', text: 'Keep It' },
        {
          onPress: () => void performDelete(),
          style: 'destructive',
          text: 'Remove',
        },
      ],
    );
  };

  return (
    <Screen>
      {loadError ? (
        <View style={styles.staleDataNotice}>
          <ErrorNotice
            message={loadError}
            onRetry={() => void refreshData()}
            title="This Pig may be out of date"
          />
        </View>
      ) : null}
      <PigDetailsHero pig={pig} progression={progression} />
      <PigCommitmentCard pig={pig} progression={progression} />

      {mutationError ? (
        <View style={styles.mutationError}>
          <ErrorNotice message={mutationError} title="Change not saved" />
        </View>
      ) : null}

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
            accessibilityState={{ busy: pendingMutation === 'break', disabled: pendingMutation !== null }}
            disabled={pendingMutation !== null}
            onPress={handleBreak}
            style={({ pressed }) => [
              styles.breakButton,
              pendingMutation !== null && styles.buttonDisabled,
              pressed && styles.breakPressed,
            ]}
          >
            {pendingMutation === 'break' ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : null}
            <Text style={styles.breakButtonText}>
              {pendingMutation === 'break' ? 'Breaking Pig…' : 'Break Pig Early'}
            </Text>
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
                  ? 'This win is part of your Piggi history.'
                  : 'No guilt—your money is available in Safe to Spend again.'}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: pendingMutation === 'remove', disabled: pendingMutation !== null }}
            disabled={pendingMutation !== null}
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.historyButton,
              pendingMutation !== null && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
          >
            {pendingMutation === 'remove' ? (
              <ActivityIndicator color={colors.muted} size="small" />
            ) : (
              <Ionicons color={colors.muted} name="trash-outline" size={18} />
            )}
            <Text style={styles.historyButtonText}>
              {pendingMutation === 'remove' ? 'Removing…' : 'Remove from history'}
            </Text>
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
  breakButton: { alignItems: 'center', borderColor: '#E8C5CC', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.md, minHeight: 52 },
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
  buttonDisabled: { opacity: 0.58 },
  mutationError: { marginTop: spacing.lg },
  loadingState: { alignItems: 'center', justifyContent: 'center', minHeight: 430 },
  loadingText: { color: colors.muted, fontSize: fontSizes.body, marginTop: spacing.md },
  detailsLoadError: { flex: 1, justifyContent: 'center', minHeight: 430 },
  missingPigError: { alignSelf: 'stretch', marginBottom: spacing.lg },
  staleDataNotice: { marginBottom: spacing.md },
  pressed: { opacity: 0.62 },
  empty: { alignItems: 'center', justifyContent: 'center', minHeight: 430, paddingHorizontal: spacing.lg },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 22, height: 64, justifyContent: 'center', width: 64 },
  emptyTitle: { color: colors.ink, fontSize: 23, fontWeight: '900', marginTop: spacing.md },
  emptyText: { color: colors.muted, fontSize: fontSizes.body, lineHeight: 22, marginTop: spacing.sm, textAlign: 'center' },
  homeButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.md, justifyContent: 'center', marginTop: spacing.lg, minHeight: 50, paddingHorizontal: spacing.lg },
  homeButtonText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
});
