import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

type AuthFieldProps = Omit<TextInputProps, 'style'> & {
  error?: string;
  label: string;
  password?: boolean;
};

export const AuthField = forwardRef<TextInput, AuthFieldProps>(function AuthField(
  { error, label, password = false, ...inputProps },
  ref,
) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const hidesPassword = password && !passwordVisible;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputFrame, error && styles.inputFrameError]}>
        <TextInput
          accessibilityHint={error}
          accessibilityLabel={label}
          placeholderTextColor={colors.placeholder}
          ref={ref}
          secureTextEntry={hidesPassword}
          selectionColor={colors.primary}
          style={styles.input}
          {...inputProps}
        />
        {password ? (
          <Pressable
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={4}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={({ pressed }) => [styles.visibilityButton, pressed && styles.pressed]}
          >
            <Ionicons
              color={colors.muted}
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={21}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View accessibilityLiveRegion="polite" style={styles.errorRow}>
          <Ionicons color={colors.danger} name="alert-circle-outline" size={15} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { color: colors.ink, fontSize: fontSizes.body, fontWeight: '700' },
  inputFrame: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    minHeight: 56,
    overflow: 'hidden',
  },
  inputFrameError: { borderColor: colors.danger },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smd,
  },
  visibilityButton: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  pressed: { opacity: 0.55 },
  errorRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  errorText: { color: colors.danger, flex: 1, fontSize: fontSizes.secondary, lineHeight: 18 },
});
