import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../constants/socket-events';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// Lazy-load to avoid crashing at startup on New Architecture builds where
// react-native-webrtc's @ReactMethod annotations are incompatible with TurboModules.
let _rn: any = null;
function rn() {
  if (!_rn) {
    try {
      _rn = require('react-native-webrtc');
    } catch (e) {
      console.warn('[WebRTC] Native module unavailable on this build:', e);
      _rn = {};
    }
  }
  return _rn;
}

class WebRTCService {
  private peerConnection: any = null;
  private localStream: any = null;
  private signalingSocket: Socket | null = null;
  private isMuted = false;

  onRemoteStream: ((stream: any) => void) | null = null;
  onConnectionStateChange: ((state: string) => void) | null = null;

  attachSignalingSocket(socket: Socket): void {
    this.signalingSocket = socket;

    socket.on(SOCKET_EVENTS.WEBRTC_OFFER, async ({ fromSocketId, offer }: any) => {
      await this.handleOffer(offer, fromSocketId);
    });

    socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, async ({ answer }: any) => {
      await this.handleAnswer(answer);
    });

    socket.on(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, async ({ candidate }: any) => {
      await this.handleIceCandidate(candidate);
    });

    socket.on(SOCKET_EVENTS.WEBRTC_LEAVE, () => {
      void this.cleanup();
    });
  }

  async startVoiceChat(targetSocketId: string): Promise<void> {
    await this.acquireMicrophone();
    this.createPeerConnection(targetSocketId);

    this.localStream?.getTracks().forEach((track: any) => {
      this.peerConnection?.addTrack(track, this.localStream);
    });

    const { RTCSessionDescription } = rn();
    const offer = await this.peerConnection!.createOffer({});
    await this.peerConnection!.setLocalDescription(new RTCSessionDescription(offer as any));

    this.signalingSocket?.emit(SOCKET_EVENTS.WEBRTC_OFFER, { targetSocketId, offer });
  }

  async handleOffer(offer: any, fromSocketId: string): Promise<void> {
    await this.acquireMicrophone();
    this.createPeerConnection(fromSocketId);

    this.localStream?.getTracks().forEach((track: any) => {
      this.peerConnection?.addTrack(track, this.localStream);
    });

    const { RTCSessionDescription } = rn();
    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer as any));
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(new RTCSessionDescription(answer as any));

    this.signalingSocket?.emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
      targetSocketId: fromSocketId,
      answer,
    });
  }

  async handleAnswer(answer: any): Promise<void> {
    const { RTCSessionDescription } = rn();
    await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(answer as any));
  }

  async handleIceCandidate(candidate: any): Promise<void> {
    try {
      const { RTCIceCandidate } = rn();
      await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      // Ignore stale candidates
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.localStream?.getAudioTracks().forEach((track: any) => {
      track.enabled = !this.isMuted;
    });
    return this.isMuted;
  }

  async cleanup(): Promise<void> {
    this.localStream?.getTracks().forEach((t: any) => t.stop());
    this.peerConnection?.close();
    this.peerConnection = null;
    this.localStream = null;
    this.isMuted = false;
  }

  private async acquireMicrophone(): Promise<void> {
    if (this.localStream) return;
    const { mediaDevices } = rn();
    const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
    this.localStream = stream;
  }

  private createPeerConnection(targetSocketId: string): void {
    const { RTCPeerConnection } = rn();
    this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.peerConnection.onicecandidate = (event: any) => {
      if (event.candidate) {
        this.signalingSocket?.emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    this.peerConnection.ontrack = (event: any) => {
      const remoteStream = event.streams?.[0];
      if (remoteStream) this.onRemoteStream?.(remoteStream);
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState ?? 'unknown';
      this.onConnectionStateChange?.(state);
    };
  }
}

export const webrtcService = new WebRTCService();
