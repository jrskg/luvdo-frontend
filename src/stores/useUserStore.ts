import { create } from 'zustand';
import { MoodType } from '../types/game.types';
import * as apiService from '../services/api.service';

interface UserStore {
  userId: string | null;
  name: string | null;
  username: string | null;
  avatar: string | null;
  mood: MoodType;
  token: string | null;
  isAuthenticated: boolean;

  register: (params: { name: string; username: string; pin: string; avatar: string; mood: MoodType }) => Promise<void>;
  login: (params: { username: string; pin: string }) => Promise<void>;
  logout: () => void;
  setMood: (mood: MoodType) => Promise<void>;
  setAvatar: (avatar: string) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

function applyUser(user: apiService.ApiUser, token: string) {
  return {
    userId: user._id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    mood: user.mood,
    token,
    isAuthenticated: true,
  };
}

export const useUserStore = create<UserStore>((set, get) => ({
  userId: null,
  name: null,
  username: null,
  avatar: null,
  mood: 'Happy',
  token: null,
  isAuthenticated: false,

  register: async (params) => {
    const { user, token } = await apiService.register(params);
    set(applyUser(user, token));
  },

  login: async (params) => {
    const { user, token } = await apiService.login(params);
    set(applyUser(user, token));
  },

  logout: () => {
    void apiService.clearStorage();
    set({
      userId: null,
      name: null,
      username: null,
      avatar: null,
      mood: 'Happy',
      token: null,
      isAuthenticated: false,
    });
  },

  setMood: async (mood) => {
    const { userId } = get();
    if (!userId) return;
    const updated = await apiService.updateMood(userId, mood);
    set({ mood: updated.mood });
  },

  setAvatar: async (avatar) => {
    const { userId } = get();
    if (!userId) return;
    const updated = await apiService.updateAvatar(userId, avatar);
    set({ avatar: updated.avatar });
  },

  loadFromStorage: async () => {
    const [token, user] = await Promise.all([
      apiService.getStoredToken(),
      apiService.getStoredUser(),
    ]);
    if (token && user) {
      set(applyUser(user, token));
    }
  },
}));
