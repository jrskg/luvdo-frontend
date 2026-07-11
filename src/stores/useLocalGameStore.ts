import { create } from 'zustand';
import { GameState } from '../types/game.types';
import { LocalGameService, LocalPlayerSetup } from '../services/localGame.service';

interface LocalGameStore {
  service: LocalGameService | null;
  gameState: GameState | null;
  startLocalGame: (players: LocalPlayerSetup[]) => void;
  applyEvent: (state: GameState) => void;
  clearLocalGame: () => void;
}

export const useLocalGameStore = create<LocalGameStore>((set, get) => ({
  service: null,
  gameState: null,

  startLocalGame: (players) => {
    get().service?.destroy();
    const svc = new LocalGameService(players);
    set({ service: svc, gameState: svc.getState() });
  },

  applyEvent: (state) => set({ gameState: state }),

  clearLocalGame: () => {
    get().service?.destroy();
    set({ service: null, gameState: null });
  },
}));
