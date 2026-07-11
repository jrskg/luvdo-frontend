export type SoundKey =
  | 'background_music'
  | 'dice_roll'
  | 'token_move'
  | 'capture'
  | 'reaction'
  | 'tap'
  | 'gift'
  | 'win';

export interface SoundConfig {
  // Using require() for static assets; swap paths when real assets arrive
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any;
  volume: number;
  loop: boolean;
}

// Placeholder sounds — replace sources with real assets
export const SOUND_CONFIG: Record<SoundKey, SoundConfig> = {
  background_music: {
    source: require('../../assets/sounds/background.mp3'),
    volume: 0.4,
    loop: true,
  },
  dice_roll: {
    source: require('../../assets/sounds/dice.mp3'),
    volume: 0.8,
    loop: false,
  },
  token_move: {
    source: require('../../assets/sounds/move.mp3'),
    volume: 0.7,
    loop: false,
  },
  capture: {
    source: require('../../assets/sounds/capture.mp3'),
    volume: 1.0,
    loop: false,
  },
  reaction: {
    source: require('../../assets/sounds/reaction.mp3'),
    volume: 0.9,
    loop: false,
  },
  tap: {
    source: require('../../assets/sounds/tap.mp3'),
    volume: 0.6,
    loop: false,
  },
  gift: {
    source: require('../../assets/sounds/gift.mp3'),
    volume: 1.0,
    loop: false,
  },
  win: {
    source: require('../../assets/sounds/win.mp3'),
    volume: 1.0,
    loop: false,
  },
};

export const VOICE_CHAT_MUSIC_VOLUME = 0.1; // background music ducks to this during voice
