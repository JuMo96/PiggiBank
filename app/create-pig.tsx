import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DatePickerField, getTomorrowIsoDate } from '@/components/DatePickerField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { calculateRemainingSafeToSpend, formatCurrency } from '@/domain/savings';
import { useCreatePigForm } from '@/hooks/useCreatePigForm';
import { useSavingsOverview } from '@/hooks/useSavingsOverview';
import { notifySelection, notifySuccess } from '@/services/feedback';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function CreatePigScreen() {
  const { form, error, setField, submit } = useCreatePigForm();
  const { safeToSpend } = useSavingsOverview();
  const amountInputRef = useRef<TextInput>(null);
  const submissionStartedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const numericAmount = Number(form.amount.replace(/[$,\s]/g, ''));
  const hasAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const remainingSafeToSpend = calculateRemainingSafeToSpend(safeToSpend, numericAmount);
  const amountPresets = getAmountPresets(safeToSpend);

  const chooseAmount = (amount: number) => {
    notifySelection();
    setField('amount', String(amount));
  };

  const handleSubmit = () => {
    if (submissionStartedRef.current) return;
    submissionStartedRef.current = true;
    setIsSubmitting(true);

    const pig = submit();
    if (!pig) {
      submissionStartedRef.current = false;
      setIsSubmitting(false);
      return;
    }
    notifySuccess();
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
          <Text style={styles.availableLabel}>
            {hasAmount ? 'SAFE TO SPEND AFTER' : 'AVAILABLE TO PROTECT'}
          </Text>
          <Text style={styles.availableAmount}>
            {formatCurrency(hasAmount ? remainingSafeToSpend : safeToSpend)}
          </Text>
        </View>
        <View style={styles.previewIcon}>
          <Ionicons color={colors.primary} name={hasAmount ? 'shield-checkmark' : 'wallet-outline'} size={22} />
        </View>
      </View>

      <Text style={styles.label}>Pig name</Text>
      <TextInput
        accessibilityLabel="Pig name"
        autoCapitalize="sentences"
        blurOnSubmit={false}
        maxLength={40}
        onChangeText={(value) => setField('name', value)}
        onSubmitEditing={() => amountInputRef.current?.focus()}
        placeholder="e.g. Summer trip"
        placeholderTextColor={colors.placeholder}
        returnKeyType="next"
        style={styles.input}
        value={form.name}
      />

      <Text style={styles.label}>Amount to protect</Text>
      <View style={styles.moneyInput}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          accessibilityLabel="Amount to protect"
          keyboardType="decimal-pad"
          maxLength={12}
          onChangeText={(value) => setField('amount', value)}
          placeholder="0"
          placeholderTextColor={colors.placeholder}
          ref={amountInputRef}
          style={styles.amountInput}
          value={form.amount}
        />
      </View>
      <View accessibilityRole="radiogroup" style={styles.amountPresets}>
        {amountPresets.map((preset) => {
          const isSelected = numericAmount === preset.amount;
          return (
            <Pressable
              accessibilityLabel={preset.accessibilityLabel}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              key={preset.label}
              onPress={() => chooseAmount(preset.amount)}
              style={({ pressed }) => [
                styles.amountPreset,
                isSelected && styles.amountPresetSelected,
                pressed && styles.presetPressed,
              ]}
            >
              <Text style={[styles.amountPresetText, isSelected && styles.amountPresetTextSelected]}>
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Unlock date</Text>
      <DatePickerField
        minimumDate={getTomorrowIsoDate()}
        onChange={(value) => setField('unlockDate', value)}
        value={form.unlockDate}
      />

      {error ? (
        <View accessibilityLiveRegion="assertive" accessibilityRole="alert" style={styles.errorBox}>
          <Ionicons color={colors.danger} name="alert-circle" size={18} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
      <PrimaryButton
        accessibilityHint="Creates this Pig and returns to your Piggy Banks"
        isLoading={isSubmitting}
        label={isSubmitting ? 'Creating Pig…' : 'Create my Pig'}
        onPress={handleSubmit}
      />
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
  previewIcon: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
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
  amountPresets: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, marginTop: spacing.sm },
  amountPreset: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 42, paddingHorizontal: 6 },
  amountPresetSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  amountPresetText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  amountPresetTextSelected: { color: colors.primary },
  presetPressed: { opacity: 0.7 },
  errorBox: { alignItems: 'flex-start', backgroundColor: '#F9EAEA', borderColor: '#EBCACA', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, padding: 12 },
  error: { color: colors.danger, flex: 1, fontSize: 13, lineHeight: 18 },
  note: { color: colors.muted, fontSize: 12, marginTop: spacing.md, textAlign: 'center' },
});

function getAmountPresets(safeToSpend: number) {
  const standardAmounts = [25, 50, 100].filter((amount) => amount < safeToSpend);
  return [
    ...standardAmounts.map((amount) => ({
      accessibilityLabel: `Protect ${formatCurrency(amount)}`,
      amount,
      label: `$${amount}`,
    })),
    {
      accessibilityLabel: `Protect the maximum, ${formatCurrency(safeToSpend)}`,
      amount: safeToSpend,
      label: 'Max',
    },
  ];
}
