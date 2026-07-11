import { SOUND_CONFIG, SoundKey, VOICE_CHAT_MUSIC_VOLUME } from '../config/sound.config';

// Lazy-require so the module loads even when ExpoAudio native module is absent
// (Expo Go or a build that predates expo-audio installation)
let _createAudioPlayer: ((src: any) => any) | null = null;
let _setAudioModeAsync: ((opts: any) => Promise<void>) | null = null;

try {
  const expoAudio = require('expo-audio');
  _createAudioPlayer = expoAudio.createAudioPlayer;
  _setAudioModeAsync = expoAudio.setAudioModeAsync;
} catch {
  // Native module unavailable — all sound ops will silently no-op
}

class SoundService {
  private players = new Map<SoundKey, any>();
  private bgMusicPlayer: any | null = null;
  private soundEffectsMuted = false;
  private musicMuted = false;

  async preloadAll(): Promise<void> {
    if (!_createAudioPlayer || !_setAudioModeAsync) return;
    try {
      await _setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        allowsRecording: false,
      });
    } catch {
      return;
    }

    for (const [key, config] of Object.entries(SOUND_CONFIG) as [SoundKey, typeof SOUND_CONFIG[SoundKey]][]) {
      try {
        const player = _createAudioPlayer(config.source);
        player.volume = config.volume;
        player.loop = config.loop;
        this.players.set(key, player);
        if (key === 'background_music') this.bgMusicPlayer = player;
      } catch {
        // Asset not yet available — skip gracefully
      }
    }
  }

  setSoundMuted(muted: boolean): void {
    this.soundEffectsMuted = muted;
  }

  setMusicMuted(muted: boolean): void {
    this.musicMuted = muted;
    if (!this.bgMusicPlayer) return;
    if (muted) {
      this.bgMusicPlayer.pause();
    } else {
      this.bgMusicPlayer.play();
    }
  }

  async play(key: SoundKey): Promise<void> {
    if (key !== 'background_music' && this.soundEffectsMuted) return;
    const player = this.players.get(key);
    if (!player) return;
    try {
      await player.seekTo(0);
      player.play();
    } catch {
      // Ignore playback errors
    }
  }

  async stopAll(): Promise<void> {
    for (const player of this.players.values()) {
      try {
        player.pause();
        await player.seekTo(0);
      } catch {}
    }
  }

  setVoiceChatActive(active: boolean): void {
    if (!this.bgMusicPlayer) return;
    this.bgMusicPlayer.volume = active ? VOICE_CHAT_MUSIC_VOLUME : SOUND_CONFIG.background_music.volume;
  }

  async cleanup(): Promise<void> {
    for (const player of this.players.values()) {
      try {
        player.pause();
      } catch {}
    }
    this.players.clear();
    this.bgMusicPlayer = null;
  }
}

export const soundService = new SoundService();
