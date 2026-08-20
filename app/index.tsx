import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BalanceOverview } from '@/components/BalanceOverview';
import { CreationSuccessBanner } from '@/components/CreationSuccessBanner';
import { PigCard } from '@/components/PigCard';
import { PigHistoryCard } from '@/components/PigHistoryCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ReleaseNoticeBanner } from '@/components/ReleaseNoticeBanner';
import { Screen } from '@/components/Screen';
import { useSavingsOverview } from '@/hooks/useSavingsOverview';
import { getHomeHeaderCopy } from '@/presentation/home';
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
    releaseNotice,
  } = usePiggi();
  const createdPig = activePigs.find((pig) => pig.id === lastCreatedPigId);
  const releasedPig = pastPigs.find((pig) => pig.id === releaseNotice?.pigId);
  const headerCopy = getHomeHeaderCopy();

  if (!isHydrated) {
    return (
      <Screen>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your Pigs…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{headerCopy.dateLabel}</Text>
          <Text style={styles.title}>{headerCopy.greeting}</Text>
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Piggy Banks</Text>
        <Text style={styles.count}>{activePigs.length} of 1 active</Text>
      </View>

      {activePigs.length ? (
        <>
          <View style={styles.list}>
            {activePigs.map((pig) => (
              <PigCard
                key={pig.id}
                pig={pig}
                onPress={() => router.push({ pathname: '/pig/[id]', params: { id: pig.id } })}
              />
            ))}
          </View>
          <View style={styles.limitNote}>
            <Ionicons color={colors.muted} name="information-circle-outline" size={18} />
            <Text style={styles.limitText}>One active Pig at a time. Open this Pig to view progress or break it early.</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptySpotlight}>
            <Ionicons color={colors.primary} name="lock-closed-outline" size={34} />
          </View>
          <View style={styles.emptyPedestalTop} />
          <View style={styles.emptyPedestal}>
            <Text style={styles.emptyTitle}>Your pedestal is waiting</Text>
            <Text style={styles.emptyText}>Create one Pig to start protecting mock money.</Text>
          </View>
          <View style={styles.createButtonWrap}>
            <PrimaryButton
              icon="add"
              label="Create Pig"
              onPress={() => router.push('/create-pig')}
            />
          </View>
        </View>
      )}

      {pastPigs.length ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pig History</Text>
            <Text style={styles.count}>{pastPigs.length} past</Text>
          </View>
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
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  pressed: { opacity: 0.65 },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  count: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  list: { gap: spacing.md, marginBottom: spacing.lg },
  limitNote: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.sm },
  limitText: { color: colors.muted, flex: 1, fontSize: 12, lineHeight: 18 },
  emptyState: { alignItems: 'center', backgroundColor: '#ECE6D9', borderColor: '#DED4C1', borderRadius: 28, borderWidth: 1, minHeight: 320, overflow: 'hidden', paddingTop: spacing.xl },
  emptySpotlight: { alignItems: 'center', backgroundColor: '#F8F0DA', borderRadius: 55, height: 110, justifyContent: 'center', width: 110 },
  emptyPedestalTop: { backgroundColor: '#E5C56D', borderColor: '#B88C32', borderRadius: 999, borderWidth: 3, height: 28, marginTop: -4, width: '70%' },
  emptyPedestal: { alignItems: 'center', backgroundColor: colors.ink, marginTop: -8, padding: spacing.lg, paddingTop: spacing.xl, width: '62%' },
  emptyTitle: { color: colors.white, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: '#C7D0C7', fontSize: 11, lineHeight: 16, marginTop: 5, textAlign: 'center' },
  createButtonWrap: { marginVertical: spacing.lg, width: '80%' },
  historyList: { gap: spacing.sm },
  loadingState: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 500 },
  loadingText: { color: colors.muted, fontSize: 14, marginTop: spacing.md },
});
