export enum SocketEvents {
  // Connection events
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  
  // Support ticket events
  SUPPORT_TICKET_CREATED = 'support:ticket:created',
  SUPPORT_TICKET_UPDATED = 'support:ticket:updated',
  SUPPORT_TICKET_RESOLVED = 'support:ticket:resolved',
  SUPPORT_TICKET_DELETED = 'support:ticket:deleted',
  
  // Payment events (future)
  PAYMENT_SUCCESS = 'payment:success',
  PAYMENT_FAILED = 'payment:failed',
  
  // Subscription events (future)
  SUBSCRIPTION_EXPIRING = 'subscription:expiring',
  SUBSCRIPTION_EXPIRED = 'subscription:expired',
  
  // Battery events (future)
  BATTERY_LOW = 'battery:low',
  BATTERY_SWAP_READY = 'battery:swap:ready',
  
  // Reservation events (future)
  RESERVATION_CONFIRMED = 'reservation:confirmed',
  RESERVATION_CANCELLED = 'reservation:cancelled',
  
  // Admin notifications
  ADMIN_NOTIFICATION = 'admin:notification',
}
