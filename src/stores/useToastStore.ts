import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastStore {
  current: ToastItem | null;
  show: (message: string, type?: ToastType, duration?: number) => void;
  dismiss: () => void;
}

let _timer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastStore>((set) => ({
  current: null,

  show: (message, type = 'info', duration = 3000) => {
    if (_timer) { clearTimeout(_timer); _timer = null; }
    const id = `${Date.now()}_${Math.random()}`;
    set({ current: { id, message, type, duration } });
    _timer = setTimeout(() => {
      set({ current: null });
      _timer = null;
    }, duration);
  },

  dismiss: () => {
    if (_timer) { clearTimeout(_timer); _timer = null; }
    set({ current: null });
  },
}));
