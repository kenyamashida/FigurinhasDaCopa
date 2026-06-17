import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { ErrorBoundary } from '../components/GlobalErrorBoundary';

export { ErrorBoundary };

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  
  // Inicializa e gerencia os tokens de notificação em background
  usePushNotifications();

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
