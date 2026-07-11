import { create } from 'zustand';
import { webrtcService } from '../services/webrtc.service';
import { soundService } from '../services/sound.service';

type VoiceConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';

interface VoiceStore {
  isVoiceChatEnabled: boolean;
  isMuted: boolean;
  connectionState: VoiceConnectionState;

  enableVoiceChat: (targetSocketId: string) => Promise<void>;
  disableVoiceChat: () => Promise<void>;
  toggleMute: () => void;
  setConnectionState: (state: VoiceConnectionState) => void;
}

export const useVoiceStore = create<VoiceStore>((set, get) => {
  webrtcService.onConnectionStateChange = (state) => {
    const mapped: VoiceConnectionState =
      state === 'connected'
        ? 'connected'
        : state === 'connecting' || state === 'new'
        ? 'connecting'
        : state === 'disconnected'
        ? 'disconnected'
        : 'failed';
    set({ connectionState: mapped });
    if (mapped === 'connected') soundService.setVoiceChatActive(true);
    if (mapped === 'disconnected' || mapped === 'failed') soundService.setVoiceChatActive(false);
  };

  return {
    isVoiceChatEnabled: false,
    isMuted: false,
    connectionState: 'idle',

    enableVoiceChat: async (targetSocketId) => {
      set({ isVoiceChatEnabled: true, connectionState: 'connecting' });
      await webrtcService.startVoiceChat(targetSocketId);
    },

    disableVoiceChat: async () => {
      await webrtcService.cleanup();
      soundService.setVoiceChatActive(false);
      set({ isVoiceChatEnabled: false, isMuted: false, connectionState: 'idle' });
    },

    toggleMute: () => {
      const newMuted = webrtcService.toggleMute();
      set({ isMuted: newMuted });
    },

    setConnectionState: (state) => set({ connectionState: state }),
  };
});
