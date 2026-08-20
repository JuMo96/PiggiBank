import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPigDate, getPigStatusLabel } from '@/domain/pigs';
import { formatCurrency } from '@/domain/savings';
import { Pig } from '@/models/pig';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type PigHistoryCardProps = {
  onPress: () => void;
  pig: Pig;
};

export function PigHistoryCard({ onPress, pig }: PigHistoryCardProps) {
  const completed = pig.status === 'completed';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.icon, completed ? styles.completedIcon : styles.brokenIcon]}>
        <Ionicons
          color={completed ? colors.primary : '#A86445'}
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
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: 13 },
  pressed: { opacity: 0.7 },
  icon: { alignItems: 'center', borderRadius: 13, height: 44, justifyContent: 'center', width: 44 },
  completedIcon: { backgroundColor: colors.primarySoft },
  brokenIcon: { backgroundColor: '#F5E7DE' },
  copy: { flex: 1 },
  name: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 10, marginTop: 4 },
  amountWrap: { alignItems: 'flex-end' },
  amount: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  released: { color: colors.muted, fontSize: 9, marginTop: 2 },
});
