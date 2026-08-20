import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedEntrance } from '@/components/AnimatedEntrance';
import { formatCurrency } from '@/domain/savings';
import { Pig } from '@/models/pig';
import { ReleaseReason } from '@/state/PiggiProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type ReleaseNoticeBannerProps = {
  onDismiss: () => void;
  onView: () => void;
  pig: Pig;
  reason: ReleaseReason;
};

export function ReleaseNoticeBanner({ onDismiss, onView, pig, reason }: ReleaseNoticeBannerProps) {
  const completed = reason === 'completed';

  return (
    <AnimatedEntrance>
      <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.banner}>
        <View style={styles.icon}>
          <Ionicons
            color={completed ? colors.primary : '#A86445'}
            name={completed ? 'trophy' : 'hammer'}
            size={18}
          />
        </View>
        <Pressable
          accessibilityHint="Opens this Pig in history"
          accessibilityRole="button"
          onPress={onView}
          style={({ pressed }) => [styles.copy, pressed && styles.pressed]}
        >
          <Text style={styles.title}>{completed ? 'Pig completed' : 'Pig broken early'}</Text>
          <Text style={styles.text}>
            {formatCurrency(pig.protectedAmount)} returned to Safe to Spend. View details
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Dismiss update"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onDismiss}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.muted} name="close" size={19} />
        </Pressable>
      </View>
    </AnimatedEntrance>
  );
}

const styles = StyleSheet.create({
  banner: { alignItems: 'center', backgroundColor: '#F5EFE5', borderColor: '#E2D6C3', borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, padding: spacing.md },
  icon: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, height: 36, justifyContent: 'center', width: 36 },
  copy: { flex: 1, justifyContent: 'center', minHeight: 44 },
  title: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  text: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  closeButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 32 },
  pressed: { opacity: 0.62 },
});
