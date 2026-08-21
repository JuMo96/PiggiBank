import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';
import { radii } from '@/theme/spacing';

type PrimaryButtonProps = {
  accessibilityHint?: string;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  isLoading?: boolean;
  label: string;
  onPress: () => void;
};

export function PrimaryButton({
  accessibilityHint,
  disabled = false,
  icon,
  isLoading = false,
  label,
  onPress,
}: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {isLoading
        ? <ActivityIndicator color={colors.white} size="small" />
        : icon
          ? <Ionicons color={colors.white} name={icon} size={21} />
          : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
    shadowColor: colors.primary,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 2,
  },
  label: { color: colors.white, fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.52 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
