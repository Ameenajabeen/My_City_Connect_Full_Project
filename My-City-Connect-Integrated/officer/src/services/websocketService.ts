/**
 * MY CITY CONNECT - Real-time Socket.IO Service
 * Uses socket.io-client to stream live civic events from NestJS EventsGateway.
 * No mock or simulated events.
 */
import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl, getAuthToken } from './apiClient';

export type WebSocketEventType =
  | 'NEW_COMPLAINT'
  | 'COMPLAINT_UPDATED'
  | 'COMPLAINT_STATUS_CHANGED'
  | 'WORKER_ASSIGNED'
  | 'WORKER_STATUS_CHANGED'
  | 'WORKER_LOCATION_UPDATED'
  | 'COMPLAINT_RESOLVED'
  | 'RED_ZONE_UPDATED'
  | 'NOTIFICATION_CREATED'
  | 'CONNECT'
  | 'DISCONNECT'
  | 'ERROR';

export type WebSocketEventHandler = (payload: unknown) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<WebSocketEventType, Set<WebSocketEventHandler>> = new Map();

  constructor() {
    this.initListeners();
  }

  private initListeners() {
    const eventTypes: WebSocketEventType[] = [
      'NEW_COMPLAINT',
      'COMPLAINT_UPDATED',
      'COMPLAINT_STATUS_CHANGED',
      'WORKER_ASSIGNED',
      'WORKER_STATUS_CHANGED',
      'WORKER_LOCATION_UPDATED',
      'COMPLAINT_RESOLVED',
      'RED_ZONE_UPDATED',
      'NOTIFICATION_CREATED',
      'CONNECT',
      'DISCONNECT',
      'ERROR',
    ];
    eventTypes.forEach((t) => this.listeners.set(t, new Set()));
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.socket && this.socket.connected) return;

    const baseUrl = getApiBaseUrl();
    const token = getAuthToken();

    this.socket = io(`${baseUrl || window.location.origin}/tracking`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      query: token ? { token } : undefined,
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.emit('CONNECT', { timestamp: new Date().toISOString() });
    });

    this.socket.on('disconnect', () => {
      this.emit('DISCONNECT', null);
    });

    this.socket.on('connect_error', (err) => {
      this.emit('ERROR', err);
    });

    // Wire application events directly
    const appEvents: WebSocketEventType[] = [
      'NEW_COMPLAINT',
      'COMPLAINT_UPDATED',
      'COMPLAINT_STATUS_CHANGED',
      'WORKER_ASSIGNED',
      'WORKER_STATUS_CHANGED',
      'WORKER_LOCATION_UPDATED',
      'COMPLAINT_RESOLVED',
      'RED_ZONE_UPDATED',
      'NOTIFICATION_CREATED',
    ];

    appEvents.forEach((ev) => {
      this.socket?.on(ev, (data: unknown) => {
        this.emit(ev, data);
      });
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  public on(event: WebSocketEventType, handler: WebSocketEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private emit(event: WebSocketEventType, payload: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(payload);
        } catch (e) {
          console.error(`Error in WebSocket event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const webSocketService = new WebSocketService();
