import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { DatePickerField, getTomorrowIsoDate } from '@/components/DatePickerField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { formatCurrency } from '@/domain/savings';
import { useCreatePigForm } from '@/hooks/useCreatePigForm';
import { useSavingsOverview } from '@/hooks/useSavingsOverview';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function CreatePigScreen() {
  const { form, error, setField, submit } = useCreatePigForm();
  const { safeToSpend } = useSavingsOverview();

  const handleSubmit = () => {
    const pig = submit();
    if (!pig) return;
    router.dismissTo('/');
  };

  return (
    <Screen>
      <View style={styles.heroIcon}>
        <Ionicons color={colors.primary} name="sparkles" size={28} />
      </View>
      <Text style={styles.title}>Protect money with a Pig</Text>
      <Text style={styles.subtitle}>
        Set an amount aside until a date you choose. This demo uses mock money only.
      </Text>

      <View style={styles.availableCard}>
        <View>
          <Text style={styles.availableLabel}>AVAILABLE TO PROTECT</Text>
          <Text style={styles.availableAmount}>{formatCurrency(safeToSpend)}</Text>
        </View>
        <Ionicons color={colors.primary} name="wallet-outline" size={24} />
      </View>

      <Text style={styles.label}>Pig name</Text>
      <TextInput
        onChangeText={(value) => setField('name', value)}
        placeholder="e.g. Summer trip"
        placeholderTextColor={colors.placeholder}
        style={styles.input}
        value={form.name}
      />

      <Text style={styles.label}>Amount to protect</Text>
      <View style={styles.moneyInput}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={(value) => setField('amount', value)}
          placeholder="0"
          placeholderTextColor={colors.placeholder}
          style={styles.amountInput}
          value={form.amount}
        />
      </View>

      <Text style={styles.label}>Unlock date</Text>
      <DatePickerField
        minimumDate={getTomorrowIsoDate()}
        onChange={(value) => setField('unlockDate', value)}
        value={form.unlockDate}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Create my Pig" onPress={handleSubmit} />
      <Text style={styles.note}>Your mock bank balance stays the same; Piggi only changes how it is allocated.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroIcon: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 24,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 64,
  },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center' },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  availableCard: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    padding: spacing.md,
  },
  availableLabel: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  availableAmount: { color: colors.ink, fontSize: 22, fontWeight: '800', marginTop: 4 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
  },
  moneyInput: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  currency: { color: colors.muted, fontSize: 22, fontWeight: '700' },
  amountInput: { color: colors.ink, flex: 1, fontSize: 22, fontWeight: '700', paddingVertical: 14 },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.md },
  note: { color: colors.muted, fontSize: 12, marginTop: spacing.md, textAlign: 'center' },
});
