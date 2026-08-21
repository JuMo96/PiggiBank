import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BalanceOverview } from '@/components/BalanceOverview';
import { CreationSuccessBanner } from '@/components/CreationSuccessBanner';
import { EmptyPigsState } from '@/components/EmptyPigsState';
import { PigCard } from '@/components/PigCard';
import { PigHistoryCard } from '@/components/PigHistoryCard';
import { ReleaseNoticeBanner } from '@/components/ReleaseNoticeBanner';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { useSavingsOverview } from '@/hooks/useSavingsOverview';
import { getHomeHeaderCopy, getHomeSavingsSummary } from '@/presentation/home';
import { usePiggi } from '@/state/PiggiProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function HomeScreen() {
  const { activePigs, bankBalance, pastPigs, protectedMoney, safeToSpend } = useSavingsOverview();
  const {
    clearCreationNotice,
    clearReleaseNotice,
    isHydrated,
    lastCreatedPigId,
    progressionDate,
    releaseNotice,
  } = usePiggi();
  const createdPig = activePigs.find((pig) => pig.id === lastCreatedPigId);
  const releasedPig = pastPigs.find((pig) => pig.id === releaseNotice?.pigId);
  const headerCopy = getHomeHeaderCopy(progressionDate);
  const savingsSummary = getHomeSavingsSummary(activePigs, progressionDate);

  if (!isHydrated) {
    return (
      <Screen includeTopInset>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Waking up your Pigs…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen includeTopInset>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View accessibilityElementsHidden style={styles.brandMark}>
            <Text style={styles.brandEmoji}>🐷</Text>
          </View>
          <View>
            <Text style={styles.title}>Piggi</Text>
            <Text style={styles.greeting}>{headerCopy.greeting}</Text>
          </View>
        </View>
        <Pressable
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.ink} name="settings-outline" size={22} />
        </Pressable>
      </View>

      <BalanceOverview
        bankBalance={bankBalance}
        protectedMoney={protectedMoney}
        safeToSpend={safeToSpend}
      />

      {createdPig ? (
        <CreationSuccessBanner
          onView={() => {
            clearCreationNotice();
            router.push({ pathname: '/pig/[id]', params: { id: createdPig.id } });
          }}
          pig={createdPig}
        />
      ) : null}

      {releasedPig && releaseNotice ? (
        <ReleaseNoticeBanner
          onDismiss={clearReleaseNotice}
          onView={() => {
            clearReleaseNotice();
            router.push({ pathname: '/pig/[id]', params: { id: releasedPig.id } });
          }}
          pig={releasedPig}
          reason={releaseNotice.reason}
        />
      ) : null}

      <View style={styles.motivationCard}>
        <View style={styles.motivationIcon}>
          <Ionicons color={colors.primary} name="heart" size={18} />
        </View>
        <Text style={styles.motivationText}>{savingsSummary}</Text>
      </View>

      <SectionHeader detail={`${activePigs.length} of 1 active`} title="Your Pigs" />

      {activePigs.length ? (
        <>
          <View style={styles.list}>
            {activePigs.map((pig) => (
              <PigCard
                currentDate={progressionDate}
                key={pig.id}
                pig={pig}
                onPress={() => router.push({ pathname: '/pig/[id]', params: { id: pig.id } })}
              />
            ))}
          </View>
          <View style={styles.limitNote}>
            <Ionicons color={colors.primary} name="sparkles-outline" size={18} />
            <Text style={styles.limitText}>One Pig at a time keeps your promise simple and focused.</Text>
          </View>
        </>
      ) : (
        <EmptyPigsState onCreate={() => router.push('/create-pig')} />
      )}

      {pastPigs.length ? (
        <>
          <SectionHeader detail={`${pastPigs.length} past`} title="Past Pigs" />
          <View style={styles.historyList}>
            {pastPigs.map((pig) => (
              <PigHistoryCard
                key={pig.id}
                onPress={() => router.push({ pathname: '/pig/[id]', params: { id: pig.id } })}
                pig={pig}
              />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.smd },
  brandMark: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 17, height: 50, justifyContent: 'center', width: 50 },
  brandEmoji: { fontSize: 27 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.9 },
  greeting: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 1 },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfacePink,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  pressed: { opacity: 0.65 },
  motivationCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: spacing.smd, marginTop: spacing.md, padding: spacing.md },
  motivationIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 13, height: 40, justifyContent: 'center', width: 40 },
  motivationText: { color: colors.ink, flex: 1, fontSize: 13, lineHeight: 19 },
  list: { gap: spacing.md, marginBottom: spacing.lg },
  limitNote: { alignItems: 'flex-start', backgroundColor: colors.surfacePink, borderRadius: 15, flexDirection: 'row', gap: spacing.sm, padding: spacing.smd },
  limitText: { color: colors.muted, flex: 1, fontSize: 12, lineHeight: 18 },
  historyList: { gap: spacing.sm },
  loadingState: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 500 },
  loadingText: { color: colors.muted, fontSize: 14, marginTop: spacing.md },
});
