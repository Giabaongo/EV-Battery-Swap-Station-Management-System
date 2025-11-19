import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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

    this.server.emit('reservation.created', payload);
  }
}
