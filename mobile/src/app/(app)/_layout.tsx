import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AppLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href='/(auth)/login' />;
  }

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#F3F4F8' },
        headerShadowVisible: false,
        headerTintColor: '#111827',
        contentStyle: { backgroundColor: '#F3F4F8' },
      }}
    >
      <Stack.Screen
        name='feed'
        options={{ headerShown: false, title: 'Feed' }}
      />
      <Stack.Screen name='create-post' options={{ title: 'Create Post' }} />
      <Stack.Screen
        name='post/[id]'
        options={{ title: 'Post Details', contentStyle: { backgroundColor: '#fff' } }}
      />
    </Stack>
  );
}
