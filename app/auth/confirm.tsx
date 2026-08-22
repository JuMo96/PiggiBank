import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { AuthMessage } from '@/components/auth/AuthMessage';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { AuthTextLink } from '@/components/auth/AuthTextLink';
import { PrimaryButton } from '@/components/PrimaryButton';
import { hasAuthFieldErrors, normalizeEmail, validateSignInFields } from '@/domain/authValidation';
import { useResendCooldown } from '@/hooks/useResendCooldown';
import { useAuth } from '@/state/AuthProvider';
import { colors } from '@/theme/colors';
import { fontSizes, spacing } from '@/theme/spacing';

export default function ConfirmEmailScreen() {
  const params = useLocalSearchParams();
  const {
    authFlow,
    cancelAuthFlow,
    completeConfirmation,
    hasCheckedInitialAuthLink,
    resendConfirmation,
    retryAuthFlow,
    session,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);
  const [isResending, setIsResending] = useState(false);
  const { isCoolingDown, secondsRemaining, startCooldown } = useResendCooldown();

  useEffect(() => {
    if (Object.keys(params).length > 0) router.replace('/auth/confirm');
  }, [params]);

  const status = authFlow.kind === 'confirmation'
    ? authFlow.status
    : hasCheckedInitialAuthLink
      ? 'invalid'
      : 'processing';

  const goBackToSignIn = async () => {
    await cancelAuthFlow();
    router.replace('/sign-in');
  };

  const handleContinue = () => {
    completeConfirmation();
    router.replace(session ? '/' : { pathname: '/sign-in', params: { notice: 'email-confirmed' } });
  };

  const handleResend = async () => {
    if (isResending || isCoolingDown) return;
    const validation = validateSignInFields(email, 'placeholder');
    setEmailError(validation.email);
    setMessage(null);
    if (hasAuthFieldErrors(validation)) return;

    setIsResending(true);
    const result = await resendConfirmation(email);
    setIsResending(false);
    if (!result.success) {
      setMessage({ error: true, text: result.error });
      return;
    }
    setEmail(normalizeEmail(email));
    setMessage({ text: 'A new confirmation email is on its way.' });
    startCooldown();
  };

  if (status === 'processing') {
    return (
      <AuthScreenShell footer={null} subtitle="Please keep Piggi open for a moment." title="Confirming your email…">
        <View accessibilityLiveRegion="polite" style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.body}>Securely verifying your confirmation link.</Text>
        </View>
      </AuthScreenShell>
    );
  }

  if (status === 'network-error') {
    return (
      <AuthScreenShell
        footer={<AuthTextLink label="Back to Sign In" onPress={() => void goBackToSignIn()} />}
        subtitle="Your link may still be valid. Check your connection and try again."
        title="We couldn’t verify the link yet"
      >
        <AuthMessage message="Piggi could not reach the verification service." tone="error" />
        <PrimaryButton label="Retry Verification" onPress={() => void retryAuthFlow()} />
      </AuthScreenShell>
    );
  }

  if (status === 'success') {
    return (
      <AuthScreenShell footer={null} subtitle="Your Piggi account is ready." title="Email confirmed">
        <View accessibilityLiveRegion="polite" style={styles.centered}>
          <Ionicons color={colors.safe} name="checkmark-circle" size={54} />
          <Text style={styles.body}>Thanks for confirming your email.</Text>
        </View>
        <PrimaryButton label="Continue to Piggi" onPress={handleContinue} />
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      footer={<AuthTextLink label="Back to Sign In" onPress={() => void goBackToSignIn()} />}
      subtitle="It may be expired, already used, malformed, or intended for another action."
      title="This confirmation link can’t be used"
    >
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        editable={!isResending}
        error={emailError}
        keyboardType="email-address"
        label="Email"
        onChangeText={(value) => {
          setEmail(value);
          setEmailError(undefined);
          setMessage(null);
        }}
        onSubmitEditing={() => void handleResend()}
        placeholder="you@example.com"
        returnKeyType="send"
        textContentType="emailAddress"
        value={email}
      />
      {message ? <AuthMessage message={message.text} tone={message.error ? 'error' : 'success'} /> : null}
      <PrimaryButton
        disabled={isCoolingDown || isResending}
        isLoading={isResending}
        label={isCoolingDown ? `Send again in ${secondsRemaining}s` : 'Send a New Confirmation Email'}
        onPress={() => void handleResend()}
      />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  body: { color: colors.muted, fontSize: fontSizes.body, lineHeight: 22, textAlign: 'center' },
});
