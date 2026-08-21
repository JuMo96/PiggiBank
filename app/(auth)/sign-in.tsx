import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { ErrorNotice } from '@/components/ErrorNotice';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  AuthFieldErrors,
  hasAuthFieldErrors,
  SignInField,
  validateSignInFields,
} from '@/domain/authValidation';
import { useAuth } from '@/state/AuthProvider';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

export default function SignInScreen() {
  const {
    initializationError,
    isConfigured,
    isLoading,
    retrySessionRestore,
    signIn,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AuthFieldErrors<SignInField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const clearFieldError = (field: SignInField) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const nextErrors = validateSignInFields(email, password);
    setErrors(nextErrors);
    setFormError(null);

    if (hasAuthFieldErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);

    if (!result.success) {
      setFormError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      footer={(
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <Pressable
            accessibilityLabel="Create an account"
            accessibilityRole="link"
            disabled={isSubmitting}
            onPress={() => router.replace('./sign-up')}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.footerLink}>Create one</Text>
          </Pressable>
        </View>
      )}
      subtitle="Welcome back. Your savings commitments are waiting."
      title="Sign in to Piggi"
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
        autoComplete="current-password"
        error={errors.password}
        label="Password"
        onChangeText={(value) => {
          setPassword(value);
          clearFieldError('password');
        }}
        onSubmitEditing={() => void handleSubmit()}
        password
        placeholder="Enter your password"
        ref={passwordRef}
        returnKeyType="done"
        textContentType="password"
        value={password}
      />

      {formError ? (
        <View accessibilityLiveRegion="assertive" style={styles.formError}>
          <Text style={styles.formErrorText}>{formError}</Text>
        </View>
      ) : null}

      <PrimaryButton
        accessibilityHint="Signs in to your Piggi account"
        disabled={isSubmitting || isLoading || Boolean(initializationError)}
        isLoading={isSubmitting}
        label="Sign In"
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
});
