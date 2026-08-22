import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';
import { fontSizes, spacing } from '@/theme/spacing';

type AuthTextLinkProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

export function AuthTextLink({ disabled = false, label, onPress }: AuthTextLinkProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="link"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.touchTarget, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: { justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  label: { color: colors.primary, fontSize: fontSizes.body, fontWeight: '800', textAlign: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.55 },
});
