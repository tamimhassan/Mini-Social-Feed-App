import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { storage } from '@/services/storage.service';

export type User = {
  id: string;
  name: string;
  email: string;
  username: string;
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLoginData();
  }, []);

  async function loadLoginData() {
    try {
      const storedUser = await storage.getItem('user');
      const storedToken = await storage.getItem('token');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(userData: User, token: string) {
    await storage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    await storage.setItem('token', token);
    setToken(token);
  }

  async function logout() {
    await storage.removeItem('user');
    setUser(null);
    await storage.removeItem('token');
    setToken(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
