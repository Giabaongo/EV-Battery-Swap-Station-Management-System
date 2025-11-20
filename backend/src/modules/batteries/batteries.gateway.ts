import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { BatteryStatus } from '@prisma/client';

export interface BatteryStatusChangedEvent {
  batteryId: number;
  stationId: number;
  stationName: string;
  previousStatus: BatteryStatus;
  currentStatus: BatteryStatus;
  currentCharge: number;
  timestamp: string;
  changedBy?: {
    userId: number;
    username: string;
    role: string;
  };
}

export interface BatteryChargeUpdatedEvent {
  batteryId: number;
  stationId: number;
  previousCharge: number;
  currentCharge: number;
  chargeChange: number;
  chargingRate?: number;
  estimatedFullTime?: string;
  status: BatteryStatus;
  timestamp: string;
}

@WebSocketGateway({
  namespace: 'batteries',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class BatteriesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(BatteriesGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to batteries namespace: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from batteries namespace: ${client.id}`);
  }

  /**
   * Notify all clients about battery status change
   */
  notifyBatteryStatusChanged(payload: BatteryStatusChangedEvent) {
    this.logger.log(
      `Broadcasting battery.status.changed for battery ${payload.batteryId}: ${payload.previousStatus} → ${payload.currentStatus}`,
    );
    this.server.emit('battery.status.changed', payload);
  }

  /**
   * Notify all clients about battery charge update
   */
  notifyBatteryChargeUpdated(payload: BatteryChargeUpdatedEvent) {
    this.logger.log(
      `Broadcasting battery.charge.updated for battery ${payload.batteryId}: ${payload.previousCharge}% → ${payload.currentCharge}%`,
    );
    this.server.emit('battery.charge.updated', payload);
  }

  /**
   * Notify specific station about battery changes
   */
  notifyStation(stationId: number, event: string, payload: any) {
    this.logger.log(`Emitting ${event} to station-${stationId}`);
    this.server.to(`station-${stationId}`).emit(event, payload);
  }

  /**
   * Notify all admins about battery changes
   */
  notifyAdmins(event: string, payload: any) {
    this.logger.log(`Emitting ${event} to admins`);
    this.server.to('admins').emit(event, payload);
  }

  /**
   * Calculate estimated time to full charge
   * @param currentCharge - Current battery charge percentage
   * @param chargingRate - Charging rate in % per hour
   * @returns ISO timestamp
   */
  private calculateEstimatedFullTime(
    currentCharge: number,
    chargingRate: number,
  ): string {
    if (!chargingRate || chargingRate <= 0) return null;

    const remainingCharge = 100 - currentCharge;
    const hoursToFull = remainingCharge / chargingRate;
    const estimatedTime = new Date();
    estimatedTime.setHours(estimatedTime.getHours() + hoursToFull);

    return estimatedTime.toISOString();
  }
}
