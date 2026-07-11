import { useRef, useCallback } from 'react';
import { uuidv4 } from '../utils/uuid';
import { useSocketStore } from '../stores/useSocketStore';
import { SOCKET_EVENTS } from '../constants/socket-events';
import { GameConfig, GameRules, GiftType, MoodType, ReactionType, TriggerCondition } from '../types/game.types';

export function useSocket() {
  const { emit, isConnected } = useSocketStore();
  const sequenceRef = useRef(0);

  const nextSeq = useCallback(() => {
    sequenceRef.current += 1;
    return sequenceRef.current;
  }, []);

  return {
    isConnected,

    createRoom: useCallback(
      (roomName: string, config?: Partial<GameConfig>, rules?: Partial<GameRules>) =>
        emit(SOCKET_EVENTS.CREATE_ROOM, { roomName, config, rules }),
      [emit],
    ),

    joinRoom: useCallback(
      (roomName: string) => emit(SOCKET_EVENTS.JOIN_ROOM, { roomName }),
      [emit],
    ),

    playerReady: useCallback(
      () => emit(SOCKET_EVENTS.PLAYER_READY, {}),
      [emit],
    ),

    rollDice: useCallback(
      () =>
        emit(SOCKET_EVENTS.ROLL_DICE, {
          clientEventId: uuidv4(),
          sequenceNumber: nextSeq(),
        }),
      [emit, nextSeq],
    ),

    moveToken: useCallback(
      (tokenId: string) =>
        emit(SOCKET_EVENTS.MOVE_TOKEN, {
          tokenId,
          clientEventId: uuidv4(),
          sequenceNumber: nextSeq(),
        }),
      [emit, nextSeq],
    ),

    sendReaction: useCallback(
      (reactionType: ReactionType, targetPlayerId?: string) =>
        emit(SOCKET_EVENTS.SEND_REACTION, { reactionType, targetPlayerId }),
      [emit],
    ),

    sendGift: useCallback(
      (giftType: GiftType, targetPlayerId: string, message?: string) =>
        emit(SOCKET_EVENTS.SEND_GIFT, { giftType, targetPlayerId, message }),
      [emit],
    ),

    sendSecretMessage: useCallback(
      (message: string, triggerCondition: TriggerCondition) =>
        emit(SOCKET_EVENTS.SEND_SECRET_MESSAGE, { message, triggerCondition }),
      [emit],
    ),

    updateMood: useCallback(
      (mood: MoodType) => emit(SOCKET_EVENTS.UPDATE_MOOD, { mood }),
      [emit],
    ),

    requestStateSync: useCallback(
      () => emit(SOCKET_EVENTS.REQUEST_STATE_SYNC, {}),
      [emit],
    ),

    updateGameConfig: useCallback(
      (config: Partial<GameConfig>) => emit(SOCKET_EVENTS.UPDATE_GAME_CONFIG, { config }),
      [emit],
    ),

    setGameRule: useCallback(
      (rules: Partial<GameRules>) => emit(SOCKET_EVENTS.SET_GAME_RULE, { rules }),
      [emit],
    ),
  };
}
