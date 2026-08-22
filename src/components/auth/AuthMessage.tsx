import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

type AuthMessageProps = {
  message: string;
  tone?: 'error' | 'success';
};

export function AuthMessage({ message, tone = 'success' }: AuthMessageProps) {
  const isError = tone === 'error';

  return (
    <View
      accessibilityLiveRegion={isError ? 'assertive' : 'polite'}
      style={[styles.container, isError ? styles.error : styles.success]}
    >
      <Ionicons
        color={isError ? colors.danger : colors.safe}
        name={isError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
        size={19}
      />
      <Text style={[styles.text, isError ? styles.errorText : styles.successText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.smd,
  },
  error: { backgroundColor: colors.dangerSoft },
  success: { backgroundColor: colors.safeSoft },
  text: { flex: 1, fontSize: fontSizes.secondary, lineHeight: 19 },
  errorText: { color: colors.danger },
  successText: { color: colors.safe },
});
