import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/models';
import { registerForPushNotifications } from '@/services/notification.service';
import { getMe, registerFcmToken } from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'authUser';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app launch — token itself is read by the axios
  // interceptor directly from AsyncStorage, so we only need the user object here.
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          const freshUser = await getMe(); // throws AuthError if token expired/invalid
          setUser(freshUser);
          setToken(storedToken);
          await AsyncStorage.setItem(
            USER_STORAGE_KEY,
            JSON.stringify(freshUser),
          );
        }
      } catch (err) {
        // Token expired or invalid — clear it so the user is sent back to login
        await AsyncStorage.multiRemove([USER_STORAGE_KEY, 'authToken']);
        console.warn('Session restore failed, logging out:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    // authToken itself is already stored by auth.service.ts's login/signup calls

    // Push registration happens after auth succeeds, but must never block or
    // break login — a denied permission or a dev-client-less Expo Go session
    // should not prevent someone from using the app.
    try {
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await registerFcmToken(pushToken);
      }
    } catch (err) {
      console.warn('Push notification registration skipped:', err);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove([USER_STORAGE_KEY, 'authToken']);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
