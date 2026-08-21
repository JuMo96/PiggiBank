import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ErrorNotice } from '@/components/ErrorNotice';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { formatCurrency } from '@/domain/savings';
import { useSavingsOverview } from '@/hooks/useSavingsOverview';
import { useAuth } from '@/state/AuthProvider';
import { usePiggi } from '@/state/PiggiProvider';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

const MAX_DEMO_BALANCE = 999_999_999_999.99;

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const { protectedMoney } = useSavingsOverview();
  const {
    bankBalance,
    hasLoadedData,
    isHydrated,
    loadError,
    refreshData,
    updateMockBankBalance,
  } = usePiggi();
  const [balanceInput, setBalanceInput] = useState(() => formatEditableAmount(bankBalance));
  const [isBalanceDirty, setIsBalanceDirty] = useState(false);
  const [isSavingBalance, setIsSavingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceSuccess, setBalanceSuccess] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBalanceDirty && !isSavingBalance) {
      setBalanceInput(formatEditableAmount(bankBalance));
    }
  }, [bankBalance, isBalanceDirty, isSavingBalance]);

  const handleSignOut = async () => {
    if (isSigningOut || isSavingBalance) return;

    setSignOutError(null);
    setIsSigningOut(true);

    try {
      const result = await signOut();
      if (!result.success) {
        setSignOutError(result.error);
      }
    } catch {
      setSignOutError('We could not sign you out. Check your connection and try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!isHydrated || (!hasLoadedData && !loadError)) {
    return (
      <Screen>
        <View accessibilityLiveRegion="polite" style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your Piggi account…</Text>
          <SignOutControl
            error={signOutError}
            isDisabled={isSavingBalance}
            isSigningOut={isSigningOut}
            onPress={() => void handleSignOut()}
          />
        </View>
      </Screen>
    );
  }

  if (loadError && !hasLoadedData) {
    return (
      <Screen>
        <View style={styles.loadErrorState}>
          <ErrorNotice
            message={loadError}
            onRetry={() => void refreshData()}
            title="Couldn’t load your settings"
          />
          <SignOutControl
            error={signOutError}
            isDisabled={isSavingBalance}
            isSigningOut={isSigningOut}
            onPress={() => void handleSignOut()}
          />
        </View>
      </Screen>
    );
  }

  const handleBalanceChange = (value: string) => {
    setBalanceInput(value);
    setIsBalanceDirty(true);
    setBalanceError(null);
    setBalanceSuccess(null);
  };

  const handleSaveBalance = async () => {
    if (isSavingBalance || isSigningOut) return;

    const validation = validateDemoBalance(balanceInput, protectedMoney);
    if (!validation.ok) {
      setBalanceError(validation.error);
      setBalanceSuccess(null);
      return;
    }

    Keyboard.dismiss();
    setBalanceError(null);
    setBalanceSuccess(null);
    setIsSavingBalance(true);

    try {
      const result = await updateMockBankBalance(validation.balance);
      if (!result.ok) {
        setBalanceError(result.error);
        return;
      }

      setBalanceInput(formatEditableAmount(validation.balance));
      setIsBalanceDirty(false);
      setBalanceSuccess('Your demo balance is saved to the cloud.');
    } catch {
      setBalanceError('We could not save your demo balance. Check your connection and try again.');
    } finally {
      setIsSavingBalance(false);
    }
  };

  return (
    <Screen>
      <View style={styles.heroIcon}>
        <Text accessibilityElementsHidden style={styles.heroEmoji}>🐷</Text>
      </View>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Your Piggi account and cloud-saved demo balance.</Text>

      {loadError ? (
        <View style={styles.staleDataNotice}>
          <ErrorNotice
            message={loadError}
            onRetry={() => void refreshData()}
            title="Showing your last loaded settings"
          />
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.card}>
        <View style={styles.accountRow}>
          <View style={styles.accountIcon}>
            <Ionicons color={colors.primary} name="person-outline" size={22} />
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountLabel}>Signed in as</Text>
            <Text numberOfLines={2} selectable style={styles.accountEmail}>
              {user?.email ?? 'Piggi account'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>DEMO FINANCES</Text>
      <View style={styles.formCard}>
        <View style={styles.formHeadingRow}>
          <View style={styles.cloudIcon}>
            <Ionicons color={colors.safe} name="cloud-done-outline" size={21} />
          </View>
          <View style={styles.formHeadingCopy}>
            <Text style={styles.formTitle}>Demo bank balance</Text>
            <Text style={styles.formDescription}>Cloud-saved practice data, never real funds.</Text>
          </View>
        </View>

        <Text style={styles.inputLabel}>CURRENT DEMO BALANCE</Text>
        <View style={[styles.amountField, balanceError && styles.amountFieldError]}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            accessibilityHint="Enter a nonnegative dollar amount with up to two decimal places."
            accessibilityLabel="Demo bank balance"
            editable={!isSavingBalance && !isSigningOut}
            inputMode="decimal"
            keyboardType="decimal-pad"
            maxLength={18}
            onChangeText={handleBalanceChange}
            onSubmitEditing={() => void handleSaveBalance()}
            placeholder="6840.00"
            placeholderTextColor={colors.placeholder}
            returnKeyType="done"
            selectTextOnFocus
            style={styles.amountInput}
            value={balanceInput}
          />
        </View>

        {balanceError ? (
          <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.errorText}>
            {balanceError}
          </Text>
        ) : null}
        {balanceSuccess ? (
          <View accessibilityLiveRegion="polite" style={styles.successRow}>
            <Ionicons color={colors.safe} name="checkmark-circle" size={18} />
            <Text style={styles.successText}>{balanceSuccess}</Text>
          </View>
        ) : null}

        <View style={styles.saveButton}>
          <PrimaryButton
            accessibilityHint="Saves this demo balance to your Piggi account."
            disabled={!isBalanceDirty || isSigningOut}
            icon="cloud-upload-outline"
            isLoading={isSavingBalance}
            label="Save Demo Balance"
            onPress={() => void handleSaveBalance()}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>ABOUT PIGGI</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data source</Text>
          <Text style={styles.infoValue}>Supabase cloud</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.safetyNote}>
        <Ionicons color={colors.safe} name="shield-checkmark-outline" size={22} />
        <Text style={styles.safetyText}>No bank accounts, payment providers, or real funds are connected.</Text>
      </View>

      <SignOutControl
        error={signOutError}
        isDisabled={isSavingBalance}
        isSigningOut={isSigningOut}
        onPress={() => void handleSignOut()}
      />
    </Screen>
  );
}

type SignOutControlProps = {
  error: string | null;
  isDisabled: boolean;
  isSigningOut: boolean;
  onPress: () => void;
};

function SignOutControl({
  error,
  isDisabled,
  isSigningOut,
  onPress,
}: SignOutControlProps) {
  const disabled = isDisabled || isSigningOut;

  return (
    <>
      <Pressable
        accessibilityLabel="Sign out of Piggi"
        accessibilityRole="button"
        accessibilityState={{ busy: isSigningOut, disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.signOutButton,
          disabled && styles.buttonDisabled,
          pressed && !disabled && styles.buttonPressed,
        ]}
      >
        {isSigningOut
          ? <ActivityIndicator color={colors.danger} size="small" />
          : <Ionicons color={colors.danger} name="log-out-outline" size={21} />}
        <Text style={styles.signOutLabel}>{isSigningOut ? 'Signing Out…' : 'Sign Out'}</Text>
      </Pressable>
      {error ? (
        <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.signOutError}>
          {error}
        </Text>
      ) : null}
    </>
  );
}

type DemoBalanceValidation =
  | { balance: number; ok: true }
  | { error: string; ok: false };

function validateDemoBalance(value: string, protectedMoney: number): DemoBalanceValidation {
  const normalizedValue = value.replace(/[$,\s]/g, '');

  if (!normalizedValue) {
    return { error: 'Enter a demo bank balance.', ok: false };
  }

  if (!/^(?:\d+|\d*\.\d{1,2})$/.test(normalizedValue)) {
    return { error: 'Enter a valid amount with up to two decimal places.', ok: false };
  }

  const balance = Number(normalizedValue);
  if (!Number.isFinite(balance) || balance < 0) {
    return { error: 'Enter a demo balance of $0 or more.', ok: false };
  }

  if (balance > MAX_DEMO_BALANCE) {
    return { error: 'Enter a demo balance below $1 trillion.', ok: false };
  }

  if (balance < protectedMoney) {
    return {
      error: `Keep at least ${formatCurrency(protectedMoney)} while that money is protected.`,
      ok: false,
    };
  }

  return { balance: Math.round((balance + Number.EPSILON) * 100) / 100, ok: true };
}

function formatEditableAmount(value: number) {
  return value.toFixed(2);
}

const styles = StyleSheet.create({
  heroIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 22, height: 64, justifyContent: 'center', width: 64 },
  heroEmoji: { fontSize: 34 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.7, marginTop: spacing.md },
  subtitle: { color: colors.muted, fontSize: fontSizes.body, lineHeight: 22, marginTop: spacing.sm },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden', paddingHorizontal: spacing.md },
  accountRow: { alignItems: 'center', flexDirection: 'row', minHeight: 78, paddingVertical: spacing.smd },
  accountIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 16, height: 48, justifyContent: 'center', width: 48 },
  accountCopy: { flex: 1, marginLeft: spacing.md },
  accountLabel: { color: colors.muted, fontSize: fontSizes.secondary, fontWeight: '600' },
  accountEmail: { color: colors.ink, fontSize: fontSizes.body, fontWeight: '800', lineHeight: 21, marginTop: 2 },
  formCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, padding: spacing.md },
  formHeadingRow: { alignItems: 'center', flexDirection: 'row' },
  cloudIcon: { alignItems: 'center', backgroundColor: colors.safeSoft, borderRadius: 14, height: 44, justifyContent: 'center', width: 44 },
  formHeadingCopy: { flex: 1, marginLeft: spacing.smd },
  formTitle: { color: colors.ink, fontSize: fontSizes.body, fontWeight: '800' },
  formDescription: { color: colors.muted, fontSize: fontSizes.secondary, lineHeight: 18, marginTop: 2 },
  inputLabel: { color: colors.muted, fontSize: fontSizes.caption, fontWeight: '900', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.lg },
  amountField: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1.5, flexDirection: 'row', minHeight: 60, paddingHorizontal: spacing.md },
  amountFieldError: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  currencySymbol: { color: colors.ink, fontSize: 24, fontWeight: '800', marginRight: spacing.sm },
  amountInput: { color: colors.ink, flex: 1, fontSize: 24, fontWeight: '800', minHeight: 56, paddingVertical: 0 },
  errorText: { color: colors.danger, fontSize: fontSizes.secondary, lineHeight: 18, marginTop: spacing.sm },
  successRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  successText: { color: colors.safe, flex: 1, fontSize: fontSizes.secondary, fontWeight: '700', lineHeight: 18 },
  saveButton: { marginTop: spacing.md },
  divider: { backgroundColor: colors.border, height: 1 },
  sectionLabel: { color: colors.primary, fontSize: fontSizes.caption, fontWeight: '900', letterSpacing: 1.1, marginBottom: spacing.sm, marginTop: spacing.xl },
  infoRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 56 },
  infoLabel: { color: colors.ink, fontSize: fontSizes.body, fontWeight: '600' },
  infoValue: { color: colors.muted, fontSize: 14, marginLeft: spacing.md },
  safetyNote: { alignItems: 'center', backgroundColor: colors.safeSoft, borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md },
  safetyText: { color: colors.muted, flex: 1, fontSize: 12, lineHeight: 18 },
  signOutButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.danger, borderRadius: radii.md, borderWidth: 1.5, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.xl, minHeight: 54, paddingHorizontal: spacing.lg },
  signOutLabel: { color: colors.danger, fontSize: fontSizes.body, fontWeight: '800' },
  signOutError: { color: colors.danger, fontSize: fontSizes.secondary, lineHeight: 18, marginTop: spacing.sm, textAlign: 'center' },
  buttonDisabled: { opacity: 0.52 },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  loadingState: { alignItems: 'center', justifyContent: 'center', minHeight: 430 },
  loadingText: { color: colors.muted, fontSize: fontSizes.body, marginTop: spacing.md },
  loadErrorState: { flex: 1, justifyContent: 'center', minHeight: 430 },
  staleDataNotice: { marginTop: spacing.lg },
});
