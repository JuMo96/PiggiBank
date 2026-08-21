import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@/domain/savings';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

type BalanceOverviewProps = {
  bankBalance: number;
  protectedMoney: number;
  safeToSpend: number;
};

export function BalanceOverview({ bankBalance, protectedMoney, safeToSpend }: BalanceOverviewProps) {
  return (
    <View
      accessibilityLabel={`Safe to Spend ${formatCurrency(safeToSpend)}. Current balance ${formatCurrency(bankBalance)}. Protected ${formatCurrency(protectedMoney)}.`}
      accessible
      style={styles.card}
    >
      <View style={styles.decorativeCircleLarge} />
      <View style={styles.decorativeCircleSmall} />

      <View style={styles.topRow}>
        <View style={styles.safeLabel}>
          <Ionicons color={colors.safe} name="wallet" size={15} />
          <Text style={styles.safeLabelText}>SAFE TO SPEND</Text>
        </View>
        <View style={styles.mockBadge}>
          <Text style={styles.mockText}>DEMO</Text>
        </View>
      </View>

      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={styles.safeAmount}
      >
        {formatCurrency(safeToSpend)}
      </Text>
      <Text style={styles.helper}>This is what’s free after your Pig is protected.</Text>

      <View style={styles.secondaryRow}>
        <BalanceStat icon="card-outline" label="Current Balance" value={bankBalance} />
        <View style={styles.divider} />
        <BalanceStat icon="lock-closed" label="Protected" value={protectedMoney} />
      </View>
    </View>
  );
}

type BalanceStatProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
};

function BalanceStat({ icon, label, value }: BalanceStatProps) {
  return (
    <View style={styles.stat}>
      <View style={styles.statLabelRow}>
        <Ionicons color={colors.muted} name={icon} size={14} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={styles.statValue}>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.safeSoft, borderColor: '#CFE7DB', borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden', padding: spacing.lg },
  decorativeCircleLarge: { backgroundColor: '#D4EBDD', borderRadius: radii.pill, height: 150, opacity: 0.58, position: 'absolute', right: -58, top: -70, width: 150 },
  decorativeCircleSmall: { backgroundColor: colors.primarySoft, borderRadius: radii.pill, bottom: 66, height: 58, left: -28, opacity: 0.72, position: 'absolute', width: 58 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  safeLabel: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  safeLabelText: { color: colors.safe, fontSize: fontSizes.caption, fontWeight: '900', letterSpacing: 1.05 },
  mockBadge: { backgroundColor: colors.white, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 5 },
  mockText: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  safeAmount: { color: colors.ink, fontSize: fontSizes.balance, fontWeight: '900', letterSpacing: -1.7, marginTop: spacing.sm },
  helper: { color: colors.safe, fontSize: fontSizes.secondary, lineHeight: 18, marginTop: spacing.xs },
  secondaryRow: { backgroundColor: colors.white, borderRadius: radii.md, flexDirection: 'row', marginTop: spacing.lg, padding: spacing.md },
  stat: { flex: 1, minWidth: 0 },
  statLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  statLabel: { color: colors.muted, fontSize: fontSizes.caption, fontWeight: '700' },
  statValue: { color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.35, marginTop: 6 },
  divider: { backgroundColor: colors.border, marginHorizontal: spacing.md, width: 1 },
});
