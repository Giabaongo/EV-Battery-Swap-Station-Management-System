# WebSocket Quick Reference - Battery Transfer System

## 🔌 Connection URLs

```javascript
// Transfer Requests
const requestSocket = io('http://localhost:8080/battery-transfer-request');

// Transfer Tickets (Export/Import)
const ticketSocket = io('http://localhost:8080/battery-transfer-ticket');
```

## 📡 Events Cheat Sheet

### Transfer Request Events

| Event | When Triggered | Key Data |
|-------|---------------|----------|
| `transfer.request.created` | New transfer request created | `fromStationName`, `toStationName`, `quantity` |
| `transfer.request.status.updated` | Status changed | `previousStatus`, `currentStatus` |
| `transfer.request.updated` | Request details updated | `updatedFields[]` |

### Transfer Ticket Events

| Event | When Triggered | Key Data |
|-------|---------------|----------|
| `transfer.ticket.created` | Export/Import ticket created | `ticketType`, `batteryIds[]`, `stationName` |
| `export.ticket.completed` | Export completed | `fromStationName`, `toStationName`, `batteryCount` |
| `import.ticket.completed` | Import completed | `importedBy`, `slotAssignments[]` |
| `battery.transit.status` | Transit status changed | `inTransit` (true/false), `batteryIds[]` |

## 🎯 Common Patterns

### Listen to All Transfer Events

```javascript
const requestSocket = io('http://localhost:8080/battery-transfer-request');

requestSocket.on('transfer.request.created', (data) => {
  console.log('New request:', data);
});

requestSocket.on('transfer.request.status.updated', (data) => {
  console.log('Status:', data.currentStatus);
});
```

### Track Export/Import

```javascript
const ticketSocket = io('http://localhost:8080/battery-transfer-ticket');

ticketSocket.on('export.ticket.completed', (data) => {
  console.log(`Exported: ${data.batteryCount} batteries`);
});

ticketSocket.on('import.ticket.completed', (data) => {
  console.log(`Imported: ${data.batteryCount} batteries`);
});
```

### Monitor Battery Transit

```javascript
ticketSocket.on('battery.transit.status', (data) => {
  if (data.inTransit) {
    console.log('🚚 In transit:', data.batteryIds);
  } else {
    console.log('✅ Arrived:', data.batteryIds);
  }
});
```

## 🧪 Quick Test

```bash
# Terminal 1: Start server
npm run start:dev

# Terminal 2: Run WebSocket test
node test-transfer-websocket.js

# Terminal 3: Trigger events with API calls
# Use REST client or Postman
```

## 📝 API Triggers

| API Endpoint | Method | Triggers Event |
|-------------|--------|----------------|
| `/battery-transfer-request` | POST | `transfer.request.created` |
| `/battery-transfer-request/:id` | PATCH | `transfer.request.status.updated` |
| `/battery-transfer-ticket` (export) | POST | `export.ticket.completed`, `battery.transit.status` |
| `/battery-transfer-ticket` (import) | POST | `import.ticket.completed`, `battery.transit.status` |

## 🎨 Frontend Integration

### React Hook

```javascript
import { useEffect } from 'react';
import io from 'socket.io-client';

export const useTransferWebSocket = () => {
  useEffect(() => {
    const socket = io('http://localhost:8080/battery-transfer-request');
    
    socket.on('transfer.request.created', (data) => {
      // Handle new request
    });
    
    return () => socket.close();
  }, []);
};
```

### Vue Composition API

```javascript
import { onMounted, onUnmounted } from 'vue';
import io from 'socket.io-client';

export const useTransferWebSocket = () => {
  let socket;
  
  onMounted(() => {
    socket = io('http://localhost:8080/battery-transfer-request');
    socket.on('transfer.request.created', (data) => {
      // Handle new request
    });
  });
  
  onUnmounted(() => {
    socket?.close();
  });
};
```

## 🔍 Debug Tips

```javascript
// Enable debug mode
const socket = io('http://localhost:8080/battery-transfer-request', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
});

// Connection events
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.on('connect_error', (err) => console.error('Error:', err));
```

## 📊 Data Flow Example

```
Admin creates transfer request
  ↓
WebSocket: transfer.request.created
  ↓
Both stations receive notification
  ↓
Staff at Station A creates export ticket
  ↓
WebSocket: export.ticket.completed + battery.transit.status (inTransit=true)
  ↓
Batteries status → in_transit
  ↓
Staff at Station B creates import ticket
  ↓
WebSocket: import.ticket.completed + battery.transit.status (inTransit=false)
  ↓
Batteries assigned to slots
  ↓
Admin updates request status → completed
  ↓
WebSocket: transfer.request.status.updated
```

## 📚 Documentation

- Full Guide: `docs/WEBSOCKET_TRANSFER_IMPLEMENTATION.md`
- Vietnamese Summary: `docs/WEBSOCKET_TRANSFER_SUMMARY_VI.md`
- Test Script: `test-transfer-websocket.js`

## 🚀 Start Using

1. Install dependencies: `npm install socket.io-client`
2. Start server: `npm run start:dev`
3. Connect frontend to WebSocket namespaces
4. Listen to events and update UI

Done! 🎉
