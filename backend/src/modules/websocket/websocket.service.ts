import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { SocketEvents } from './socket-events.enum';
import { SupportTicketNotificationDto } from './dto/notification.dto';

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);

  constructor(
    @Inject(forwardRef(() => WebsocketGateway))
    private websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Notify all admins about new support ticket
   */
  notifyAdminsNewSupportTicket(ticket: any): void {
    const notification = new SupportTicketNotificationDto({
      type: 'support_ticket_created',
      title: 'New Support Ticket',
      message: `User ${ticket.user?.username || 'Unknown'} created a new support ticket`,
      data: {
        support_id: ticket.support_id,
        user_id: ticket.user_id,
        username: ticket.user?.username,
        description: ticket.description,
        status: ticket.status,
        station_id: ticket.station_id,
        station_name: ticket.station?.name,
        created_at: ticket.created_at,
      },
      priority: 'high',
    });

    this.websocketGateway.sendToAdmins(
      SocketEvents.SUPPORT_TICKET_CREATED,
      notification,
    );

    this.logger.log(
      `📢 Sent new support ticket notification to admins (Ticket #${ticket.support_id})`,
    );
  }

  /**
   * Notify user about support ticket update
   */
  notifyUserTicketUpdate(userId: number, ticket: any): void {
    const notification = new SupportTicketNotificationDto({
      type: 'support_ticket_updated',
      title: 'Support Ticket Updated',
      message: `Your support ticket #${ticket.support_id} has been updated to status: ${ticket.status}`,
      data: {
        support_id: ticket.support_id,
        description: ticket.description,
        status: ticket.status,
        response: ticket.response,
        station_id: ticket.station_id,
        station_name: ticket.station?.name,
        updated_at: ticket.updated_at,
      },
      priority: 'medium',
    });

    const sent = this.websocketGateway.sendToUser(
      userId,
      SocketEvents.SUPPORT_TICKET_UPDATED,
      notification,
    );

    if (sent) {
      this.logger.log(
        `📤 Sent ticket update notification to user ${userId} (Ticket #${ticket.support_id})`,
      );
    } else {
      this.logger.warn(
        `⚠️ User ${userId} not connected, ticket update notification not sent`,
      );
    }
  }

  /**
   * Notify user about support ticket resolution
   */
  notifyUserTicketResolved(userId: number, ticket: any): void {
    const notification = new SupportTicketNotificationDto({
      type: 'support_ticket_resolved',
      title: 'Support Ticket Resolved',
      message: `Your support ticket #${ticket.support_id} has been resolved`,
      data: {
        support_id: ticket.support_id,
        description: ticket.description,
        response: ticket.response,
        resolved_at: ticket.updated_at,
      },
      priority: 'low',
    });

    this.websocketGateway.sendToUser(
      userId,
      SocketEvents.SUPPORT_TICKET_RESOLVED,
      notification,
    );

    this.logger.log(
      `✅ Sent ticket resolution notification to user ${userId} (Ticket #${ticket.support_id})`,
    );
  }

  /**
   * Notify user about support ticket deletion
   */
  notifyUserTicketDeleted(userId: number, ticketId: number): void {
    const notification = new SupportTicketNotificationDto({
      type: 'support_ticket_deleted',
      title: 'Support Ticket Deleted',
      message: `Your support ticket #${ticketId} has been deleted`,
      data: {
        support_id: ticketId,
      },
      priority: 'low',
    });

    this.websocketGateway.sendToUser(
      userId,
      SocketEvents.SUPPORT_TICKET_DELETED,
      notification,
    );

    this.logger.log(
      `🗑️ Sent ticket deletion notification to user ${userId} (Ticket #${ticketId})`,
    );
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return this.websocketGateway.getStats();
  }
}
