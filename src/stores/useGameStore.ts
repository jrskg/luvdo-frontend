import { create } from 'zustand';
import { uuidv4 } from '../utils/uuid';
import {
  AnimationQueueItem,
  GameConfig,
  GameRules,
  GameState,
  Player,
  RoomInfo,
  Token,
} from '../types/game.types';

interface GameStore {
  gameState: GameState | null;
  roomInfo: RoomInfo | null;
  isInRoom: boolean;
  isGameStarted: boolean;
  animationQueue: AnimationQueueItem[];

  // Actions
  applyServerState: (serverState: GameState) => void;
  setRoomInfo: (info: RoomInfo) => void;
  setGameStarted: (state: GameState) => void;
  clearGame: () => void;
  updatePlayers: (players: Player[]) => void;
  updateConfig: (config: Partial<GameConfig>) => void;
  updateRules: (rules: Partial<GameRules>) => void;

  // Animation queue
  enqueueAnimation: (item: Omit<AnimationQueueItem, 'id'>) => void;
  dequeueAnimation: () => void;

  // Derived helpers
  getMyTokens: (myUserId: string) => Token[];
  canRollDice: (myUserId: string) => boolean;
  isMyTurn: (myUserId: string) => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  roomInfo: null,
  isInRoom: false,
  isGameStarted: false,
  animationQueue: [],

  applyServerState: (serverState) => {
    set({ gameState: serverState });
  },

  setRoomInfo: (info) => {
    set({ roomInfo: info, isInRoom: true });
  },

  setGameStarted: (state) => {
    set({ gameState: state, isGameStarted: true });
  },

  clearGame: () => {
    set({
      gameState: null,
      roomInfo: null,
      isInRoom: false,
      isGameStarted: false,
      animationQueue: [],
    });
  },

  updatePlayers: (players) => {
    set((s) => ({
      roomInfo: s.roomInfo ? { ...s.roomInfo, players } : s.roomInfo,
      gameState: s.gameState ? { ...s.gameState, players } : s.gameState,
    }));
  },

  updateConfig: (config) => {
    set((s) => ({
      roomInfo: s.roomInfo ? { ...s.roomInfo, config: { ...s.roomInfo.config, ...config } } : s.roomInfo,
    }));
  },

  updateRules: (rules) => {
    set((s) => ({
      roomInfo: s.roomInfo ? { ...s.roomInfo, rules: { ...s.roomInfo.rules, ...rules } } : s.roomInfo,
    }));
  },

  enqueueAnimation: (item) => {
    set((s) => ({
      animationQueue: [...s.animationQueue, { id: uuidv4(), ...item }],
    }));
  },

  dequeueAnimation: () => {
    set((s) => ({ animationQueue: s.animationQueue.slice(1) }));
  },

  getMyTokens: (myUserId) => {
    const { gameState } = get();
    if (!gameState) return [];
    const me = gameState.players.find((p) => p.userId === myUserId);
    if (!me) return [];
    return gameState.tokens.filter((t) => t.playerId === me.playerId);
  },

  canRollDice: (myUserId) => {
    const { gameState } = get();
    if (!gameState || gameState.phase !== 'playing') return false;
    const me = gameState.players.find((p) => p.userId === myUserId);
    return !!me && gameState.currentTurn === me.playerId && gameState.diceValue === null;
  },

  isMyTurn: (myUserId) => {
    const { gameState } = get();
    if (!gameState) return false;
    const me = gameState.players.find((p) => p.userId === myUserId);
    return !!me && gameState.currentTurn === me.playerId;
  },
}));
