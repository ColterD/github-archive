// WEBSOCKET CLIENT STORE - Real-time features for Svelte components
import { writable, derived, get } from "svelte/store";
import { browser } from "$app/environment";

export interface WebSocketMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  id: string;
}

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  lastPing: number;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Stores
  public connectionState = writable<ConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0,
    lastPing: 0,
  });

  public messages = writable<WebSocketMessage[]>([]);
  public notifications = writable<WebSocketMessage[]>([]);

  // Real-time data stores
  public hardwareActivity = writable<Array<Record<string, unknown>>>([]);
  public buildActivity = writable<Array<Record<string, unknown>>>([]);
  public userActivity = writable<Array<Record<string, unknown>>>([]);
  public priceChanges = writable<Array<Record<string, unknown>>>([]);

  constructor() {
    if (browser) {
      this.connect();

      // Auto-reconnect on page visibility
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && !this.isConnected()) {
          this.connect();
        }
      });
    }
  }

  private getWebSocketUrl(): string {
    if (!browser) return "";

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }

  connect() {
    if (!browser || this.ws?.readyState === WebSocket.CONNECTING) return;

    this.connectionState.update((state) => ({
      ...state,
      connecting: true,
      error: null,
    }));

    try {
      this.ws = new WebSocket(this.getWebSocketUrl());

      this.ws.onopen = () => {
        this.connectionState.update((state) => ({
          ...state,
          connected: true,
          connecting: false,
          error: null,
          reconnectAttempts: 0,
        }));

        this.startPingTimer();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onclose = (event) => {
        this.connectionState.update((state) => ({
          ...state,
          connected: false,
          connecting: false,
        }));

        this.stopPingTimer();

        if (!event.wasClean) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.connectionState.update((state) => ({
          ...state,
          error: "Connection error",
          connecting: false,
        }));
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      this.connectionState.update((state) => ({
        ...state,
        error: "Failed to connect",
        connecting: false,
      }));
      console.error("Failed to create WebSocket:", error);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    // Add to messages history
    this.messages.update((messages) => {
      const updated = [...messages, message];
      return updated.slice(-100); // Keep last 100 messages
    });

    switch (message.type) {
      case "connected":
        console.log("WebSocket client ID:", message.payload.clientId);
        // Auto-subscribe to relevant channels
        this.subscribe("global");
        this.subscribe("hardware_updates");
        this.subscribe("hardware_activity");
        this.subscribe("build_activity");
        this.subscribe("user_activity");
        break;

      case "pong":
        this.connectionState.update((state) => ({
          ...state,
          lastPing: Date.now(),
        }));
        break;

      case "hardware_view":
        this.hardwareActivity.update((activity) => {
          const updated = [message.payload, ...activity];
          return updated.slice(0, 50); // Keep last 50 activities
        });
        break;

      case "build_like":
        this.buildActivity.update((activity) => {
          const updated = [message.payload, ...activity];
          return updated.slice(0, 50);
        });
        break;

      case "user_activity":
        this.userActivity.update((activity) => {
          const updated = [message.payload, ...activity];
          return updated.slice(0, 50);
        });
        break;

      case "price_change":
        if (
          message.payload.change &&
          parseFloat(String(message.payload.change)) < -10
        ) {
          this.notifications.update((current) => [
            ...current,
            {
              ...message,
              payload: {
                ...message.payload,
                message: `Price drop alert: ${message.payload.hardwareId}`,
              },
            },
          ]);
        }
        break;

      case "new_build":
        this.notifications.update((notifications) => {
          const notification = {
            ...message,
            payload: {
              ...message.payload,
              title: `New build: ${message.payload.buildTitle}`,
            },
          };
          return [notification, ...notifications].slice(0, 10);
        });
        break;

      case "error":
        console.error("WebSocket server error:", message.payload.message);
        break;

      default:
        console.log("Unhandled WebSocket message:", message);
    }
  }

  private scheduleReconnect() {
    const state = get(this.connectionState);

    if (state.reconnectAttempts >= this.maxReconnectAttempts) {
      this.connectionState.update((s) => ({
        ...s,
        error: "Max reconnection attempts reached",
      }));
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, state.reconnectAttempts);

    this.reconnectTimer = window.setTimeout(() => {
      this.connectionState.update((s) => ({
        ...s,
        reconnectAttempts: s.reconnectAttempts + 1,
      }));
      this.connect();
    }, delay);
  }

  private startPingTimer() {
    this.pingTimer = window.setInterval(() => {
      this.send({
        type: "ping",
        payload: {},
        timestamp: Date.now(),
        id: crypto.randomUUID(),
      });
    }, 30000); // Ping every 30 seconds
  }

  private stopPingTimer() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, message not sent:", message);
    }
  }

  subscribe(channel: string) {
    this.send({
      type: "subscribe",
      payload: { channel },
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    });
  }

  unsubscribe(channel: string) {
    this.send({
      type: "unsubscribe",
      payload: { channel },
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    });
  }

  authenticate(userId: string) {
    this.send({
      type: "authenticate",
      payload: { userId },
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    });
  }

  trackHardwareView(hardwareId: string) {
    this.send({
      type: "hardware_view",
      payload: { hardwareId },
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    });
  }

  trackBuildLike(buildId: string) {
    this.send({
      type: "build_like",
      payload: { buildId },
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopPingTimer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connectionState.update((state) => ({
      ...state,
      connected: false,
      connecting: false,
    }));
  }

  // Clear old notifications
  clearNotifications() {
    this.notifications.set([]);
  }

  // Get derived store for connection status
  get isConnected$() {
    return derived(this.connectionState, (state) => state.connected);
  }

  get hasError$() {
    return derived(this.connectionState, (state) => !!state.error);
  }
}

// Create singleton instance
export const websocketClient = new WebSocketClient();

// Export individual stores for easy component access
export const {
  connectionState,
  messages,
  notifications,
  hardwareActivity,
  buildActivity,
  userActivity,
  priceChanges,
  isConnected$,
  hasError$,
} = websocketClient;
