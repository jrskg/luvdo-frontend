import { io, Socket } from 'socket.io-client';
import { SOCKET_NAMESPACE_GAME, SOCKET_NAMESPACE_WEBRTC, SOCKET_URL } from '../config/api.config';

class SocketService {
  private gameSocket: Socket | null = null;
  private webrtcSocket: Socket | null = null;

  connect(token: string): void {
    if (this.gameSocket?.connected) return;

    const opts = {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    };

    this.gameSocket = io(`${SOCKET_URL}${SOCKET_NAMESPACE_GAME}`, opts);
    this.webrtcSocket = io(`${SOCKET_URL}${SOCKET_NAMESPACE_WEBRTC}`, opts);
  }

  disconnect(): void {
    this.gameSocket?.disconnect();
    this.webrtcSocket?.disconnect();
    this.gameSocket = null;
    this.webrtcSocket = null;
  }

  getGameSocket(): Socket | null {
    return this.gameSocket;
  }

  getWebRTCSocket(): Socket | null {
    return this.webrtcSocket;
  }

  isConnected(): boolean {
    return this.gameSocket?.connected ?? false;
  }
}

export const socketService = new SocketService();
