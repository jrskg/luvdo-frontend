import { useCallback } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { AnimationQueueItem } from '../types/game.types';

interface UseAnimationQueueResult {
  currentAnimation: AnimationQueueItem | null;
  onAnimationComplete: () => void;
}

export function useAnimationQueue(): UseAnimationQueueResult {
  const animationQueue = useGameStore((s) => s.animationQueue);
  const dequeueAnimation = useGameStore((s) => s.dequeueAnimation);

  const currentAnimation = animationQueue[0] ?? null;

  const onAnimationComplete = useCallback(() => {
    dequeueAnimation();
  }, [dequeueAnimation]);

  return { currentAnimation, onAnimationComplete };
}
