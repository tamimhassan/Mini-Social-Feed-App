import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  return user ? <Redirect href='/feed' /> : <Redirect href='/login' />;
}
