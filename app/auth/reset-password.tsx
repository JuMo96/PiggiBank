import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { AuthMessage } from '@/components/auth/AuthMessage';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { AuthTextLink } from '@/components/auth/AuthTextLink';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  AuthFieldErrors,
  hasAuthFieldErrors,
  MINIMUM_PASSWORD_LENGTH,
  ResetPasswordField,
  validateResetPasswordFields,
} from '@/domain/authValidation';
import { useAuth } from '@/state/AuthProvider';
import { colors } from '@/theme/colors';
import { fontSizes, spacing } from '@/theme/spacing';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const {
    authFlow,
    cancelAuthFlow,
    hasCheckedInitialAuthLink,
    retryAuthFlow,
    updateRecoveredPassword,
  } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<AuthFieldErrors<ResetPasswordField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmPasswordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (Object.keys(params).length > 0) router.replace('/auth/reset-password');
  }, [params]);

  const status = authFlow.kind === 'recovery'
    ? authFlow.status
    : hasCheckedInitialAuthLink
      ? 'invalid'
      : 'processing';

  const cancel = async () => {
    if (isSubmitting) return;
    await cancelAuthFlow();
    router.replace('/sign-in');
  };

  const submit = async () => {
    if (isSubmitting) return;
    const validation = validateResetPasswordFields(password, confirmPassword);
    setErrors(validation);
    setFormError(null);
    if (hasAuthFieldErrors(validation)) return;

    setIsSubmitting(true);
    const result = await updateRecoveredPassword(password);
    if (!result.success) {
      setFormError(result.error);
      setIsSubmitting(false);
      return;
    }

    setPassword('');
    setConfirmPassword('');
    router.replace({ pathname: '/sign-in', params: { notice: 'password-updated' } });
  };

  if (status === 'processing') {
    return (
      <AuthScreenShell footer={null} subtitle="Please keep Piggi open for a moment." title="Verifying your reset link…">
        <View accessibilityLiveRegion="polite" style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.body}>Securely preparing password recovery.</Text>
        </View>
      </AuthScreenShell>
    );
  }

  if (status === 'network-error') {
    return (
      <AuthScreenShell
        footer={<AuthTextLink label="Back to Sign In" onPress={() => void cancel()} />}
        subtitle="Your link may still be valid. Check your connection and try again."
        title="We couldn’t verify the link yet"
      >
        <AuthMessage message="Piggi could not reach the recovery service." tone="error" />
        <PrimaryButton label="Retry Verification" onPress={() => void retryAuthFlow()} />
      </AuthScreenShell>
    );
  }

  if (status !== 'ready') {
    return (
      <AuthScreenShell
        footer={<AuthTextLink label="Back to Sign In" onPress={() => void cancel()} />}
        subtitle="It may be expired, already used, malformed, or intended for another action."
        title="This reset link has expired"
      >
        <AuthMessage message="Request a fresh password reset email to continue." tone="error" />
        <PrimaryButton label="Send a New Reset Link" onPress={() => {
          void cancelAuthFlow().then(() => router.replace('/forgot-password'));
        }} />
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      footer={<AuthTextLink disabled={isSubmitting} label="Cancel and Return to Sign In" onPress={() => void cancel()} />}
      subtitle="Choose a new password for your Piggi account."
      title="Create a new password"
    >
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!isSubmitting}
        error={errors.password}
        label="New Password"
        onChangeText={(value) => {
          setPassword(value);
          setErrors((current) => ({ ...current, password: undefined }));
          setFormError(null);
        }}
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        password
        placeholder={`At least ${MINIMUM_PASSWORD_LENGTH} characters`}
        returnKeyType="next"
        textContentType="newPassword"
        value={password}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!isSubmitting}
        error={errors.confirmPassword}
        label="Confirm New Password"
        onChangeText={(value) => {
          setConfirmPassword(value);
          setErrors((current) => ({ ...current, confirmPassword: undefined }));
          setFormError(null);
        }}
        onSubmitEditing={() => void submit()}
        password
        placeholder="Enter the new password again"
        ref={confirmPasswordRef}
        returnKeyType="done"
        textContentType="newPassword"
        value={confirmPassword}
      />
      {formError ? <AuthMessage message={formError} tone="error" /> : null}
      <PrimaryButton
        disabled={isSubmitting}
        isLoading={isSubmitting}
        label={isSubmitting ? 'Updating password…' : 'Update Password'}
        onPress={() => void submit()}
      />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  body: { color: colors.muted, fontSize: fontSizes.body, lineHeight: 22, textAlign: 'center' },
});
