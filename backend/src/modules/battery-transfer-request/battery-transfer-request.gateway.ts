import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { TransferStatus } from '@prisma/client';

export interface TransferRequestCreatedEvent {
  transferRequestId: number;
  fromStationId: number;
  fromStationName: string;
  toStationId: number;
  toStationName: string;
  batteryModel: string;
  batteryType: string;
  quantity: number;
  status: TransferStatus;
  createdBy: {
    userId: number;
    username: string;
    role: string;
  };
  timestamp: string;
}

export interface TransferRequestStatusUpdatedEvent {
  transferRequestId: number;
  fromStationId: number;
  fromStationName: string;
  toStationId: number;
  toStationName: string;
  previousStatus: TransferStatus;
  currentStatus: TransferStatus;
  batteryModel: string;
  batteryType: string;
  quantity: number;
  updatedBy?: {
    userId: number;
    username: string;
    role: string;
  };
  timestamp: string;
}

export interface TransferRequestUpdatedEvent {
  transferRequestId: number;
  fromStationId: number;
  fromStationName: string;
  toStationId: number;
  toStationName: string;
  batteryModel: string;
  batteryType: string;
  quantity: number;
  status: TransferStatus;
  updatedFields: string[];
  updatedBy?: {
    userId: number;
    username: string;
    role: string;
  };
  timestamp: string;
}

@WebSocketGateway({
  namespace: 'battery-transfer-request',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class BatteryTransferRequestGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(BatteryTransferRequestGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to battery-transfer-request namespace: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from battery-transfer-request namespace: ${client.id}`);
  }

  /**
   * Notify all clients about new transfer request creation
   */
  notifyTransferRequestCreated(payload: TransferRequestCreatedEvent) {
    this.logger.log(
      `Broadcasting transfer.request.created for request ${payload.transferRequestId}: ${payload.fromStationName} → ${payload.toStationName}`,
    );
    this.server.emit('transfer.request.created', payload);

    // Also notify specific stations
    this.server.to(`station-${payload.fromStationId}`).emit('transfer.request.created', payload);
    this.server.to(`station-${payload.toStationId}`).emit('transfer.request.created', payload);
  }

  /**
   * Notify all clients about transfer request status change
   */
  notifyTransferRequestStatusUpdated(payload: TransferRequestStatusUpdatedEvent) {
    this.logger.log(
      `Broadcasting transfer.request.status.updated for request ${payload.transferRequestId}: ${payload.previousStatus} → ${payload.currentStatus}`,
    );
    this.server.emit('transfer.request.status.updated', payload);

    // Notify specific stations
    this.server.to(`station-${payload.fromStationId}`).emit('transfer.request.status.updated', payload);
    this.server.to(`station-${payload.toStationId}`).emit('transfer.request.status.updated', payload);
  }

  /**
   * Notify all clients about transfer request update (quantity, battery type, etc.)
   */
  notifyTransferRequestUpdated(payload: TransferRequestUpdatedEvent) {
    this.logger.log(
      `Broadcasting transfer.request.updated for request ${payload.transferRequestId}. Updated fields: ${payload.updatedFields.join(', ')}`,
    );
    this.server.emit('transfer.request.updated', payload);

    // Notify specific stations
    this.server.to(`station-${payload.fromStationId}`).emit('transfer.request.updated', payload);
    this.server.to(`station-${payload.toStationId}`).emit('transfer.request.updated', payload);
  }

  /**
   * Notify specific station about transfer request changes
   */
  notifyStation(stationId: number, event: string, payload: any) {
    this.logger.log(`Emitting ${event} to station-${stationId}`);
    this.server.to(`station-${stationId}`).emit(event, payload);
  }

  /**
   * Notify all admins about transfer request changes
   */
  notifyAdmins(event: string, payload: any) {
    this.logger.log(`Emitting ${event} to admins`);
    this.server.to('admins').emit(event, payload);
  }

  /**
   * Notify both source and destination stations
   */
  notifyBothStations(fromStationId: number, toStationId: number, event: string, payload: any) {
    this.logger.log(`Emitting ${event} to stations ${fromStationId} and ${toStationId}`);
    this.server.to(`station-${fromStationId}`).emit(event, payload);
    this.server.to(`station-${toStationId}`).emit(event, payload);
  }
}
