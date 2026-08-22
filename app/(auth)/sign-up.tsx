import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { AuthMessage } from '@/components/auth/AuthMessage';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { AuthTextLink } from '@/components/auth/AuthTextLink';
import { ErrorNotice } from '@/components/ErrorNotice';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  AuthFieldErrors,
  hasAuthFieldErrors,
  MINIMUM_PASSWORD_LENGTH,
  normalizeEmail,
  SignUpField,
  validateSignUpFields,
} from '@/domain/authValidation';
import { useAuth } from '@/state/AuthProvider';
import { useResendCooldown } from '@/hooks/useResendCooldown';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

export default function SignUpScreen() {
  const {
    initializationError,
    isConfigured,
    isLoading,
    retrySessionRestore,
    resendConfirmation,
    signUp,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<AuthFieldErrors<SignUpField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendResult, setResendResult] = useState<{ error?: boolean; message: string } | null>(null);
  const { isCoolingDown, secondsRemaining, startCooldown } = useResendCooldown();
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const clearFieldError = (field: SignUpField) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const nextErrors = validateSignUpFields(email, password, confirmPassword);
    setErrors(nextErrors);
    setFormError(null);

    if (hasAuthFieldErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(email, password);

    if (!result.success) {
      setFormError(result.error);
      setIsSubmitting(false);
      return;
    }

    if (result.requiresEmailConfirmation) {
      setConfirmationEmail(normalizeEmail(email));
      startCooldown();
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!confirmationEmail || isResending || isCoolingDown) return;
    setIsResending(true);
    setResendResult(null);
    const result = await resendConfirmation(confirmationEmail);
    setIsResending(false);
    if (!result.success) {
      setResendResult({ error: true, message: result.error });
      return;
    }
    setResendResult({ message: 'A new confirmation email is on its way.' });
    startCooldown();
  };

  if (confirmationEmail) {
    return (
      <AuthScreenShell
        footer={(
          <AuthTextLink label="Back to Sign In" onPress={() => router.replace('./sign-in')} />
        )}
        subtitle="Your account is almost ready."
        title="Check your email"
      >
        <View style={styles.confirmationContent}>
          <View accessibilityElementsHidden style={styles.mailIcon}>
            <Ionicons color={colors.primary} name="mail-open-outline" size={30} />
          </View>
          <Text style={styles.confirmationTitle}>Confirmation link sent</Text>
          <Text style={styles.confirmationText}>
            We sent a confirmation link to {confirmationEmail}. Open the newest Piggi email to finish.
          </Text>
        </View>
        {resendResult ? (
          <AuthMessage message={resendResult.message} tone={resendResult.error ? 'error' : 'success'} />
        ) : null}
        <PrimaryButton
          disabled={isCoolingDown || isResending}
          isLoading={isResending}
          label={isCoolingDown ? `Resend in ${secondsRemaining}s` : 'Resend Confirmation Email'}
          onPress={() => void handleResend()}
        />
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      footer={(
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable
            accessibilityLabel="Sign in"
            accessibilityRole="link"
            disabled={isSubmitting}
            onPress={() => router.replace('./sign-in')}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.footerLink}>Sign In</Text>
          </Pressable>
        </View>
      )}
      subtitle="Create an account and keep your Pigs with you on every device."
      title="Start saving"
    >
      {initializationError ? (
        <ErrorNotice
          message={initializationError}
          onRetry={isConfigured ? () => void retrySessionRestore() : undefined}
          title={isConfigured ? 'Session check failed' : 'Supabase setup required'}
        />
      ) : null}
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        error={errors.email}
        keyboardType="email-address"
        label="Email"
        onChangeText={(value) => {
          setEmail(value);
          clearFieldError('email');
        }}
        onSubmitEditing={() => passwordRef.current?.focus()}
        placeholder="you@example.com"
        returnKeyType="next"
        textContentType="emailAddress"
        value={email}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        error={errors.password}
        label="Password"
        onChangeText={(value) => {
          setPassword(value);
          clearFieldError('password');
        }}
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        password
        placeholder={`At least ${MINIMUM_PASSWORD_LENGTH} characters`}
        ref={passwordRef}
        returnKeyType="next"
        textContentType="newPassword"
        value={password}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        error={errors.confirmPassword}
        label="Confirm Password"
        onChangeText={(value) => {
          setConfirmPassword(value);
          clearFieldError('confirmPassword');
        }}
        onSubmitEditing={() => void handleSubmit()}
        password
        placeholder="Enter your password again"
        ref={confirmPasswordRef}
        returnKeyType="done"
        textContentType="newPassword"
        value={confirmPassword}
      />

      {formError ? (
        <View accessibilityLiveRegion="assertive" style={styles.formError}>
          <Text style={styles.formErrorText}>{formError}</Text>
        </View>
      ) : null}

      <PrimaryButton
        accessibilityHint="Creates your Piggi account"
        disabled={isSubmitting || isLoading || Boolean(initializationError)}
        isLoading={isSubmitting}
        label="Create Account"
        onPress={() => void handleSubmit()}
      />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  footerRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  footerText: { color: colors.muted, fontSize: fontSizes.body },
  footerLink: { color: colors.primary, fontSize: fontSizes.body, fontWeight: '800', paddingVertical: spacing.smd },
  pressed: { opacity: 0.55 },
  formError: { backgroundColor: colors.dangerSoft, borderRadius: radii.sm, padding: spacing.smd },
  formErrorText: { color: colors.danger, fontSize: fontSizes.secondary, lineHeight: 19, textAlign: 'center' },
  confirmationContent: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  mailIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 22, height: 58, justifyContent: 'center', marginBottom: spacing.xs, width: 58 },
  confirmationTitle: { color: colors.ink, fontSize: fontSizes.cardTitle, fontWeight: '800', textAlign: 'center' },
  confirmationText: { color: colors.muted, fontSize: fontSizes.body, lineHeight: 22, textAlign: 'center' },
});
