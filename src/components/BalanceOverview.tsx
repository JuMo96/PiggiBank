import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@/domain/savings';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type BalanceOverviewProps = {
  bankBalance: number;
  protectedMoney: number;
  safeToSpend: number;
};

export function BalanceOverview({ bankBalance, protectedMoney, safeToSpend }: BalanceOverviewProps) {
  return (
    <View style={styles.card}>
      <View style={styles.balanceHeader}>
        <Text style={styles.label}>CURRENT BANK BALANCE</Text>
        <View style={styles.mockBadge}><Text style={styles.mockText}>MOCK</Text></View>
      </View>
      <Text style={styles.balance}>{formatCurrency(bankBalance)}</Text>
      <View style={styles.rule} />
      <View style={styles.stats}>
        <View style={styles.stat}>
          <View style={styles.statLabelRow}>
            <Ionicons color={colors.pink} name="lock-closed" size={14} />
            <Text style={styles.statLabel}>Protected</Text>
          </View>
          <Text style={styles.statValue}>{formatCurrency(protectedMoney)}</Text>
        </View>
        <View style={styles.verticalRule} />
        <View style={styles.stat}>
          <View style={styles.statLabelRow}>
            <Ionicons color={colors.mint} name="wallet" size={14} />
            <Text style={styles.statLabel}>Safe to Spend</Text>
          </View>
          <Text style={styles.statValue}>{formatCurrency(safeToSpend)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.ink, borderRadius: 26, padding: spacing.lg },
  balanceHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#AAB4AA', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  mockBadge: { backgroundColor: '#324039', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  mockText: { color: '#C7D0C7', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  balance: { color: colors.white, fontSize: 40, fontWeight: '800', letterSpacing: -1.2, marginTop: spacing.sm },
  rule: { backgroundColor: '#36423C', height: 1, marginVertical: spacing.lg },
  stats: { flexDirection: 'row' },
  stat: { flex: 1 },
  statLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  statLabel: { color: '#AAB4AA', fontSize: 12, fontWeight: '600' },
  statValue: { color: colors.white, fontSize: 19, fontWeight: '800', marginTop: 6 },
  verticalRule: { backgroundColor: '#36423C', marginHorizontal: spacing.md, width: 1 },
});
