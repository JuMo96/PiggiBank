import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet } from 'react-native';

import { AuthProvider, useAuth } from '@/state/AuthProvider';
import { PiggiProvider } from '@/state/PiggiProvider';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PiggiProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </PiggiProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { isLoading, session } = useAuth();
  const canAccessAppRoutes = isLoading || Boolean(session);
  const canAccessAuthRoutes = isLoading || !session;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Protected guard={isLoading}>
        <Stack.Screen name="auth-loading" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={canAccessAuthRoutes}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={canAccessAppRoutes}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-pig"
          options={{
            animation: 'slide_from_bottom',
            headerLeft: () => (
              <Pressable
                accessibilityLabel="Close Create Pig"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => router.back()}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              >
                <Ionicons color={colors.ink} name="close" size={22} />
              </Pressable>
            ),
            presentation: 'modal',
            title: 'New Pig',
          }}
        />
        <Stack.Screen name="pig/[id]" options={{ title: 'Your Pig' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: { opacity: 0.65 },
});
