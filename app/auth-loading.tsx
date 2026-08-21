import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { fontSizes, spacing } from '@/theme/spacing';

export default function AuthLoadingScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View accessibilityLiveRegion="polite" style={styles.content}>
        <View accessibilityElementsHidden style={styles.pigBadge}>
          <Text style={styles.pigEmoji}>🐷</Text>
        </View>
        <Text style={styles.brand}>Piggi</Text>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.message}>Restoring your secure session…</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.lg },
  pigBadge: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 28, height: 80, justifyContent: 'center', width: 80 },
  pigEmoji: { fontSize: 44 },
  brand: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.8, marginBottom: spacing.lg, marginTop: spacing.md },
  message: { color: colors.muted, fontSize: fontSizes.body, marginTop: spacing.md },
});
