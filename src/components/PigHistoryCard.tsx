import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPigDate, getPigStatusLabel } from '@/domain/pigs';
import { formatCurrency } from '@/domain/savings';
import { Pig } from '@/models/pig';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type PigHistoryCardProps = {
  onPress: () => void;
  pig: Pig;
};

export function PigHistoryCard({ onPress, pig }: PigHistoryCardProps) {
  const completed = pig.status === 'completed';

  return (
    <Pressable
      accessibilityHint="Opens this Pig’s history details"
      accessibilityLabel={`${pig.name}, ${getPigStatusLabel(pig)}, ${formatCurrency(pig.protectedAmount)} released`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        completed ? styles.completedCard : styles.brokenCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, completed ? styles.completedIcon : styles.brokenIcon]}>
        <Ionicons
          color={completed ? colors.completed : colors.broken}
          name={completed ? 'checkmark-circle-outline' : 'hammer-outline'}
          size={22}
        />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>{pig.name}</Text>
        <Text style={styles.meta}>
          {getPigStatusLabel(pig)} · {formatPigDate(pig.closedAt ?? pig.unlockDate)}
        </Text>
      </View>
      <View style={styles.amountWrap}>
        <Text style={styles.amount}>{formatCurrency(pig.protectedAmount)}</Text>
        <Text style={styles.released}>released</Text>
      </View>
      <Ionicons color={colors.placeholder} name="chevron-forward" size={17} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 72, padding: 13 },
  completedCard: { backgroundColor: colors.completedSoft, borderColor: '#CCE5D8' },
  brokenCard: { backgroundColor: colors.brokenSoft, borderColor: '#E8D8D0' },
  pressed: { opacity: 0.7 },
  icon: { alignItems: 'center', borderRadius: 13, height: 44, justifyContent: 'center', width: 44 },
  completedIcon: { backgroundColor: colors.surface },
  brokenIcon: { backgroundColor: colors.surface },
  copy: { flex: 1 },
  name: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  amountWrap: { alignItems: 'flex-end' },
  amount: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  released: { color: colors.muted, fontSize: 10, marginTop: 2 },
});
