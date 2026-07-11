import 'react-native-get-random-values'; // must be first — polyfills crypto.getRandomValues for uuid and react-native-webrtc
import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { useUserStore } from '@/stores/useUserStore';
import { useSocketStore } from '@/stores/useSocketStore';
import { Toast } from '@/components/ui/Toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadFromStorage, isAuthenticated, token } = useUserStore();
  const { connect } = useSocketStore();

  useEffect(() => {
    loadFromStorage().then(() => {
      const state = useUserStore.getState();
      SplashScreen.hideAsync();
      if (state.isAuthenticated && state.token) {
        connect(state.token);
        router.replace('/');
      } else {
        router.replace('/auth');
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#130025' },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="auth" />
          <Stack.Screen name="index" />
          <Stack.Screen name="lobby" />
          <Stack.Screen name="game" options={{ gestureEnabled: false }} />
          <Stack.Screen name="result" />
          <Stack.Screen name="local-setup" />
          <Stack.Screen name="local-game" options={{ gestureEnabled: false }} />
          <Stack.Screen name="local-result" />
        </Stack>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
