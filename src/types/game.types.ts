// Mirrors backend game.types.ts with frontend-specific additions

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
export type TokenState = 'base' | 'active' | 'home_column' | 'finished';
export type GamePhase = 'waiting' | 'playing' | 'finished';
export type MoodType = 'Happy' | 'Angry' | 'Missing';
export type ReactionType = 'heart' | 'laugh' | 'angry' | 'kiss' | 'wow' | 'cry';
export type GiftType = 'rose' | 'chocolate' | 'ring' | 'teddy' | 'fireworks';
export type TriggerCondition = 'on_win' | 'on_capture' | 'on_six' | 'manual';

export interface Token {
  tokenId: string;
  playerId: string;
  color: PlayerColor;
  state: TokenState;
  position: number;
  homeColumnIndex: number;
}

export interface Player {
  playerId: string;
  userId: string;
  socketId: string;
  color: PlayerColor;
  name: string;
  avatar: string;
  mood: MoodType;
  isReady: boolean;
  isConnected: boolean;
  isHost: boolean;
  isBot?: boolean;
}

export interface Team {
  teamId: string;
  name: string;
  playerIds: string[];
  colors: PlayerColor[];
}

export interface GameConfig {
  maxPlayers: 2 | 4;
  tokensPerPlayer: 2 | 4;
  allowTeams: boolean;
  turnTimeoutSeconds: number;
  enableGifts: boolean;
  enableReactions: boolean;
  enableSecretMessages: boolean;
  enableVoiceChat: boolean;
}

export interface GameRules {
  requireSixToStart: boolean;
  extraTurnOnSix: boolean;
  extraTurnOnCapture: boolean;
  maxConsecutiveSixes: number;
  teamMode: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  teams: Team[] | null;
  tokens: Token[];
  currentTurn: string;
  diceValue: number | null;
  diceRolledBy: string | null;
  phase: GamePhase;
  config: GameConfig;
  rules: GameRules;
  turnCount: number;
  consecutiveSixes: number;
  validMoves: string[];
  lastEventId: string | null;
  sequenceNumber: number;
  startedAt: string | null;
}

// Frontend-only: active animation queue item
export interface AnimationQueueItem {
  id: string;
  type: 'token_move' | 'capture' | 'dice_roll' | 'reaction' | 'gift' | 'win';
  data: Record<string, unknown>;
}

// Frontend-only: room info before game starts
export interface RoomInfo {
  roomId: string;
  roomName: string;
  players: Player[];
  config: GameConfig;
  rules: GameRules;
  isHost: boolean;
  isBotGame?: boolean;
}

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  heart: '❤️',
  laugh: '😂',
  angry: '😡',
  kiss: '😘',
  wow: '🔥',
  cry: '😭',
};

export const GIFT_EMOJIS: Record<GiftType, string> = {
  rose: '🌹',
  chocolate: '🍫',
  ring: '💍',
  teddy: '🧸',
  fireworks: '🎆',
};

export const MOOD_EMOJIS: Record<MoodType, string> = {
  Happy: '😊',
  Angry: '😠',
  Missing: '🥺',
};

export const MOOD_COLORS: Record<MoodType, string> = {
  Happy: '#FF6B6B',
  Angry: '#E53E3E',
  Missing: '#9F7AEA',
};
