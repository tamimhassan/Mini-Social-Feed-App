import { apiClient, ApiErrorDetail } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/models';

export class AuthError extends Error {
  details?: ApiErrorDetail[];
  constructor(message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.details = details;
  }
}

interface RawUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

interface RawAuthResponse {
  user: RawUser;
  token: string;
}

function mapUser(raw: RawUser): User {
  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    createdAt: raw.createdAt,
  };
}

export interface AuthResult {
  user: User;
  token: string;
}

export async function signup({
  email,
  username,
  password,
}: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const { data } = await apiClient.post<RawAuthResponse>('/auth/signup', {
      email,
      username,
      password,
    });
    await AsyncStorage.setItem('authToken', data.token);
    return { user: mapUser(data.user), token: data.token };
  } catch (err) {
    throw new AuthError(err instanceof Error ? err.message : 'Signup failed');
  }
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const { data } = await apiClient.post<RawAuthResponse>('/auth/login', {
      email,
      password,
    });
    await AsyncStorage.setItem('authToken', data.token);
    return { user: mapUser(data.user), token: data.token };
  } catch (err) {
    throw new AuthError(err instanceof Error ? err.message : 'Login failed');
  }
}

export async function registerFcmToken(fcmToken: string): Promise<void> {
  try {
    await apiClient.post('/auth/fcm-token', { fcmToken });
  } catch (err) {
    console.warn(
      'Failed to register FCM token:',
      err instanceof Error ? err.message : err,
    );
  }
}

export async function getMe(): Promise<User> {
  try {
    const { data } = await apiClient.get<{ user: RawUser }>('/auth/me');
    return mapUser(data.user);
  } catch (err) {
    throw new AuthError(err instanceof Error ? err.message : 'Session expired');
  }
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove(['authToken', 'authUser']);
}
