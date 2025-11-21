# WebSocket Implementation for Battery Transfer System

## Overview

WebSocket real-time notifications have been added for **Battery Transfer Requests** and **Battery Transfer Tickets** (Export/Import).

## Architecture

### 1. Battery Transfer Request Gateway

**Namespace:** `battery-transfer-request`

**Events:**
- `transfer.request.created` - New transfer request created
- `transfer.request.status.updated` - Transfer request status changed
- `transfer.request.updated` - Transfer request details updated

### 2. Battery Transfer Ticket Gateway

**Namespace:** `battery-transfer-ticket`

**Events:**
- `transfer.ticket.created` - New export/import ticket created
- `export.ticket.completed` - Export ticket completed (batteries dispatched)
- `import.ticket.completed` - Import ticket completed (batteries received)
- `battery.transit.status` - Battery in-transit status changed
- `transfer.ticket.updated` - Ticket details updated

## Event Payloads

### Transfer Request Events

#### `transfer.request.created`

```typescript
{
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
```

#### `transfer.request.status.updated`

```typescript
{
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
```

### Transfer Ticket Events

#### `transfer.ticket.created`

```typescript
{
  ticketId: number;
  transferRequestId: number;
  ticketType: 'export' | 'import';
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
  relatedStation: {
    stationId: number;
    stationName: string;
  };
  timestamp: string;
}
```

#### `export.ticket.completed`

```typescript
{
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
```

#### `import.ticket.completed`

```typescript
{
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
```

#### `battery.transit.status`

```typescript
{
  batteryIds: number[];
  fromStationId: number;
  fromStationName: string;
  toStationId: number;
  toStationName: string;
  transferRequestId: number;
  ticketId: number;
  inTransit: boolean; // true = in transit, false = arrived
  timestamp: string;
}
```

## Frontend Integration

### Connection Examples

#### Connect to Transfer Request Namespace

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8080/battery-transfer-request', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Listen for new transfer requests
socket.on('transfer.request.created', (data) => {
  console.log('New transfer request:', data);
  // Update UI: show notification, refresh transfer list, etc.
});

// Listen for status updates
socket.on('transfer.request.status.updated', (data) => {
  console.log('Transfer request status changed:', data);
  // Update UI: update status badge, show alert, etc.
});
```

#### Connect to Transfer Ticket Namespace

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8080/battery-transfer-ticket', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Listen for new export tickets
socket.on('export.ticket.completed', (data) => {
  console.log('Export ticket completed:', data);
  // Update UI: show "Batteries dispatched" notification
});

// Listen for new import tickets
socket.on('import.ticket.completed', (data) => {
  console.log('Import ticket completed:', data);
  // Update UI: show "Batteries received" notification
});

// Listen for battery transit status
socket.on('battery.transit.status', (data) => {
  if (data.inTransit) {
    console.log('Batteries in transit:', data.batteryIds);
  } else {
    console.log('Batteries arrived:', data.batteryIds);
  }
});
```

### React Hook Example

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useTransferRequestWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [transferRequests, setTransferRequests] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:8080/battery-transfer-request', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to transfer request WebSocket');
    });

    newSocket.on('transfer.request.created', (data) => {
      setTransferRequests((prev) => [data, ...prev]);
      // Show toast notification
    });

    newSocket.on('transfer.request.status.updated', (data) => {
      setTransferRequests((prev) =>
        prev.map((req) =>
          req.transferRequestId === data.transferRequestId
            ? { ...req, status: data.currentStatus }
            : req
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, transferRequests };
};
```

## Use Cases

### 1. Admin Dashboard - Monitor All Transfers

```javascript
// Connect to both namespaces
const requestSocket = io('http://localhost:8080/battery-transfer-request');
const ticketSocket = io('http://localhost:8080/battery-transfer-ticket');

// Monitor all transfer activities
requestSocket.on('transfer.request.created', (data) => {
  showNotification(`New transfer: ${data.fromStationName} → ${data.toStationName}`);
  updateDashboard();
});

ticketSocket.on('export.ticket.completed', (data) => {
  showNotification(`${data.batteryCount} batteries dispatched from ${data.fromStationName}`);
});

ticketSocket.on('import.ticket.completed', (data) => {
  showNotification(`${data.batteryCount} batteries received at ${data.toStationName}`);
});
```

### 2. Station Staff - Track Station-Specific Transfers

```javascript
const requestSocket = io('http://localhost:8080/battery-transfer-request');
const ticketSocket = io('http://localhost:8080/battery-transfer-ticket');

const myStationId = 1; // Get from user context

// Filter events for this station only
requestSocket.on('transfer.request.created', (data) => {
  if (data.fromStationId === myStationId || data.toStationId === myStationId) {
    if (data.fromStationId === myStationId) {
      showNotification('New export request created');
    } else {
      showNotification('New import request incoming');
    }
  }
});

ticketSocket.on('export.ticket.completed', (data) => {
  if (data.fromStationId === myStationId) {
    showNotification(`${data.batteryCount} batteries exported`);
  }
});

ticketSocket.on('import.ticket.completed', (data) => {
  if (data.toStationId === myStationId) {
    showNotification(`${data.batteryCount} batteries imported`);
  }
});
```

### 3. Battery Tracking - Real-time Transit Status

```javascript
const ticketSocket = io('http://localhost:8080/battery-transfer-ticket');

// Track specific batteries
const trackingBatteryIds = [101, 102, 103];

ticketSocket.on('battery.transit.status', (data) => {
  const matchingBatteries = data.batteryIds.filter((id) =>
    trackingBatteryIds.includes(id)
  );

  if (matchingBatteries.length > 0) {
    if (data.inTransit) {
      updateBatteryStatus(matchingBatteries, 'IN_TRANSIT');
      showMap(data.fromStationName, data.toStationName);
    } else {
      updateBatteryStatus(matchingBatteries, 'ARRIVED');
      showNotification('Batteries have arrived!');
    }
  }
});
```

## Testing

### Test WebSocket Connections

```javascript
// test-websocket.js
const io = require('socket.io-client');

const requestSocket = io('http://localhost:8080/battery-transfer-request');
const ticketSocket = io('http://localhost:8080/battery-transfer-ticket');

requestSocket.on('connect', () => {
  console.log('✅ Connected to battery-transfer-request namespace');
});

ticketSocket.on('connect', () => {
  console.log('✅ Connected to battery-transfer-ticket namespace');
});

requestSocket.on('transfer.request.created', (data) => {
  console.log('📦 New transfer request:', data);
});

ticketSocket.on('export.ticket.completed', (data) => {
  console.log('📤 Export completed:', data);
});

ticketSocket.on('import.ticket.completed', (data) => {
  console.log('📥 Import completed:', data);
});

ticketSocket.on('battery.transit.status', (data) => {
  const status = data.inTransit ? '🚚 IN TRANSIT' : '✅ ARRIVED';
  console.log(`${status}:`, data.batteryIds);
});
```

Run: `node test-websocket.js`

### Test with API Calls

1. **Create Transfer Request** (triggers `transfer.request.created`)

```bash
POST http://localhost:8080/api/v1/battery-transfer-request
{
  "from_station_id": 1,
  "to_station_id": 2,
  "battery_model": "Model X",
  "battery_type": "lithium",
  "quantity": 5
}
```

2. **Create Export Ticket** (triggers `export.ticket.completed`, `battery.transit.status`)

```bash
POST http://localhost:8080/api/v1/battery-transfer-ticket
{
  "transfer_request_id": 1,
  "ticket_type": "export",
  "station_id": 1,
  "staff_id": 4,
  "battery_ids": [101, 102, 103, 104, 105]
}
```

3. **Create Import Ticket** (triggers `import.ticket.completed`, `battery.transit.status`)

```bash
POST http://localhost:8080/api/v1/battery-transfer-ticket
{
  "transfer_request_id": 1,
  "ticket_type": "import",
  "station_id": 2,
  "staff_id": 5,
  "battery_ids": [101, 102, 103, 104, 105]
}
```

4. **Update Transfer Request Status** (triggers `transfer.request.status.updated`)

```bash
PATCH http://localhost:8080/api/v1/battery-transfer-request/1
{
  "status": "completed"
}
```

## Room-based Notifications

The gateways support targeted notifications to specific groups:

### Station Rooms

```typescript
// Notify specific station
gateway.notifyStation(stationId, 'custom.event', data);
```

### Admin Rooms

```typescript
// Notify all admins
gateway.notifyAdmins('custom.event', data);
```

### Staff Rooms

```typescript
// Notify specific staff member
gateway.notifyStaff(staffId, 'custom.event', data);
```

## Files Created/Modified

### Created
- `backend/src/modules/battery-transfer-request/battery-transfer-request.gateway.ts`
- `backend/src/modules/battery-transfer-ticket/battery-transfer-ticket.gateway.ts`

### Modified
- `backend/src/modules/battery-transfer-request/battery-transfer-request.module.ts`
- `backend/src/modules/battery-transfer-request/battery-transfer-request.service.ts`
- `backend/src/modules/battery-transfer-ticket/battery-transfer-ticket.module.ts`
- `backend/src/modules/battery-transfer-ticket/battery-transfer-ticket.service.ts`

## Benefits

✅ Real-time updates without polling
✅ Reduced server load
✅ Better user experience
✅ Station-specific notifications
✅ Battery tracking in real-time
✅ Immediate status updates
✅ Cross-station coordination

## Next Steps

1. Add authentication to WebSocket connections
2. Implement room join/leave for station-specific subscriptions
3. Add reconnection handling in frontend
4. Create notification queue for offline users
5. Add WebSocket event logging
6. Implement rate limiting for events

## Support

For issues or questions, refer to:
- NestJS WebSocket Documentation: https://docs.nestjs.com/websockets/gateways
- Socket.IO Documentation: https://socket.io/docs/v4/
