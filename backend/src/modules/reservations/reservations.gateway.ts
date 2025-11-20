import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ReservationStatus } from '@prisma/client';

export interface ReservationCreatedEvent {
  reservationId: number;
  stationId: number;
  stationName: string;
  scheduledTime: string;
  batteryId: number;
  vehicle: {
    id: number;
    vin: string;
    batteryModel: string;
    batteryType: string;
  };
  user: {
    id: number;
    username: string;
    email: string;
    phone: string;
  };
}

export interface ReservationStatusUpdatedEvent {
  reservationId: number;
  stationId: number;
  stationName: string;
  previousStatus: ReservationStatus;
  currentStatus: ReservationStatus;
  scheduledTime: string;
  updatedBy?: {
    userId: number;
    username: string;
    role: string;
  };
  vehicle: {
    id: number;
    vin: string;
  };
  user: {
    id: number;
    username: string;
    email: string;
  };
  timestamp: string;
}

@WebSocketGateway({
  namespace: 'reservations',
  cors: {
    origin: '*',
    credentials: true
  }
})
export class ReservationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ReservationsGateway.name);

  @WebSocketServer()
  private server: Server;

  handleConnection(client: Socket) {
    this.logger.verbose(`Reservation socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.verbose(`Reservation socket disconnected: ${client.id}`);
  }

  notifyReservationCreated(payload: ReservationCreatedEvent) {
    if (!this.server) {
      this.logger.warn('Reservation gateway not initialized. Cannot notify staff.');
      return;
    }

    this.logger.log(`Broadcasting reservation.created for reservation ${payload.reservationId}`);
    this.server.emit('reservation.created', payload);
  }

  /**
   * Notify all clients about reservation status update
   */
  notifyReservationStatusUpdated(payload: ReservationStatusUpdatedEvent) {
    if (!this.server) {
      this.logger.warn('Reservation gateway not initialized. Cannot notify.');
      return;
    }

    this.logger.log(
      `Broadcasting reservation.status.updated for reservation ${payload.reservationId}: ${payload.previousStatus} → ${payload.currentStatus}`
    );
    this.server.emit('reservation.status.updated', payload);
  }

  /**
   * Notify specific station about reservation update
   */
  notifyStation(stationId: number, event: string, payload: any) {
    this.logger.log(`Emitting ${event} to station-${stationId}`);
    this.server.to(`station-${stationId}`).emit(event, payload);
  }

  /**
   * Notify specific user about their reservation update
   */
  notifyUser(userId: number, event: string, payload: any) {
    this.logger.log(`Emitting ${event} to user-${userId}`);
    this.server.to(`user-${userId}`).emit(event, payload);
  }
}
