import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { PiggiProvider } from '@/state/PiggiProvider';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <PiggiProvider>
      <StatusBar style="dark" />
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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="create-pig" options={{ title: 'Create a Pig' }} />
        <Stack.Screen name="pig/[id]" options={{ title: 'Pig details' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </PiggiProvider>
  );
}
