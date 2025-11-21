import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SwapTransactionStatus } from '@prisma/client';

export interface SwapCreatedEvent {
  transactionId: number;
  stationId: number;
  stationName: string;
  user: {
    userId: number;
    username: string;
    email: string;
  };
  vehicle: {
    vehicleId: number;
    vin: string;
    batteryModel: string;
  };
  batteryTaken: {
    batteryId: number;
    charge: number;
  };
  batteryReturned?: {
    batteryId: number;
    charge: number;
  };
  status: SwapTransactionStatus;
  timestamp: string;
  distanceTraveled?: number;
  batteryUsedPercent?: number;
}

export interface SwapStatusUpdatedEvent {
  transactionId: number;
  previousStatus: SwapTransactionStatus;
  currentStatus: SwapTransactionStatus;
  updatedBy?: {
    userId: number;
    username: string;
    role: string;
  };
  reason?: string;
  timestamp: string;
}

@WebSocketGateway({
  namespace: 'swap-transactions',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class SwapTransactionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(SwapTransactionsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(
      `Client connected to swap-transactions namespace: ${client.id}`,
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `Client disconnected from swap-transactions namespace: ${client.id}`,
    );
  }

  /**
   * Notify all clients about new swap transaction
   */
  notifySwapCreated(payload: SwapCreatedEvent) {
    this.logger.log(
      `Broadcasting swap.created for transaction ${payload.transactionId} at station ${payload.stationName}`,
    );
    this.server.emit('swap.created', payload);
  }

  /**
   * Notify all clients about swap transaction status update
   */
  notifySwapStatusUpdated(payload: SwapStatusUpdatedEvent) {
    this.logger.log(
      `Broadcasting swap.status.updated for transaction ${payload.transactionId}: ${payload.previousStatus} → ${payload.currentStatus}`,
    );
    this.server.emit('swap.status.updated', payload);
  }

  /**
   * Notify specific station about swap transaction
   */
  notifyStation(stationId: number, event: string, payload: any) {
    this.logger.log(`Emitting ${event} to station-${stationId}`);
    this.server.to(`station-${stationId}`).emit(event, payload);
  }

  /**
   * Notify specific user about their swap transaction
   */
  notifyUser(userId: number, event: string, payload: any) {
    this.logger.log(`Emitting ${event} to user-${userId}`);
    this.server.to(`user-${userId}`).emit(event, payload);
  }

  /**
   * Notify all admins about swap transaction
   */
  notifyAdmins(event: string, payload: any) {
    this.logger.log(`Emitting ${event} to admins`);
    this.server.to('admins').emit(event, payload);
  }
}
