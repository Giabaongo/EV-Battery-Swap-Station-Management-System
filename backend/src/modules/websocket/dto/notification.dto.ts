export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export class SupportTicketNotificationDto implements NotificationPayload {
  type: string;
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  constructor(params: {
    type: string;
    title: string;
    message: string;
    data: any;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) {
    this.type = params.type;
    this.title = params.title;
    this.message = params.message;
    this.data = params.data;
    this.priority = params.priority || 'medium';
    this.timestamp = new Date();
  }
}
