/**
 * LocalGameService — full offline Ludo engine, no server required.
 * Mirrors the backend game-state and board utilities in pure TS.
 */
import { uuidv4 } from '../utils/uuid';
import {
  GameConfig,
  GameRules,
  GameState,
  MoodType,
  Player,
  PlayerColor,
  Token,
  TokenState,
} from '../types/game.types';
import {
  BASE_POSITION,
  BOARD_SIZE,
  CENTER_POSITION,
  HOME_COLUMN_SIZE,
  HOME_COLUMN_START,
  HOME_ENTRY_POSITION,
  PLAYER_START_POSITIONS,
  SAFE_POSITIONS,
} from '../constants/board.constants';

// ─── Constants ────────────────────────────────────────────────────────────────

export const COLOR_ORDER: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

// Diagonal pairs so bots sit opposite the human(s)
// Key = human color(s) → bot color(s)
export const DIAGONAL_BOT_COLORS: Record<PlayerColor, PlayerColor> = {
  red: 'yellow',
  green: 'blue',
  yellow: 'red',
  blue: 'green',
};

export const LOCAL_DEFAULT_CONFIG: GameConfig = {
  maxPlayers: 4,
  tokensPerPlayer: 4,
  allowTeams: false,
  turnTimeoutSeconds: 0,
  enableGifts: false,
  enableReactions: false,
  enableSecretMessages: false,
  enableVoiceChat: false,
};

export const LOCAL_DEFAULT_RULES: GameRules = {
  requireSixToStart: true,
  extraTurnOnSix: true,
  extraTurnOnCapture: true,  // extra turn when capturing an opponent's token
  maxConsecutiveSixes: 3,
  teamMode: false,
};

// ─── Core Movement ────────────────────────────────────────────────────────────

interface MoveResult {
  valid: boolean;
  reason?: string;
  newPosition: number;
  newState: TokenState;
  newHomeColumnIndex: number;
  capturedTokenId: string | null;
  isWin: boolean;
  extraTurn: boolean;
}

function calculateNewPosition(
  token: Token,
  diceValue: number,
): { newPosition: number; newState: TokenState; newHomeColumnIndex: number } {
  if (token.state === 'base') {
    if (diceValue === 6) {
      return {
        newPosition: PLAYER_START_POSITIONS[token.color],
        newState: 'active',
        newHomeColumnIndex: -1,
      };
    }
    return { newPosition: token.position, newState: 'base', newHomeColumnIndex: -1 };
  }

  if (token.state === 'finished') {
    return { newPosition: CENTER_POSITION, newState: 'finished', newHomeColumnIndex: -1 };
  }

  if (token.state === 'home_column') {
    const newIdx = token.homeColumnIndex + diceValue;
    if (newIdx === HOME_COLUMN_SIZE) {
      return { newPosition: CENTER_POSITION, newState: 'finished', newHomeColumnIndex: -1 };
    }
    if (newIdx > HOME_COLUMN_SIZE) {
      return {
        newPosition: token.position,
        newState: 'home_column',
        newHomeColumnIndex: token.homeColumnIndex,
      };
    }
    return {
      newPosition: HOME_COLUMN_START[token.color] + newIdx,
      newState: 'home_column',
      newHomeColumnIndex: newIdx,
    };
  }

  // Active on main ring
  const homeEntry = HOME_ENTRY_POSITION[token.color];
  const stepsToEntry =
    token.position <= homeEntry
      ? homeEntry - token.position
      : BOARD_SIZE - token.position + homeEntry;

  if (diceValue > stepsToEntry) {
    const homeSteps = diceValue - stepsToEntry - 1;
    // homeSteps 0..HOME_COLUMN_SIZE-1 → inside home column
    // homeSteps === HOME_COLUMN_SIZE → exact finish (center)
    // homeSteps > HOME_COLUMN_SIZE → overshoot, can't move
    if (homeSteps > HOME_COLUMN_SIZE) {
      return { newPosition: token.position, newState: 'active', newHomeColumnIndex: -1 };
    }
    if (homeSteps === HOME_COLUMN_SIZE) {
      return { newPosition: CENTER_POSITION, newState: 'finished', newHomeColumnIndex: -1 };
    }
    return {
      newPosition: HOME_COLUMN_START[token.color] + homeSteps,
      newState: 'home_column',
      newHomeColumnIndex: homeSteps,
    };
  }

  return {
    newPosition: (token.position + diceValue) % BOARD_SIZE,
    newState: 'active',
    newHomeColumnIndex: -1,
  };
}

function checkCapture(moving: Token, newPos: number, allTokens: Token[]): Token | null {
  if (SAFE_POSITIONS.includes(newPos)) return null;
  const opponents = allTokens.filter(
    (t) => t.playerId !== moving.playerId && t.position === newPos && t.state === 'active',
  );
  if (opponents.length >= 2) return null; // block — can't capture
  return opponents[0] ?? null;
}

function checkWin(tokens: Token[], playerId: string): boolean {
  const mine = tokens.filter((t) => t.playerId === playerId);
  return mine.length > 0 && mine.every((t) => t.state === 'finished');
}

function validateMove(token: Token, diceValue: number, allTokens: Token[], rules: GameRules): MoveResult {
  if (token.state === 'finished') {
    return { valid: false, reason: 'finished', newPosition: token.position, newState: 'finished', newHomeColumnIndex: -1, capturedTokenId: null, isWin: false, extraTurn: false };
  }
  if (token.state === 'base' && diceValue !== 6 && rules.requireSixToStart) {
    return { valid: false, reason: 'need 6', newPosition: token.position, newState: 'base', newHomeColumnIndex: -1, capturedTokenId: null, isWin: false, extraTurn: false };
  }

  const { newPosition, newState, newHomeColumnIndex } = calculateNewPosition(token, diceValue);

  if (newState !== 'finished' && newPosition === token.position) {
    return { valid: false, reason: 'overshoot', newPosition, newState, newHomeColumnIndex, capturedTokenId: null, isWin: false, extraTurn: false };
  }

  const captured = newState === 'active' ? checkCapture(token, newPosition, allTokens) : null;
  const isWin = newState === 'finished' && checkWin(
    allTokens.map((t) =>
      t.tokenId === token.tokenId ? { ...t, state: newState, position: newPosition } : t,
    ),
    token.playerId,
  );

  const extraTurn =
    (diceValue === 6 && rules.extraTurnOnSix) ||
    (captured !== null && rules.extraTurnOnCapture) ||
    newState === 'finished'; // extra turn when a token reaches home

  return { valid: true, newPosition, newState, newHomeColumnIndex, capturedTokenId: captured?.tokenId ?? null, isWin, extraTurn };
}

// ─── Valid Moves ──────────────────────────────────────────────────────────────

export function getValidMoves(tokens: Token[], playerId: string, diceValue: number, rules: GameRules): string[] {
  return tokens
    .filter((t) => t.playerId === playerId && t.state !== 'finished')
    .filter((token) => {
      if (token.state === 'base') return !rules.requireSixToStart || diceValue === 6;
      const { newPosition, newState } = calculateNewPosition(token, diceValue);
      return newState === 'finished' || newPosition !== token.position;
    })
    .map((t) => t.tokenId);
}

// ─── Turn Helpers ─────────────────────────────────────────────────────────────

function getNextTurn(currentId: string, players: Player[], extraTurn: boolean): string {
  if (extraTurn) return currentId;
  const active = players.filter((p) => p.isConnected);
  const currentPlayer = active.find((p) => p.playerId === currentId);
  if (!currentPlayer) return active[0]?.playerId ?? currentId;
  // Always advance clockwise: red → green → yellow → blue → red
  const currentColorIdx = COLOR_ORDER.indexOf(currentPlayer.color);
  for (let step = 1; step <= COLOR_ORDER.length; step++) {
    const nextColor = COLOR_ORDER[(currentColorIdx + step) % COLOR_ORDER.length];
    const next = active.find((p) => p.color === nextColor);
    if (next) return next.playerId;
  }
  return currentId;
}

// ─── State Mutations ──────────────────────────────────────────────────────────

export function applyLocalDiceRoll(state: GameState, diceValue: number, playerId: string): GameState {
  const consecutiveSixes = diceValue === 6 ? state.consecutiveSixes + 1 : 0;

  if (consecutiveSixes >= state.rules.maxConsecutiveSixes) {
    return {
      ...state,
      diceValue: null,   // clear so next player can roll
      diceRolledBy: null,
      consecutiveSixes: 0,
      validMoves: [],
      currentTurn: getNextTurn(playerId, state.players, false),
      sequenceNumber: state.sequenceNumber + 1,
    };
  }

  const validMoves = getValidMoves(state.tokens, playerId, diceValue, state.rules);
  if (validMoves.length === 0) {
    return {
      ...state,
      diceValue: null,   // clear so next player can roll immediately
      diceRolledBy: null,
      consecutiveSixes,
      validMoves: [],
      currentTurn: getNextTurn(playerId, state.players, false),
      sequenceNumber: state.sequenceNumber + 1,
    };
  }

  return {
    ...state,
    diceValue,
    diceRolledBy: playerId,
    consecutiveSixes,
    validMoves,
    sequenceNumber: state.sequenceNumber + 1,
  };
}

export function applyLocalTokenMove(
  state: GameState,
  tokenId: string,
): { newState: GameState; fromPosition: number; toPosition: number; capturedTokenId: string | null; isWin: boolean } {
  const token = state.tokens.find((t) => t.tokenId === tokenId);
  if (!token || state.diceValue === null) {
    return { newState: state, fromPosition: -1, toPosition: -1, capturedTokenId: null, isWin: false };
  }

  const result = validateMove(token, state.diceValue, state.tokens, state.rules);
  if (!result.valid) {
    return { newState: state, fromPosition: token.position, toPosition: token.position, capturedTokenId: null, isWin: false };
  }

  const updatedTokens = state.tokens.map((t): Token => {
    if (t.tokenId === tokenId) {
      return { ...t, position: result.newPosition, state: result.newState, homeColumnIndex: result.newHomeColumnIndex };
    }
    if (result.capturedTokenId && t.tokenId === result.capturedTokenId) {
      return { ...t, state: 'base', position: BASE_POSITION, homeColumnIndex: -1 };
    }
    return t;
  });

  if (result.isWin) {
    return {
      newState: { ...state, tokens: updatedTokens, phase: 'finished', diceValue: null, diceRolledBy: null, validMoves: [], sequenceNumber: state.sequenceNumber + 1 },
      fromPosition: token.position,
      toPosition: result.newPosition,
      capturedTokenId: result.capturedTokenId,
      isWin: true,
    };
  }

  return {
    newState: {
      ...state,
      tokens: updatedTokens,
      currentTurn: getNextTurn(state.currentTurn, state.players, result.extraTurn),
      diceValue: null,
      diceRolledBy: null,
      consecutiveSixes: result.extraTurn ? state.consecutiveSixes : 0,
      validMoves: [],
      turnCount: state.turnCount + 1,
      sequenceNumber: state.sequenceNumber + 1,
    },
    fromPosition: token.position,
    toPosition: result.newPosition,
    capturedTokenId: result.capturedTokenId,
    isWin: false,
  };
}

// ─── Bot AI ───────────────────────────────────────────────────────────────────

export function getBotMove(
  validTokenIds: string[],
  tokens: Token[],
  botPlayerId: string,
  diceValue: number,
): string {
  if (validTokenIds.length === 1) return validTokenIds[0];

  const opponentActives = tokens.filter((t) => t.playerId !== botPlayerId && t.state === 'active');

  const scored = validTokenIds.map((tokenId) => {
    const token = tokens.find((t) => t.tokenId === tokenId);
    if (!token) return { tokenId, score: -999_999 };

    const { newPosition, newState } = calculateNewPosition(token, diceValue);
    let score = 0;

    // ① Finish a token — always the best outcome
    if (newState === 'finished') return { tokenId, score: 1_000_000 };

    // ② Capture an opponent's lone token on the landing square
    if (newState === 'active' && !SAFE_POSITIONS.includes(newPosition)) {
      const capturables = opponentActives.filter((t) => t.position === newPosition);
      if (capturables.length === 1) score += 50_000;
    }

    // ③ Advance inside home column — closer to finishing
    if (newState === 'home_column') {
      const newIdx = Math.max(0, token.homeColumnIndex) + diceValue;
      score += 20_000 + newIdx * 600;
    }

    // ④ Enter the home column from the main ring
    if (token.state === 'active' && newState === 'home_column') {
      score += 12_000;
    }

    // ⑤ Land on a safe square (guaranteed protection from capture)
    if (newState === 'active' && SAFE_POSITIONS.includes(newPosition)) {
      score += 4_000;
    }

    // ⑥ Advance an active token — score by progress, penalise landing near threats
    if (newState === 'active' && token.state === 'active') {
      const startPos = PLAYER_START_POSITIONS[token.color];
      const newProgress = (newPosition - startPos + BOARD_SIZE) % BOARD_SIZE;
      score += newProgress * 10;

      // Each opponent token within 6 steps behind us is a threat
      for (const opp of opponentActives) {
        const dist = (newPosition - opp.position + BOARD_SIZE) % BOARD_SIZE;
        if (dist > 0 && dist <= 6 && !SAFE_POSITIONS.includes(newPosition)) {
          score -= 2_500;
        }
      }
    }

    // ⑦ Bring a token out of base — urgency scales with how few are on the board
    if (token.state === 'base' && newState === 'active') {
      const onBoard = tokens.filter(
        (t) => t.playerId === botPlayerId && (t.state === 'active' || t.state === 'home_column'),
      ).length;
      score += 600 + Math.max(0, 3 - onBoard) * 1_200;
    }

    return { tokenId, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].tokenId;
}

// ─── Game Initialization ──────────────────────────────────────────────────────

export interface LocalPlayerSetup {
  name: string;
  avatar: string;
  mood: MoodType;
  color: PlayerColor;
  isBot: boolean;
  userId: string;
}

export function createLocalGameState(players: LocalPlayerSetup[], config?: Partial<GameConfig>): GameState {
  const gamePlayers: Player[] = players.map((p, i) => ({
    playerId: uuidv4(),
    userId: p.userId,
    socketId: '',
    color: p.color,
    name: p.name,
    avatar: p.avatar,
    mood: p.mood,
    isReady: true,
    isConnected: true,
    isHost: i === 0,
    isBot: p.isBot,
  }));

  const mergedConfig: GameConfig = { ...LOCAL_DEFAULT_CONFIG, ...config };
  const tokens: Token[] = [];
  for (const player of gamePlayers) {
    for (let i = 0; i < mergedConfig.tokensPerPlayer; i++) {
      tokens.push({
        tokenId: `${player.color}_${i}`,
        playerId: player.playerId,
        color: player.color,
        state: 'base',
        position: BASE_POSITION,
        homeColumnIndex: -1,
      });
    }
  }

  return {
    roomId: `local_${uuidv4()}`,
    players: gamePlayers,
    teams: null,
    tokens,
    currentTurn: gamePlayers[0].playerId,
    diceValue: null,
    diceRolledBy: null,
    phase: 'playing',
    config: mergedConfig,
    rules: { ...LOCAL_DEFAULT_RULES },
    turnCount: 0,
    consecutiveSixes: 0,
    validMoves: [],
    lastEventId: null,
    sequenceNumber: 0,
    startedAt: new Date().toISOString(),
  };
}

// ─── LocalGameService ─────────────────────────────────────────────────────────

export type LocalGameEvent =
  | { type: 'DICE_ROLLED'; playerId: string; diceValue: number; validMoves: string[] }
  | { type: 'TOKEN_MOVED'; tokenId: string; fromPosition: number; toPosition: number; capturedTokenId: string | null }
  | { type: 'PLAYER_TURN'; playerId: string; playerName: string }
  | { type: 'PLAYER_RANKED'; playerId: string; playerName: string; rank: number }
  | { type: 'GAME_FINISHED'; winnerId: string; winnerName: string };

type EventListener = (event: LocalGameEvent) => void;

export class LocalGameService {
  private state: GameState;
  private listeners: EventListener[] = [];
  private botTimer: ReturnType<typeof setTimeout> | null = null;
  private rankings: string[] = [];

  constructor(players: LocalPlayerSetup[], config?: Partial<GameConfig>) {
    this.state = createLocalGameState(players, config);
  }

  getState(): GameState {
    return this.state;
  }

  on(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: LocalGameEvent) {
    this.listeners.forEach((l) => l(event));
  }

  /** Call after mounting to start the first turn (schedules bot if needed). */
  start() {
    this.scheduleNextTurnIfBot();
  }

  /**
   * DEV ONLY — teleport a player's tokens to positions that exercise home-column
   * entry in the very next roll, without having to play a full game:
   *   token 0 → main ring, 4 steps before home entry  (tests entry with dice 5)
   *   token 1 → main ring, 1 step before home entry   (tests entry with dice 2)
   *   token 2 → home column index 0                   (tests mid-column movement)
   *   token 3 → home column index 3                   (tests finishing with dice 2)
   */
  teleportToTestPositions(playerId: string): void {
    const player = this.state.players.find((p) => p.playerId === playerId);
    if (!player) return;

    const homeEntry = HOME_ENTRY_POSITION[player.color];
    const homeColStart = HOME_COLUMN_START[player.color];

    const slots = [
      { position: (homeEntry - 4 + BOARD_SIZE) % BOARD_SIZE, state: 'active' as const, homeColumnIndex: -1 },
      { position: (homeEntry - 1 + BOARD_SIZE) % BOARD_SIZE, state: 'active' as const, homeColumnIndex: -1 },
      { position: homeColStart,     state: 'home_column' as const, homeColumnIndex: 0 },
      { position: homeColStart + 3, state: 'home_column' as const, homeColumnIndex: 3 },
    ];

    const playerTokens = this.state.tokens.filter((t) => t.playerId === playerId);
    const updatedTokens = this.state.tokens.map((t) => {
      if (t.playerId !== playerId) return t;
      const idx = playerTokens.findIndex((pt) => pt.tokenId === t.tokenId);
      const slot = slots[idx];
      return slot ? { ...t, position: slot.position, state: slot.state, homeColumnIndex: slot.homeColumnIndex } : t;
    });

    this.state = {
      ...this.state,
      tokens: updatedTokens,
      currentTurn: playerId,
      diceValue: null,
      diceRolledBy: null,
      validMoves: [],
      consecutiveSixes: 0,
      phase: 'playing',
      sequenceNumber: this.state.sequenceNumber + 1,
    };

    this.emit({ type: 'PLAYER_TURN', playerId, playerName: player.name });
  }

  rollDice(): void {
    const { currentTurn, players, diceValue } = this.state;
    // Ignore if dice already rolled or not in playing phase
    if (this.state.phase !== 'playing' || diceValue !== null) return;
    const currentPlayer = players.find((p) => p.playerId === currentTurn);
    if (!currentPlayer || currentPlayer.isBot) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    this.state = applyLocalDiceRoll(this.state, roll, currentTurn);
    this.emit({ type: 'DICE_ROLLED', playerId: currentTurn, diceValue: roll, validMoves: this.state.validMoves });

    if (this.state.validMoves.length === 0) {
      // Wait for dice animation (700ms) + show result briefly before advancing turn
      this.botTimer = setTimeout(() => this.emitTurnAndScheduleBot(), 1800);
    }
  }

  moveToken(tokenId: string): void {
    if (this.state.phase !== 'playing') return;
    if (!this.state.validMoves.includes(tokenId)) return;

    const { newState, fromPosition, toPosition, capturedTokenId, isWin } = applyLocalTokenMove(this.state, tokenId);
    this.state = newState;
    this.emit({ type: 'TOKEN_MOVED', tokenId, fromPosition, toPosition, capturedTokenId });

    if (isWin) {
      this.handlePlayerWin();
      return;
    }

    this.emitTurnAndScheduleBot();
  }

  private handlePlayerWin() {
    const winner = this.state.players.find((p) =>
      this.state.tokens.filter((t) => t.playerId === p.playerId && t.state === 'finished').length === this.state.config.tokensPerPlayer,
    );
    if (!winner) return;

    this.rankings.push(winner.playerId);
    this.emit({ type: 'PLAYER_RANKED', playerId: winner.playerId, playerName: winner.name, rank: this.rankings.length });

    // Compute next turn BEFORE removing winner from rotation
    const nextTurn = getNextTurn(winner.playerId, this.state.players, false);

    const updatedPlayers = this.state.players.map((p) =>
      p.playerId === winner.playerId ? { ...p, isConnected: false } : p,
    );
    const remaining = updatedPlayers.filter((p) => p.isConnected);

    if (remaining.length <= 1) {
      if (remaining.length === 1) {
        this.rankings.push(remaining[0].playerId);
        this.emit({ type: 'PLAYER_RANKED', playerId: remaining[0].playerId, playerName: remaining[0].name, rank: this.rankings.length });
      }
      this.state = { ...this.state, players: updatedPlayers, phase: 'finished' };
      this.emit({ type: 'GAME_FINISHED', winnerId: winner.playerId, winnerName: winner.name });
      return;
    }

    // More than one player still active — continue the game
    this.state = {
      ...this.state,
      players: updatedPlayers,
      phase: 'playing',
      currentTurn: nextTurn,
      diceValue: null,
      diceRolledBy: null,
      validMoves: [],
      consecutiveSixes: 0,
      sequenceNumber: this.state.sequenceNumber + 1,
    };

    this.emitTurnAndScheduleBot();
  }

  private emitTurnAndScheduleBot() {
    const currentPlayer = this.state.players.find((p) => p.playerId === this.state.currentTurn);
    if (!currentPlayer) return;
    this.emit({ type: 'PLAYER_TURN', playerId: currentPlayer.playerId, playerName: currentPlayer.name });
    this.scheduleNextTurnIfBot();
  }

  private scheduleNextTurnIfBot() {
    if (this.botTimer) clearTimeout(this.botTimer);
    const currentPlayer = this.state.players.find((p) => p.playerId === this.state.currentTurn);
    if (!currentPlayer || !currentPlayer.isBot) return;
    if (this.state.phase !== 'playing') return;

    const rollDelay = 1500 + Math.random() * 700;
    this.botTimer = setTimeout(() => this.doBotRoll(), rollDelay);
  }

  private doBotRoll() {
    if (this.state.phase !== 'playing') return;
    const { currentTurn } = this.state;
    const roll = Math.floor(Math.random() * 6) + 1;
    this.state = applyLocalDiceRoll(this.state, roll, currentTurn);
    this.emit({ type: 'DICE_ROLLED', playerId: currentTurn, diceValue: roll, validMoves: this.state.validMoves });

    if (this.state.validMoves.length === 0) {
      // Same wait as human: show dice result before advancing turn
      this.botTimer = setTimeout(() => this.emitTurnAndScheduleBot(), 1800);
      return;
    }

    // Dice animation (600ms) + glow period so human can see bot's options
    const moveDelay = 1700 + Math.random() * 500;
    this.botTimer = setTimeout(() => this.doBotMove(), moveDelay);
  }

  private doBotMove() {
    if (this.state.phase !== 'playing') return;
    const { currentTurn, validMoves, tokens, diceValue } = this.state;
    if (validMoves.length === 0 || diceValue === null) return;

    const chosen = getBotMove(validMoves, tokens, currentTurn, diceValue);
    const { newState, fromPosition, toPosition, capturedTokenId, isWin } = applyLocalTokenMove(this.state, chosen);
    this.state = newState;
    this.emit({ type: 'TOKEN_MOVED', tokenId: chosen, fromPosition, toPosition, capturedTokenId });

    if (isWin) {
      this.handlePlayerWin();
      return;
    }

    this.emitTurnAndScheduleBot();
  }

  destroy() {
    if (this.botTimer) clearTimeout(this.botTimer);
    this.listeners = [];
  }
}
