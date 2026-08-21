import { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

type AuthScreenShellProps = PropsWithChildren<{
  footer: ReactNode;
  subtitle: string;
  title: string;
}>;

export function AuthScreenShell({ children, footer, subtitle, title }: AuthScreenShellProps) {
  return (
    <Screen includeTopInset>
      <View style={styles.content}>
        <View accessibilityElementsHidden style={styles.pigBadge}>
          <Text style={styles.pigEmoji}>🐷</Text>
        </View>
        <Text style={styles.brand}>PIGGI</Text>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.formCard}>{children}</View>
        <View style={styles.footer}>{footer}</View>

        <Text style={styles.securityNote}>
          Your password is handled securely by Supabase and is never stored by Piggi.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  pigBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 28,
    height: 80,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 80,
  },
  pigEmoji: { fontSize: 45 },
  brand: {
    color: colors.primary,
    fontSize: fontSizes.caption,
    fontWeight: '900',
    letterSpacing: 2.2,
    textAlign: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: fontSizes.screenTitle,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    alignSelf: 'center',
    color: colors.muted,
    fontSize: fontSizes.body,
    lineHeight: 22,
    marginTop: spacing.sm,
    maxWidth: 340,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  footer: { alignItems: 'center', marginTop: spacing.lg },
  securityNote: {
    alignSelf: 'center',
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xl,
    maxWidth: 330,
    textAlign: 'center',
  },
});
