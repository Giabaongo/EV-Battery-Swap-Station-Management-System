import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*', // Allow all origins in development
    credentials: true,
  },
  namespace: '/notifications', // Optional: use namespace for organization
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  
  // Track connected users: user_id -> socket_id
  private connectedUsers: Map<number, string> = new Map();
  
  // Track admin sockets: set of socket_ids
  private adminSockets: Set<string> = new Set();
  
  // Track all sockets: socket_id -> user info
  private socketUsers: Map<string, { userId: number; role: string }> = new Map();

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('✅ WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`🔌 Client attempting to connect: ${client.id}`);

      // Extract token from handshake auth or query
      const token = 
        client.handshake.auth.token || 
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`❌ No token provided for client ${client.id}`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      // Store user information in socket
      client.data.userId = payload.sub;
      client.data.role = payload.role;

      // Track connection
      this.connectedUsers.set(payload.sub, client.id);
      this.socketUsers.set(client.id, {
        userId: payload.sub,
        role: payload.role,
      });

      // Track admin sockets
      if (payload.role === 'admin') {
        this.adminSockets.add(client.id);
        this.logger.log(`👑 Admin connected: User ${payload.sub} (Socket: ${client.id})`);
      } else {
        this.logger.log(`👤 User connected: User ${payload.sub} (Socket: ${client.id})`);
      }

      // Send welcome message
      client.emit('connected', {
        message: 'Successfully connected to WebSocket server',
        userId: payload.sub,
        role: payload.role,
      });

    } catch (error) {
      this.logger.error(`❌ WebSocket authentication failed: ${error.message}`);
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const socketInfo = this.socketUsers.get(client.id);

    if (socketInfo) {
      const { userId, role } = socketInfo;

      // Clean up tracking
      this.connectedUsers.delete(userId);
      this.socketUsers.delete(client.id);
      this.adminSockets.delete(client.id);

      if (role === 'admin') {
        this.logger.log(`👑 Admin disconnected: User ${userId} (Socket: ${client.id})`);
      } else {
        this.logger.log(`👤 User disconnected: User ${userId} (Socket: ${client.id})`);
      }
    } else {
      this.logger.log(`🔌 Unknown client disconnected: ${client.id}`);
    }
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: number, event: string, data: any): boolean {
    const socketId = this.connectedUsers.get(userId);
    
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      this.logger.log(`📤 Sent event "${event}" to user ${userId}`);
      return true;
    } else {
      this.logger.warn(`⚠️ User ${userId} not connected, cannot send event "${event}"`);
      return false;
    }
  }

  /**
   * Send notification to all admins
   */
  sendToAdmins(event: string, data: any): void {
    if (this.adminSockets.size === 0) {
      this.logger.warn(`⚠️ No admins connected, cannot send event "${event}"`);
      return;
    }

    this.adminSockets.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });

    this.logger.log(`📤 Sent event "${event}" to ${this.adminSockets.size} admin(s)`);
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.log(`📢 Broadcasted event "${event}" to all users`);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.connectedUsers.size,
      adminConnections: this.adminSockets.size,
      userConnections: this.connectedUsers.size - this.adminSockets.size,
    };
  }
}
