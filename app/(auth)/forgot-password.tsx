import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { AuthMessage } from '@/components/auth/AuthMessage';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { AuthTextLink } from '@/components/auth/AuthTextLink';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  hasAuthFieldErrors,
  normalizeEmail,
  validateSignInFields,
} from '@/domain/authValidation';
import { useResendCooldown } from '@/hooks/useResendCooldown';
import { useAuth } from '@/state/AuthProvider';
import { colors } from '@/theme/colors';
import { fontSizes } from '@/theme/spacing';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [emailError, setEmailError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [hasSent, setHasSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCoolingDown, secondsRemaining, startCooldown } = useResendCooldown();

  const submit = async () => {
    if (isSubmitting || isCoolingDown) return;
    const validation = validateSignInFields(email, 'placeholder');
    setEmailError(validation.email);
    setFormError(null);
    if (hasAuthFieldErrors(validation)) return;

    setIsSubmitting(true);
    const result = await requestPasswordReset(email);
    setIsSubmitting(false);
    if (!result.success) {
      setFormError(result.error);
      return;
    }

    setEmail(normalizeEmail(email));
    setHasSent(true);
    startCooldown();
  };

  const buttonLabel = hasSent
    ? isCoolingDown
      ? `Send again in ${secondsRemaining}s`
      : 'Send Another Link'
    : 'Send Reset Link';

  return (
    <AuthScreenShell
      footer={<AuthTextLink disabled={isSubmitting} label="Back to Sign In" onPress={() => router.back()} />}
      subtitle="Enter your email and we’ll send a secure link to choose a new password."
      title="Reset your password"
    >
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        editable={!isSubmitting}
        error={emailError}
        keyboardType="email-address"
        label="Email"
        onChangeText={(value) => {
          setEmail(value);
          setEmailError(undefined);
          setFormError(null);
        }}
        onSubmitEditing={() => void submit()}
        placeholder="you@example.com"
        returnKeyType="send"
        textContentType="emailAddress"
        value={email}
      />
      {hasSent ? (
        <AuthMessage message="If a Piggi account exists for this email, we sent a password reset link." />
      ) : null}
      {formError ? <AuthMessage message={formError} tone="error" /> : null}
      <PrimaryButton
        disabled={isSubmitting || isCoolingDown}
        isLoading={isSubmitting}
        label={isSubmitting ? 'Sending…' : buttonLabel}
        onPress={() => void submit()}
      />
      {hasSent ? (
        <Text style={styles.helper}>Open the newest Piggi email. Older links may no longer work.</Text>
      ) : null}
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  helper: { color: colors.muted, fontSize: fontSizes.secondary, lineHeight: 19, textAlign: 'center' },
});
