import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ROUTES } from '../config/api.config';
import { MoodType } from '../types/game.types';

const TOKEN_KEY = '@luvdo_token';
const USER_KEY = '@luvdo_user';

export interface ApiUser {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  mood: MoodType;
  authProvider: 'local' | 'google';
  gamesPlayed: number;
  gamesWon: number;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function storeSession(user: ApiUser, token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function register(params: {
  name: string;
  username: string;
  pin: string;
  avatar: string;
  mood: MoodType;
}): Promise<{ user: ApiUser; token: string }> {
  const data = await request<{ user: ApiUser; token: string }>(API_ROUTES.register, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  await storeSession(data.user, data.token);
  return data;
}

export async function login(params: {
  username: string;
  pin: string;
}): Promise<{ user: ApiUser; token: string }> {
  const data = await request<{ user: ApiUser; token: string }>(API_ROUTES.login, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  await storeSession(data.user, data.token);
  return data;
}

export async function getMe(): Promise<ApiUser | null> {
  try {
    return await request<ApiUser>(API_ROUTES.me);
  } catch {
    return null;
  }
}

export async function updateMood(userId: string, mood: MoodType): Promise<ApiUser> {
  return request<ApiUser>(API_ROUTES.updateMood(userId), {
    method: 'PATCH',
    body: JSON.stringify({ mood }),
  });
}

export async function updateAvatar(userId: string, avatar: string): Promise<ApiUser> {
  return request<ApiUser>(API_ROUTES.updateAvatar(userId), {
    method: 'PATCH',
    body: JSON.stringify({ avatar }),
  });
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<ApiUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

export async function clearStorage(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
