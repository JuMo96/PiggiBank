import { StyleSheet, Text, View } from 'react-native';

import { PigAvatar } from '@/components/PigAvatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

type EmptyPigsStateProps = {
  onCreate: () => void;
};

export function EmptyPigsState({ onCreate }: EmptyPigsStateProps) {
  return (
    <View style={styles.card}>
      <PigAvatar accessibilityLabel="A cheerful Piggi waiting for a savings goal" size="compact" />
      <Text style={styles.title}>No Pigs yet</Text>
      <Text style={styles.body}>Protect some money by creating your first Pig.</Text>
      <View style={styles.buttonWrap}>
        <PrimaryButton icon="add" label="Create Pig" onPress={onCreate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.surfacePink, borderColor: colors.border, borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden', padding: spacing.xl },
  title: { color: colors.ink, fontSize: fontSizes.cardTitle, fontWeight: '800', marginTop: spacing.md },
  body: { color: colors.muted, fontSize: fontSizes.body, lineHeight: 22, marginTop: spacing.sm, maxWidth: 260, textAlign: 'center' },
  buttonWrap: { marginTop: spacing.lg, width: '100%' },
});
