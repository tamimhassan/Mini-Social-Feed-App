import 'react-native-gesture-handler';
import { useRef, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received in foreground:', notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const postId = response.notification.request.content.data
          ?.postId as string;

        if (postId) {
          router.push(`/(app)/post/${postId}`);
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <AuthProvider>
        <StatusBar style='dark' />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name='(auth)' />
          <Stack.Screen name='(app)' />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
