import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';

type PrimaryButtonProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export function PrimaryButton({ icon, label, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {icon ? <Ionicons color={colors.white} name={icon} size={21} /> : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 17,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
  },
  label: { color: colors.white, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
