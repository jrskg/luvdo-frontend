import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  extra.apiUrl ??
  'http://localhost:3000';

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ??
  extra.socketUrl ??
  'http://localhost:3000';

export const SOCKET_NAMESPACE_GAME = '/game';
export const SOCKET_NAMESPACE_WEBRTC = '/webrtc';

export const API_ROUTES = {
  register: `${API_BASE_URL}/api/v1/auth/register`,
  login: `${API_BASE_URL}/api/v1/auth/login`,
  me: `${API_BASE_URL}/api/v1/auth/me`,
  updateMood: (id: string) => `${API_BASE_URL}/api/v1/users/${id}/mood`,
  updateAvatar: (id: string) => `${API_BASE_URL}/api/v1/users/${id}/avatar`,
  historyMe: `${API_BASE_URL}/api/v1/history/me`,
  historyRoom: (roomId: string) => `${API_BASE_URL}/api/v1/history/${roomId}`,
} as const;
