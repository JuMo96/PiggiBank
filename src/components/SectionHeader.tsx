import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { fontSizes, spacing } from '@/theme/spacing';

type SectionHeaderProps = {
  detail?: string;
  title: string;
};

export function SectionHeader({ detail, title }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, marginTop: spacing.xl },
  title: { color: colors.ink, fontSize: fontSizes.sectionTitle, fontWeight: '800', letterSpacing: -0.35 },
  detail: { color: colors.muted, fontSize: fontSizes.secondary, fontWeight: '600' },
});
