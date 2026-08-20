import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedEntrance } from '@/components/AnimatedEntrance';
import { formatCurrency } from '@/domain/savings';
import { Pig } from '@/models/pig';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type CreationSuccessBannerProps = {
  onView: () => void;
  pig: Pig;
};

export function CreationSuccessBanner({ onView, pig }: CreationSuccessBannerProps) {
  return (
    <AnimatedEntrance>
      <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.banner}>
        <View style={styles.icon}>
          <Ionicons color={colors.primary} name="checkmark" size={18} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Your Pig is on its pedestal</Text>
          <Text style={styles.text}>{formatCurrency(pig.protectedAmount)} is now protected.</Text>
        </View>
        <Pressable
          accessibilityHint="Opens the Pig you just created"
          accessibilityLabel={`View ${pig.name}`}
          accessibilityRole="button"
          onPress={onView}
          style={({ pressed }) => [styles.viewButton, pressed && styles.pressed]}
        >
          <Text style={styles.viewButtonText}>View</Text>
          <Ionicons color={colors.primary} name="chevron-forward" size={15} />
        </Pressable>
      </View>
    </AnimatedEntrance>
  );
}

const styles = StyleSheet.create({
  banner: { alignItems: 'center', backgroundColor: colors.primarySoft, borderColor: '#C4DED2', borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, padding: spacing.md },
  icon: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, height: 36, justifyContent: 'center', width: 36 },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  text: { color: colors.muted, fontSize: 12, marginTop: 2 },
  viewButton: { alignItems: 'center', flexDirection: 'row', gap: 2, minHeight: 44, paddingLeft: spacing.sm },
  viewButtonText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
