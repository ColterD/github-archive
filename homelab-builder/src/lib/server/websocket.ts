// WEBSOCKET SERVER - Real-time features implementation
// Handles live updates for hardware tracking, build notifications, and user activity
import { WebSocketServer } from "ws";
import type { Server } from "http";
import { logger } from "./logger.js";
import { nanoid } from "nanoid";

export interface WebSocketMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  id: string;
}

export interface ConnectedClient {
  id: string;
  ws: import("ws").WebSocket;
  userId?: string;
  channels: Set<string>;
  lastPing: number;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, ConnectedClient>();
  private channels = new Map<string, Set<string>>();
  private pingInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      clientTracking: true,
      maxPayload: 1024 * 1024, // 1MB max payload
    });

    this.wss.on("connection", (ws) => {
      const clientId = nanoid();
      const client: ConnectedClient = {
        id: clientId,
        ws,
        channels: new Set(),
        lastPing: Date.now(),
      };

      this.clients.set(clientId, client);
      logger.info(`WebSocket client connected: ${clientId}`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: "connected",
        payload: { clientId },
        timestamp: Date.now(),
        id: nanoid(),
      });

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          logger.error("Invalid WebSocket message format", error as Error);
          this.sendToClient(clientId, {
            type: "error",
            payload: { message: "Invalid message format" },
            timestamp: Date.now(),
            id: nanoid(),
          });
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(clientId);
      });

      ws.on("error", (error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnect(clientId);
      });

      ws.on("pong", () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = Date.now();
        }
      });
    });

    // Start ping interval for connection health
    this.pingInterval = setInterval(() => {
      this.pingClients();
    }, 30000); // Ping every 30 seconds

    logger.info("WebSocket server initialized");
  }

  private handleMessage(
    clientId: string,
    message: { type: string; payload?: Record<string, unknown> },
  ) {
    const client = this.clients.get(clientId);
    if (!client) return;

    logger.info(`WebSocket message from ${clientId}: ${message.type}`);

    switch (message.type) {
      case "ping":
        client.lastPing = Date.now();
        this.sendToClient(clientId, {
          type: "pong",
          payload: {},
          timestamp: Date.now(),
          id: nanoid(),
        });
        break;

      case "subscribe":
        if (
          message.payload?.channel &&
          typeof message.payload.channel === "string"
        ) {
          this.subscribeToChannel(clientId, message.payload.channel);
        }
        break;

      case "unsubscribe":
        if (
          message.payload?.channel &&
          typeof message.payload.channel === "string"
        ) {
          this.unsubscribeFromChannel(clientId, message.payload.channel);
        }
        break;

      case "authenticate":
        if (
          message.payload?.userId &&
          typeof message.payload.userId === "string"
        ) {
          this.authenticateClient(clientId, message.payload.userId);
        }
        break;

      case "hardware_view":
        if (
          message.payload?.hardwareId &&
          typeof message.payload.hardwareId === "string"
        ) {
          this.broadcastToChannel("hardware_activity", {
            type: "hardware_view",
            payload: {
              hardwareId: message.payload.hardwareId,
              userId: client.userId,
              timestamp: Date.now(),
            },
            timestamp: Date.now(),
          } as Omit<WebSocketMessage, "id">);
        }
        break;

      case "build_like":
        if (
          message.payload?.buildId &&
          typeof message.payload.buildId === "string"
        ) {
          this.broadcastToChannel("build_activity", {
            type: "build_like",
            payload: {
              buildId: message.payload.buildId,
              userId: client.userId,
              timestamp: Date.now(),
            },
            timestamp: Date.now(),
          } as Omit<WebSocketMessage, "id">);
        }
        break;

      default:
        logger.warn(`Unknown WebSocket message type: ${message.type}`);
    }
  }

  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all channels
    client.channels.forEach((channel) => {
      this.unsubscribeFromChannel(clientId, channel);
    });

    this.clients.delete(clientId);
    logger.info(`WebSocket client disconnected: ${clientId}`);
  }

  private pingClients() {
    const now = Date.now();
    const staleThreshold = 60000; // 1 minute

    this.clients.forEach((client, clientId) => {
      if (now - client.lastPing > staleThreshold) {
        logger.info(`Removing stale WebSocket client: ${clientId}`);
        client.ws.terminate();
        this.handleDisconnect(clientId);
      } else {
        client.ws.ping();
      }
    });
  }

  private authenticateClient(clientId: string, userId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.userId = userId;
    logger.info(
      `WebSocket client authenticated: ${clientId} as user ${userId}`,
    );

    // Auto-subscribe to user-specific channels
    this.subscribeToChannel(clientId, `user:${userId}`);
    this.subscribeToChannel(clientId, "global");
  }

  private subscribeToChannel(clientId: string, channel: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.channels.add(channel);

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(clientId);

    this.sendToClient(clientId, {
      type: "subscribed",
      payload: { channel },
      timestamp: Date.now(),
      id: nanoid(),
    });

    logger.info(`Client ${clientId} subscribed to channel: ${channel}`);
  }

  private unsubscribeFromChannel(clientId: string, channel: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.channels.delete(channel);

    const channelClients = this.channels.get(channel);
    if (channelClients) {
      channelClients.delete(clientId);
      if (channelClients.size === 0) {
        this.channels.delete(channel);
      }
    }

    this.sendToClient(clientId, {
      type: "unsubscribed",
      payload: { channel },
      timestamp: Date.now(),
      id: nanoid(),
    });

    logger.info(`Client ${clientId} unsubscribed from channel: ${channel}`);
  }

  private sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== 1) return;

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      logger.error(
        `Failed to send message to client ${clientId}:`,
        error as Error,
      );
      this.handleDisconnect(clientId);
    }
  }

  // Public methods for application use

  broadcastToChannel(channel: string, message: Omit<WebSocketMessage, "id">) {
    const channelClients = this.channels.get(channel);
    if (!channelClients) return;

    const fullMessage: WebSocketMessage = {
      ...message,
      id: nanoid(),
    };

    channelClients.forEach((clientId) => {
      this.sendToClient(clientId, fullMessage);
    });

    logger.info(
      `Broadcasted message to channel ${channel}: ${channelClients.size} clients`,
    );
  }

  sendToUser(userId: string, message: Omit<WebSocketMessage, "id">) {
    this.broadcastToChannel(`user:${userId}`, message);
  }

  notifyHardwarePriceChange(
    hardwareId: string,
    oldPrice: number,
    newPrice: number,
  ) {
    this.broadcastToChannel("hardware_updates", {
      type: "price_change",
      payload: {
        hardwareId,
        oldPrice,
        newPrice,
        change: (((newPrice - oldPrice) / oldPrice) * 100).toFixed(2),
      },
      timestamp: Date.now(),
    });
  }

  // Broadcast real-time price update to all connected clients
  broadcast(type: string, data: Record<string, unknown>): void {
    const message = {
      type,
      payload: data,
      timestamp: Date.now(),
      id: nanoid(),
    };

    this.clients.forEach((client) => {
      if (client.ws.readyState === 1) {
        client.ws.send(JSON.stringify(message));
      }
    });

    logger.info(`Broadcasted ${type} message to ${this.clients.size} clients`);
  }

  // Broadcast price alert to specific users
  broadcastPriceAlert(
    userIds: string[],
    alertData: {
      itemId: string;
      itemName: string;
      currentPrice: number;
      targetPrice: number;
      alertType: "price-drop" | "price-increase" | "target-reached";
    },
  ): void {
    const message = {
      type: "price-alert",
      payload: alertData,
      timestamp: Date.now(),
      id: nanoid(),
    };

    this.clients.forEach((client) => {
      if (
        client.ws.readyState === 1 &&
        client.userId &&
        userIds.includes(client.userId)
      ) {
        client.ws.send(JSON.stringify(message));
      }
    });

    logger.info(
      `Sent price alert to ${userIds.length} users for item ${alertData.itemId}`,
    );
  }

  notifyNewBuild(buildId: string, authorId: string, buildTitle: string) {
    this.broadcastToChannel("global", {
      type: "new_build",
      payload: {
        buildId,
        authorId,
        buildTitle,
      },
      timestamp: Date.now(),
    });
  }

  notifyUserActivity(
    userId: string,
    activity: string,
    metadata?: Record<string, unknown>,
  ) {
    this.broadcastToChannel("user_activity", {
      type: "user_activity",
      payload: {
        userId,
        activity,
        metadata,
      },
      timestamp: Date.now(),
    });
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      activeChannels: this.channels.size,
      channels: Array.from(this.channels.entries()).map(([name, clients]) => ({
        name,
        subscribers: clients.size,
      })),
    };
  }

  shutdown() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.clients.forEach((client) => {
      client.ws.close();
    });

    this.clients.clear();
    this.channels.clear();

    if (this.wss) {
      this.wss.close();
    }

    logger.info("WebSocket server shut down");
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
