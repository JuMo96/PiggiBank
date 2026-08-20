import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ProgressBar } from '@/components/ProgressBar';
import { formatPigDate, getPigStatusLabel, getPigTimeline } from '@/domain/pigs';
import { formatCurrency } from '@/domain/savings';
import { usePiggi } from '@/state/PiggiProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function PigDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { breakPig, getPigById, removePig } = usePiggi();
  const pig = getPigById(id);

  if (!pig) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Ionicons color={colors.muted} name="search-outline" size={34} />
          <Text style={styles.emptyTitle}>Pig not found</Text>
          <Text style={styles.muted}>This mock savings goal doesn’t exist.</Text>
        </View>
      </Screen>
    );
  }

  const timeline = getPigTimeline(pig);
  const isLocked = pig.status === 'locked';
  const isCompleted = pig.status === 'completed';

  const handleBreak = () => {
    Alert.alert(
      'Break this Pig early?',
      `${formatCurrency(pig.protectedAmount)} will immediately return to Safe to Spend. This is simulated and does not move real money.`,
      [
        { style: 'cancel', text: 'Keep It Protected' },
        {
          onPress: () => {
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
      'Delete from history?',
      'This removes the local record. Your mock balance will not change.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: () => {
            removePig(pig.id);
            router.dismissTo('/');
          },
          style: 'destructive',
          text: 'Delete Record',
        },
      ],
    );
  };

  return (
    <Screen>
      <View style={styles.showcase}>
        <View style={styles.showcaseHalo} />
        <Image
          accessibilityLabel={`${pig.name} piggy bank`}
          resizeMode="contain"
          source={require('../../assets/characters/piggi-classic.png')}
          style={styles.pigImage}
        />
        <View style={styles.pedestalTop} />
        <View style={styles.pedestalBase} />
      </View>
      <Text style={styles.title}>{pig.name}</Text>
      <View style={[
        styles.statusBadge,
        pig.status === 'broken' && styles.brokenStatusBadge,
      ]}>
        <Ionicons
          color={pig.status === 'broken' ? '#A86445' : colors.primary}
          name={isLocked ? 'lock-closed' : isCompleted ? 'checkmark-circle' : 'hammer'}
          size={12}
        />
        <Text style={[
          styles.statusText,
          pig.status === 'broken' && styles.brokenStatusText,
        ]}>
          {getPigStatusLabel(pig).toUpperCase()}
        </Text>
      </View>

      <View style={styles.goalCard}>
        <Text style={styles.cardLabel}>{isLocked ? 'PROTECTED AMOUNT' : 'RELEASED AMOUNT'}</Text>
        <Text style={styles.amount}>{formatCurrency(pig.protectedAmount)}</Text>
        <View style={styles.lockRow}>
          <Ionicons
            color={colors.mint}
            name={isLocked ? 'shield-checkmark' : 'wallet'}
            size={18}
          />
          <Text style={styles.lockText}>
            {isLocked ? 'Excluded from Safe to Spend' : 'Returned to Safe to Spend'}
          </Text>
        </View>
      </View>

      <View style={styles.timelineCard}>
        <View style={styles.timelineHeader}>
          <View>
            <Text style={styles.timelineLabel}>TIME COMPLETED</Text>
            <Text style={styles.timelinePercent}>{timeline.percentageCompleted}%</Text>
          </View>
          <View style={styles.daysBadge}>
            <Text style={styles.daysValue}>{timeline.daysRemaining}</Text>
            <Text style={styles.daysLabel}>{timeline.daysRemaining === 1 ? 'day left' : 'days left'}</Text>
          </View>
        </View>
        <ProgressBar color={isCompleted ? colors.primary : '#D6B25E'} progress={timeline.progress} />
        <View style={styles.timelineDates}>
          <Text style={styles.timelineDateText}>{formatPigDate(pig.createdAt)}</Text>
          <Text style={styles.timelineDateText}>{formatPigDate(pig.unlockDate)}</Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons color={colors.primary} name="calendar-outline" size={18} />
          </View>
          <View>
            <Text style={styles.statLabel}>Created</Text>
            <Text style={styles.statValue}>{formatPigDate(pig.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons color={colors.primary} name="lock-open-outline" size={18} />
          </View>
          <View>
            <Text style={styles.statLabel}>Unlocks</Text>
            <Text style={styles.statValue}>{formatPigDate(pig.unlockDate)}</Text>
          </View>
        </View>
        {pig.closedAt ? (
          <>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons color={colors.primary} name="flag-outline" size={18} />
              </View>
              <View>
                <Text style={styles.statLabel}>{isCompleted ? 'Completed' : 'Broken early'}</Text>
                <Text style={styles.statValue}>{formatPigDate(pig.closedAt)}</Text>
              </View>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.demoBox}>
        <Ionicons color={colors.primary} name="information-circle-outline" size={22} />
        <Text style={styles.demoText}>
          {isLocked
            ? 'Breaking this Pig is simulated. No Stripe payment or real-money transfer will occur.'
            : 'This Pig is stored locally as history. Its protected amount is available in Safe to Spend.'}
        </Text>
      </View>

      {isLocked ? (
        <Pressable
          accessibilityRole="button"
          onPress={handleBreak}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}
        >
          <Ionicons color={colors.danger} name="hammer-outline" size={18} />
          <Text style={styles.deleteText}>Break Pig Early</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={handleDelete}
          style={({ pressed }) => [styles.historyDeleteButton, pressed && styles.deletePressed]}
        >
          <Ionicons color={colors.muted} name="trash-outline" size={18} />
          <Text style={styles.historyDeleteText}>Delete from history</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  showcase: { alignItems: 'center', alignSelf: 'center', height: 220, justifyContent: 'flex-end', width: '100%' },
  showcaseHalo: { backgroundColor: '#F3EACF', borderRadius: 90, height: 180, position: 'absolute', top: 0, width: 180 },
  pigImage: { height: 178, marginBottom: -17, width: 205, zIndex: 3 },
  pedestalTop: { backgroundColor: '#E5C56D', borderColor: '#B88C32', borderRadius: 999, borderWidth: 3, height: 28, width: 210, zIndex: 2 },
  pedestalBase: { backgroundColor: colors.ink, height: 30, marginTop: -8, width: 170 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.7, marginTop: spacing.md },
  muted: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 4 },
  statusBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: 10, flexDirection: 'row', gap: 5, marginTop: spacing.sm, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  brokenStatusBadge: { backgroundColor: '#F5E7DE' },
  brokenStatusText: { color: '#A86445' },
  goalCard: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  cardLabel: { color: '#AAB4AA', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  amount: { color: colors.white, fontSize: 38, fontWeight: '800', letterSpacing: -1, marginTop: 6 },
  lockRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  lockText: { color: '#C7D0C7', fontSize: 12, fontWeight: '600' },
  timelineCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, marginTop: spacing.lg, padding: spacing.lg },
  timelineHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  timelineLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  timelinePercent: { color: colors.ink, fontSize: 28, fontWeight: '900', marginTop: 2 },
  daysBadge: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 14, minWidth: 72, paddingHorizontal: 12, paddingVertical: 8 },
  daysValue: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  daysLabel: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  timelineDates: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  timelineDateText: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  detailsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  detailRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 72 },
  detailIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 11, height: 38, justifyContent: 'center', width: 38 },
  detailDivider: { backgroundColor: colors.border, height: 1 },
  statLabel: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  statValue: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  demoBox: { alignItems: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: 16, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md },
  demoText: { color: colors.ink, flex: 1, fontSize: 13, lineHeight: 19 },
  deleteButton: { alignItems: 'center', borderColor: '#E7CACA', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.lg, minHeight: 52 },
  deletePressed: { backgroundColor: '#F8ECEC' },
  deleteText: { color: colors.danger, fontSize: 14, fontWeight: '800' },
  historyDeleteButton: { alignItems: 'center', borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.lg, minHeight: 52 },
  historyDeleteText: { color: colors.muted, fontSize: 14, fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', marginTop: spacing.md },
});
