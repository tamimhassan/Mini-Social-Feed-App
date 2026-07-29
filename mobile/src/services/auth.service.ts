import { User } from '../types/models';

const USE_MOCK = true;
const MOCK_DELAY = 700;

export interface AuthResult {
  user: User;
  token: string;
}

export class AuthError extends Error {}

export async function login(
  username: string,
  password: string,
): Promise<AuthResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, MOCK_DELAY));
    if (!username.trim() || !password.trim()) {
      throw new AuthError('Username and password are required');
    }
    if (password.length < 6) {
      throw new AuthError('Invalid username or password');
    }
    return {
      user: {
        id: 'mock-user-1',
        name: 'Tamim Taim',
        email: 'tamimhassan506@gmail.com',
        username: username.trim().toLowerCase(),
      },
      token: 'mock-token-abc123',
    };
  }
  // TODO: real call
  // const { data } = await apiClient.post('/auth/login', { username, password });
  // return data;
  throw new AuthError('Not implemented');
}

export async function signup(
  username: string,
  password: string,
): Promise<AuthResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, MOCK_DELAY));
    if (!username.trim() || !password.trim()) {
      throw new AuthError('Username and password are required');
    }
    if (password.length < 6) {
      throw new AuthError('Password must be at least 6 characters');
    }
    return {
      user: {
        id: 'mock-user-' + Date.now(),
        username: username.trim().toLowerCase(),
      },
      token: 'mock-token-abc123',
    };
  }
  // TODO: real call to POST /auth/signup
  throw new AuthError('Not implemented');
}
