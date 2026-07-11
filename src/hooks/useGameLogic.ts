import { useMemo } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useUserStore } from '../stores/useUserStore';
import { Player, Token } from '../types/game.types';

export function useGameLogic() {
  const gameState = useGameStore((s) => s.gameState);
  const userId = useUserStore((s) => s.userId);

  return useMemo(() => {
    if (!gameState || !userId) {
      return {
        isMyTurn: false,
        myPlayer: null as Player | null,
        myTokens: [] as Token[],
        opponentPlayers: [] as Player[],
        canRollDice: false,
        canMoveToken: false,
        validMoveTokenIds: [] as string[],
        currentPlayer: null as Player | null,
        phase: 'waiting' as const,
        diceValue: null as number | null,
      };
    }

    const myPlayer = gameState.players.find((p) => p.userId === userId) ?? null;
    const isMyTurn = myPlayer !== null && gameState.currentTurn === myPlayer.playerId;
    const myTokens = myPlayer
      ? gameState.tokens.filter((t) => t.playerId === myPlayer.playerId)
      : [];
    const opponentPlayers = gameState.players.filter((p) => p.userId !== userId);
    const canRollDice = isMyTurn && gameState.diceValue === null && gameState.phase === 'playing';
    const canMoveToken = isMyTurn && gameState.diceValue !== null && gameState.phase === 'playing';
    const validMoveTokenIds = canMoveToken ? gameState.validMoves : [];
    const currentPlayer = gameState.players.find((p) => p.playerId === gameState.currentTurn) ?? null;

    return {
      isMyTurn,
      myPlayer,
      myTokens,
      opponentPlayers,
      canRollDice,
      canMoveToken,
      validMoveTokenIds,
      currentPlayer,
      phase: gameState.phase,
      diceValue: gameState.diceValue,
    };
  }, [gameState, userId]);
}
