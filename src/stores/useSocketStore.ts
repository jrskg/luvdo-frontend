import { create } from 'zustand';
import { socketService } from '../services/socket.service';
import { webrtcService } from '../services/webrtc.service';
import { SOCKET_EVENTS } from '../constants/socket-events';
import { useGameStore } from './useGameStore';
import { useToastStore } from './useToastStore';
import {
  GiftType,
  ReactionType,
  RoomInfo,
  TriggerCondition,
} from '../types/game.types';

export interface AnimationCallbacks {
  onDiceRolled?: (value: number, validMoves: string[], byPlayerId: string) => void;
  onTokenMoved?: (tokenId: string, from: number, to: number, capturedTokenId: string | null) => void;
  onReactionReceived?: (type: ReactionType, fromPlayerId: string, fromName: string) => void;
  onGiftReceived?: (type: GiftType, fromPlayerId: string, fromName: string, message?: string) => void;
  onSecretMessage?: (message: string, fromName: string, condition: TriggerCondition) => void;
  onGameFinished?: (winnerId: string, winnerName: string) => void;
  onPlayerTurn?: (playerId: string, playerName: string, timeoutSeconds: number) => void;
}

interface SocketStore {
  isConnected: boolean;
  connectionError: string | null;
  gameError: string | null;
  animationCallbacks: AnimationCallbacks;

  connect: (token: string) => void;
  clearGameError: () => void;
  disconnect: () => void;
  emit: (event: string, payload?: unknown) => void;
  registerAnimationCallbacks: (callbacks: AnimationCallbacks) => void;
  clearAnimationCallbacks: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  isConnected: false,
  connectionError: null,
  gameError: null,
  animationCallbacks: {},

  connect: (token) => {
    socketService.connect(token);

    const gameSocket = socketService.getGameSocket()!;
    const webrtcSocket = socketService.getWebRTCSocket()!;

    // Attach WebRTC signaling socket
    webrtcService.attachSignalingSocket(webrtcSocket);

    gameSocket.on('connect', () => set({ isConnected: true, connectionError: null }));
    gameSocket.on('disconnect', () => set({ isConnected: false }));
    gameSocket.on('connect_error', (err) => set({ connectionError: err.message }));
    gameSocket.on(SOCKET_EVENTS.GAME_ERROR, (payload: any) => {
      const msg = payload?.message ?? 'Something went wrong';
      set({ gameError: msg });
      useToastStore.getState().show(msg, 'error');
    });

    // ─── Game State Events ───────────────────────────────────────────────────────

    gameSocket.on(SOCKET_EVENTS.ROOM_JOINED, (payload: RoomInfo) => {
      useGameStore.getState().setRoomInfo(payload);
    });

    gameSocket.on(SOCKET_EVENTS.PLAYER_JOINED, (payload: any) => {
      // backend emits { player, totalPlayers } — append to existing list
      if (payload.player) {
        const current = useGameStore.getState().roomInfo?.players ?? [];
        const exists = current.find((p) => p.playerId === payload.player.playerId);
        if (!exists) useGameStore.getState().updatePlayers([...current, payload.player]);
      } else if (payload.players) {
        useGameStore.getState().updatePlayers(payload.players);
      }
    });

    gameSocket.on(SOCKET_EVENTS.GAME_STARTED, (payload: any) => {
      useGameStore.getState().setGameStarted(payload.gameState);
    });

    gameSocket.on(SOCKET_EVENTS.STATE_SYNC, (payload: any) => {
      useGameStore.getState().applyServerState(payload.gameState);
    });

    gameSocket.on(SOCKET_EVENTS.STATE_UPDATED, (payload: any) => {
      if (payload.gameState) {
        useGameStore.getState().applyServerState(payload.gameState);
      }
      if (payload.players) useGameStore.getState().updatePlayers(payload.players);
      if (payload.config) useGameStore.getState().updateConfig(payload.config);
      if (payload.rules) useGameStore.getState().updateRules(payload.rules);
    });

    gameSocket.on(SOCKET_EVENTS.DICE_ROLLED, (payload: any) => {
      useGameStore.getState().applyServerState(payload.gameState);
      get().animationCallbacks.onDiceRolled?.(
        payload.diceValue,
        payload.validMoves,
        payload.playerId,
      );
    });

    gameSocket.on(SOCKET_EVENTS.TOKEN_MOVED, (payload: any) => {
      useGameStore.getState().applyServerState(payload.gameState);
      get().animationCallbacks.onTokenMoved?.(
        payload.tokenId,
        payload.fromPosition,
        payload.toPosition,
        payload.capturedTokenId,
      );
    });

    gameSocket.on(SOCKET_EVENTS.PLAYER_TURN, (payload: any) => {
      get().animationCallbacks.onPlayerTurn?.(
        payload.playerId,
        payload.playerName,
        payload.timeoutSeconds,
      );
    });

    // ─── Couple-Centric Events ───────────────────────────────────────────────────

    gameSocket.on(SOCKET_EVENTS.REACTION_RECEIVED, (payload: any) => {
      get().animationCallbacks.onReactionReceived?.(
        payload.reactionType,
        payload.fromPlayerId,
        payload.fromPlayerName,
      );
    });

    gameSocket.on(SOCKET_EVENTS.GIFT_RECEIVED, (payload: any) => {
      get().animationCallbacks.onGiftReceived?.(
        payload.giftType,
        payload.fromPlayerId,
        payload.fromPlayerName,
        payload.message,
      );
    });

    gameSocket.on(SOCKET_EVENTS.SECRET_MESSAGE_TRIGGERED, (payload: any) => {
      get().animationCallbacks.onSecretMessage?.(
        payload.message,
        payload.fromPlayerName,
        payload.triggerCondition,
      );
    });

    gameSocket.on(SOCKET_EVENTS.GAME_FINISHED, (payload: any) => {
      useGameStore.getState().applyServerState(payload.gameState);
      get().animationCallbacks.onGameFinished?.(payload.winnerId, payload.winnerName);
    });
  },

  clearGameError: () => set({ gameError: null }),

  disconnect: () => {
    socketService.disconnect();
    set({ isConnected: false });
  },

  emit: (event, payload) => {
    const socket = socketService.getGameSocket();
    if (socket?.connected) {
      socket.emit(event, payload);
    }
  },

  registerAnimationCallbacks: (callbacks) => {
    set({ animationCallbacks: callbacks });
  },

  clearAnimationCallbacks: () => {
    set({ animationCallbacks: {} });
  },
}));
