import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { TicketType } from '@prisma/client';

export interface TransferTicketCreatedEvent {
  ticketId: number;
  transferRequestId: number;
  ticketType: TicketType;
  stationId: number;
  stationName: string;
  batteryIds: number[];
  batteryCount: number;
  batteryModel: string;
  batteryType: string;
  staff: {
    staffId: number;
    username: string;
  };
  relatedStation?: {
    stationId: number;
    stationName: string;
  };
  timestamp: string;
}

export interface TransferTicketUpdatedEvent {
  ticketId: number;
  transferRequestId: number;
  ticketType: TicketType;
  stationId: number;
  stationName: string;
  updatedFields: string[];
  updatedBy?: {
    userId: number;
    username: string;
    role: string;
  };
  timestamp: string;
}

export interface ExportTicketCompletedEvent {
  ticketId: number;
  transferRequestId: number;
  fromStationId: number;
  fromStationName: string;
  toStationId: number;
  toStationName: string;
  batteryIds: number[];
  batteryCount: number;
  batteryModel: string;
  batteryType: string;
  exportedBy: {
    staffId: number;
    username: string;
  };
  timestamp: string;
}

export interface ImportTicketCompletedEvent {
  ticketId: number;
  transferRequestId: number;
  fromStationId: number;
  fromStationName: string;
  toStationId: number;
  toStationName: string;
  batteryIds: number[];
  batteryCount: number;
  batteryModel: string;
  batteryType: string;
  importedBy: {
    staffId: number;
    username: string;
  };
  slotAssignments?: Array<{
    batteryId: number;
    cabinetId: number;
    slotId: number;
  }>;
  timestamp: string;
}

export interface BatteryTransitStatusEvent {
  batteryIds: number[];
  fromStationId: number;
  fromStationName: string;
  toStationId: number;
  toStationName: string;
  transferRequestId: number;
  ticketId: number;
  inTransit: boolean;
  timestamp: string;
}

@WebSocketGateway({
  namespace: 'battery-transfer-ticket',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class BatteryTransferTicketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(BatteryTransferTicketGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to battery-transfer-ticket namespace: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from battery-transfer-ticket namespace: ${client.id}`);
  }

  /**
   * Notify all clients about new transfer ticket creation (export or import)
   */
  notifyTransferTicketCreated(payload: TransferTicketCreatedEvent) {
    const ticketTypeLabel = payload.ticketType === TicketType.export ? 'EXPORT' : 'IMPORT';
    this.logger.log(
      `Broadcasting transfer.ticket.created for ${ticketTypeLabel} ticket ${payload.ticketId} at station ${payload.stationName}`,
    );
    this.server.emit('transfer.ticket.created', payload);

    // Notify the station where ticket was created
    this.server.to(`station-${payload.stationId}`).emit('transfer.ticket.created', payload);

    // If it's an export ticket, also notify the destination station
    // If it's an import ticket, also notify the source station
    if (payload.relatedStation) {
      this.server.to(`station-${payload.relatedStation.stationId}`).emit('transfer.ticket.created', payload);
    }
  }

  /**
   * Notify about export ticket completion
   */
  notifyExportTicketCompleted(payload: ExportTicketCompletedEvent) {
    this.logger.log(
      `Broadcasting export.ticket.completed for ticket ${payload.ticketId}: ${payload.batteryCount} batteries from ${payload.fromStationName}`,
    );
    this.server.emit('export.ticket.completed', payload);

    // Notify both stations
    this.server.to(`station-${payload.fromStationId}`).emit('export.ticket.completed', payload);
    this.server.to(`station-${payload.toStationId}`).emit('export.ticket.completed', payload);
  }

  /**
   * Notify about import ticket completion
   */
  notifyImportTicketCompleted(payload: ImportTicketCompletedEvent) {
    this.logger.log(
      `Broadcasting import.ticket.completed for ticket ${payload.ticketId}: ${payload.batteryCount} batteries to ${payload.toStationName}`,
    );
    this.server.emit('import.ticket.completed', payload);

    // Notify both stations
    this.server.to(`station-${payload.fromStationId}`).emit('import.ticket.completed', payload);
    this.server.to(`station-${payload.toStationId}`).emit('import.ticket.completed', payload);
  }

  /**
   * Notify about batteries in transit status
   */
  notifyBatteryTransitStatus(payload: BatteryTransitStatusEvent) {
    const status = payload.inTransit ? 'IN TRANSIT' : 'ARRIVED';
    this.logger.log(
      `Broadcasting battery.transit.status: ${payload.batteryIds.length} batteries ${status} (${payload.fromStationName} → ${payload.toStationName})`,
    );
    this.server.emit('battery.transit.status', payload);

    // Notify both stations
    this.server.to(`station-${payload.fromStationId}`).emit('battery.transit.status', payload);
    this.server.to(`station-${payload.toStationId}`).emit('battery.transit.status', payload);
  }

  /**
   * Notify about transfer ticket update
   */
  notifyTransferTicketUpdated(payload: TransferTicketUpdatedEvent) {
    this.logger.log(
      `Broadcasting transfer.ticket.updated for ticket ${payload.ticketId}. Updated fields: ${payload.updatedFields.join(', ')}`,
    );
    this.server.emit('transfer.ticket.updated', payload);

    // Notify the station
    this.server.to(`station-${payload.stationId}`).emit('transfer.ticket.updated', payload);
  }

  /**
   * Notify specific station about ticket changes
   */
  notifyStation(stationId: number, event: string, payload: any) {
    this.logger.log(`Emitting ${event} to station-${stationId}`);
    this.server.to(`station-${stationId}`).emit(event, payload);
  }

  /**
   * Notify all admins about ticket changes
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

  /**
   * Notify staff member about ticket assignment
   */
  notifyStaff(staffId: number, event: string, payload: any) {
    this.logger.log(`Emitting ${event} to staff-${staffId}`);
    this.server.to(`staff-${staffId}`).emit(event, payload);
  }
}
