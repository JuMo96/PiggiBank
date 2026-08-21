import { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type ScreenProps = PropsWithChildren<{
  includeTopInset?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}>;

export function Screen({
  children,
  includeTopInset = false,
  onRefresh,
  refreshing = false,
}: ScreenProps) {
  const edges: Edge[] = includeTopInset ? ['top', 'bottom'] : ['bottom'];

  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoider}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? (
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={onRefresh}
              refreshing={refreshing}
              tintColor={colors.primary}
            />
          ) : undefined}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  keyboardAvoider: { flex: 1 },
  content: { alignSelf: 'center', flexGrow: 1, maxWidth: 600, padding: spacing.lg, paddingBottom: spacing.xxxl, width: '100%' },
});
