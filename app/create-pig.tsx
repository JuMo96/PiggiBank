import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DatePickerField, getTomorrowIsoDate } from '@/components/DatePickerField';
import { PigAvatar } from '@/components/PigAvatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { formatPigDate } from '@/domain/pigs';
import { calculateRemainingSafeToSpend, formatCurrency } from '@/domain/savings';
import { useCreatePigForm } from '@/hooks/useCreatePigForm';
import { useSavingsOverview } from '@/hooks/useSavingsOverview';
import { notifySelection, notifySuccess } from '@/services/feedback';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

type FocusedField = 'amount' | 'name' | null;

export default function CreatePigScreen() {
  const { errors, form, setField, submit } = useCreatePigForm();
  const { safeToSpend } = useSavingsOverview();
  const amountInputRef = useRef<TextInput>(null);
  const submissionStartedRef = useRef(false);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const numericAmount = Number(form.amount.replace(/[$,\s]/g, ''));
  const hasValidAmount = Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= safeToSpend;
  const hasPreview = hasValidAmount && Boolean(form.unlockDate);
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
      <View style={styles.hero}>
        <PigAvatar accessibilityLabel="A cheerful Piggi ready for a new goal" size="compact" />
        <Text style={styles.title}>Create a new Pig</Text>
        <Text style={styles.subtitle}>One amount. One date. One promise to yourself.</Text>
      </View>

      <View style={styles.availablePill}>
        <Ionicons color={colors.safe} name="wallet" size={16} />
        <Text style={styles.availableLabel}>Safe to Spend</Text>
        <Text style={styles.availableValue}>{formatCurrency(safeToSpend)}</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>What are you saving for?</Text>
          <TextInput
            accessibilityLabel="Pig name"
            autoCapitalize="sentences"
            blurOnSubmit={false}
            maxLength={40}
            onBlur={() => setFocusedField(null)}
            onChangeText={(value) => setField('name', value)}
            onFocus={() => setFocusedField('name')}
            onSubmitEditing={() => amountInputRef.current?.focus()}
            placeholder="Japan trip"
            placeholderTextColor={colors.placeholder}
            returnKeyType="next"
            style={[
              styles.input,
              focusedField === 'name' && styles.inputFocused,
              errors.name && styles.inputError,
            ]}
            value={form.name}
          />
          <FieldError message={errors.name} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>How much do you want to protect?</Text>
          <View style={[
            styles.moneyInput,
            focusedField === 'amount' && styles.inputFocused,
            errors.amount && styles.inputError,
          ]}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              accessibilityLabel="Amount to protect"
              keyboardType="decimal-pad"
              maxLength={12}
              onBlur={() => setFocusedField(null)}
              onChangeText={(value) => setField('amount', value)}
              onFocus={() => setFocusedField('amount')}
              placeholder="500"
              placeholderTextColor={colors.placeholder}
              ref={amountInputRef}
              style={styles.amountInput}
              value={form.amount}
            />
          </View>
          <FieldError message={errors.amount} />
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
        </View>

        <View style={styles.fieldGroupLast}>
          <Text style={styles.label}>When can you open it?</Text>
          <DatePickerField
            hasError={Boolean(errors.unlockDate)}
            minimumDate={getTomorrowIsoDate()}
            onChange={(value) => setField('unlockDate', value)}
            value={form.unlockDate}
          />
          <FieldError message={errors.unlockDate} />
        </View>
      </View>

      {hasPreview ? (
        <View accessibilityLiveRegion="polite" style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons color={colors.primary} name="lock-closed" size={18} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryText}>
              {formatCurrency(numericAmount)} will be protected until {formatPigDate(form.unlockDate)}.
            </Text>
            <Text style={styles.summarySecondary}>
              {formatCurrency(remainingSafeToSpend)} will remain Safe to Spend.
            </Text>
          </View>
        </View>
      ) : null}

      <FieldError message={errors.form} prominent />
      <PrimaryButton
        accessibilityHint="Creates this Pig and returns to Your Pigs"
        isLoading={isSubmitting}
        label={isSubmitting ? 'Creating Pig…' : 'Create Pig'}
        onPress={handleSubmit}
      />
      <Text style={styles.note}>Demo money only. No bank account or payment is connected.</Text>
    </Screen>
  );
}

type FieldErrorProps = {
  message?: string;
  prominent?: boolean;
};

function FieldError({ message, prominent = false }: FieldErrorProps) {
  if (!message) return null;

  return (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={[styles.errorRow, prominent && styles.prominentError]}
    >
      <Ionicons color={colors.danger} name="alert-circle" size={16} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

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

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.8, marginTop: spacing.smd, textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: fontSizes.body, lineHeight: 21, marginTop: spacing.sm, textAlign: 'center' },
  availablePill: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.safeSoft, borderRadius: radii.pill, flexDirection: 'row', gap: 6, marginBottom: spacing.lg, paddingHorizontal: spacing.smd, paddingVertical: 9 },
  availableLabel: { color: colors.safe, fontSize: fontSizes.caption, fontWeight: '700' },
  availableValue: { color: colors.safe, fontSize: fontSizes.secondary, fontWeight: '900' },
  formCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, padding: spacing.lg },
  fieldGroup: { marginBottom: spacing.xl },
  fieldGroupLast: { marginBottom: 0 },
  label: { color: colors.ink, fontSize: fontSizes.body, fontWeight: '800', marginBottom: spacing.sm },
  input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, color: colors.ink, fontSize: 16, minHeight: 56, paddingHorizontal: spacing.md, paddingVertical: 14 },
  moneyInput: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', minHeight: 56, paddingHorizontal: spacing.md },
  inputFocused: { borderColor: colors.primary, borderWidth: 2 },
  inputError: { borderColor: colors.danger },
  currency: { color: colors.primary, fontSize: 23, fontWeight: '900' },
  amountInput: { color: colors.ink, flex: 1, fontSize: 23, fontWeight: '800', paddingVertical: 13 },
  amountPresets: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.smd },
  amountPreset: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 4 },
  amountPresetSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  amountPresetText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  amountPresetTextSelected: { color: colors.primary },
  presetPressed: { opacity: 0.68 },
  summaryCard: { alignItems: 'flex-start', backgroundColor: colors.surfacePink, borderColor: '#F0C8D4', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.smd, marginVertical: spacing.lg, padding: spacing.md },
  summaryIcon: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  summaryCopy: { flex: 1 },
  summaryText: { color: colors.ink, fontSize: fontSizes.secondary, fontWeight: '700', lineHeight: 19 },
  summarySecondary: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  errorRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 6, marginTop: spacing.sm },
  prominentError: { backgroundColor: colors.dangerSoft, borderRadius: radii.sm, marginBottom: spacing.md, padding: spacing.smd },
  errorText: { color: colors.danger, flex: 1, fontSize: 12, lineHeight: 17 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing.smd, textAlign: 'center' },
});
