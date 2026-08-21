import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/spacing';

type ErrorNoticeProps = {
  message: string;
  onRetry?: () => void;
  title?: string;
};

export function ErrorNotice({
  message,
  onRetry,
  title = 'Something went wrong',
}: ErrorNoticeProps) {
  return (
    <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.notice}>
      <View style={styles.icon}>
        <Ionicons color={colors.danger} name="cloud-offline-outline" size={20} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={6}
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
        >
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    alignItems: 'flex-start',
    backgroundColor: colors.dangerSoft,
    borderColor: '#E8C5CC',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.smd,
    padding: spacing.md,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  message: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  retry: { justifyContent: 'center', minHeight: 38, paddingHorizontal: spacing.xs },
  retryText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.62 },
});
