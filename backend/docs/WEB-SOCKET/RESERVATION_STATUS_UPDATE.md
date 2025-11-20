# Reservation Status Update - WebSocket Implementation

## Overview

Phần này mô tả chi tiết về WebSocket event `reservation.status.updated` được emit khi status của reservation thay đổi. Event này giúp staff và user nhận real-time notification khi reservation được cập nhật (completed, cancelled, v.v.).

## Event: `reservation.status.updated`

### When is it triggered?

Event này được emit khi:
- User cancel reservation (scheduled → cancelled)
- Staff hoàn thành reservation (scheduled → completed)
- System tự động cancel khi quá thời gian (scheduled → cancelled - via cron job)
- Bất kỳ thay đổi status nào của reservation

### Event Payload

#### TypeScript Interface

```typescript
export interface ReservationStatusUpdatedEvent {
  reservationId: number;
  stationId: number;
  stationName: string;
  previousStatus: ReservationStatus;
  currentStatus: ReservationStatus;
  scheduledTime: string; // ISO 8601 format
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
  timestamp: string; // ISO 8601 format
}

enum ReservationStatus {
  scheduled = 'scheduled',
  completed = 'completed',
  cancelled = 'cancelled'
}
```

#### JSON Example

```json
{
  "reservationId": 42,
  "stationId": 5,
  "stationName": "Trạm FPT University",
  "previousStatus": "scheduled",
  "currentStatus": "cancelled",
  "scheduledTime": "2025-01-20T14:30:00.000Z",
  "updatedBy": {
    "userId": 123,
    "username": "staff_nguyen",
    "role": "staff"
  },
  "vehicle": {
    "id": 18,
    "vin": "VF8XYZ123456789"
  },
  "user": {
    "id": 25,
    "username": "customer_tran",
    "email": "tran@example.com"
  },
  "timestamp": "2025-01-20T14:15:30.500Z"
}
```

## Integration Points

### Backend Implementation

**File:** `src/modules/reservations/reservations.service.ts`

**Method:** `updateReservationStatus()` (lines ~202-267)

```typescript
async updateReservationStatus(
  id: number,
  user_id: number,
  vehicle_id: number,
  status: ReservationStatus,
  tx?: any
) {
  const prisma = tx || this.databaseService;

  // Fetch reservation with relations
  const reservationUpdate = await prisma.reservation.findUnique({
    where: { reservation_id: id, vehicle_id: vehicle_id },
    include: {
      station: true,
      vehicle: true,
      user: true
    }
  })

  // ... validation logic ...

  // Store previous status
  const previousStatus = reservationUpdate.status;

  // ... update battery status if cancelled ...

  // Update reservation
  const updatedReservation = await prisma.reservation.update({
    where: { reservation_id: id },
    data: { status },
    include: {
      battery: {
        select: {
          battery_id: true,
          status: true,
        }
      }
    },
  });

  // Emit WebSocket event if status changed
  if (previousStatus !== status) {
    const payload: ReservationStatusUpdatedEvent = {
      reservationId: reservationUpdate.reservation_id,
      stationId: reservationUpdate.station.station_id,
      stationName: reservationUpdate.station.name,
      previousStatus,
      currentStatus: status,
      scheduledTime: reservationUpdate.scheduled_time.toISOString(),
      vehicle: {
        id: reservationUpdate.vehicle.vehicle_id,
        vin: reservationUpdate.vehicle.vin
      },
      user: {
        id: reservationUpdate.user.user_id,
        username: reservationUpdate.user.username,
        email: reservationUpdate.user.email
      },
      timestamp: new Date().toISOString()
    };

    this.reservationsGateway.notifyReservationStatusUpdated(payload);
  }

  return updatedReservation;
}
```

**File:** `src/modules/reservations/reservations.gateway.ts`

**Method:** `notifyReservationStatusUpdated()` (lines ~56-67)

```typescript
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
```

## Testing Guide

### Method 1: HTML Test Client

1. Mở file `test/test-websocket-reservations.html` trong browser
2. Kết nối WebSocket (namespace `/reservations`)
3. Tạo một reservation qua API (hoặc sử dụng reservation có sẵn)
4. Gọi API update status:

```bash
# Cancel reservation
curl -X PATCH http://localhost:8080/api/v1/reservations/:id/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "vehicle_id": 1
  }'

# Complete reservation (staff only)
curl -X PATCH http://localhost:8080/api/v1/reservations/:id/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

5. Quan sát Event Log trong HTML client - bạn sẽ thấy event `reservation.status.updated`

### Method 2: Node.js Client

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:8080/reservations', {
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('reservation.status.updated', (data) => {
  console.log('📊 Reservation Status Updated:');
  console.log('  Reservation ID:', data.reservationId);
  console.log('  Station:', data.stationName);
  console.log('  Status Change:', `${data.previousStatus} → ${data.currentStatus}`);
  console.log('  User:', data.user.username);
  console.log('  Vehicle VIN:', data.vehicle.vin);
  console.log('  Timestamp:', data.timestamp);
  
  if (data.updatedBy) {
    console.log('  Updated By:', data.updatedBy.username, `(${data.updatedBy.role})`);
  }
});
```

### Method 3: Postman Collection

1. Import `test/websocket-test.postman_collection.json`
2. Connect to WebSocket: `ws://localhost:8080/reservations`
3. Listen for event: `reservation.status.updated`
4. Use API requests to update reservation status
5. Verify events in WebSocket tab

### Method 4: Swagger UI

1. Truy cập http://localhost:8080/api
2. Authenticate với JWT token
3. Sử dụng endpoint PATCH `/api/v1/reservations/{id}/cancel` hoặc `/complete`
4. Kiểm tra Event Log trong HTML test client

## Use Cases

### 1. Staff Dashboard - Real-time Reservation Management

**Scenario:** Staff monitor tất cả reservation updates tại station

```typescript
// Frontend - Staff Dashboard
socket.on('reservation.status.updated', (data) => {
  // Filter cho station hiện tại
  if (data.stationId === currentStationId) {
    
    // Update UI
    updateReservationCard(data.reservationId, {
      status: data.currentStatus,
      previousStatus: data.previousStatus,
      timestamp: data.timestamp
    });
    
    // Show notification
    if (data.currentStatus === 'cancelled') {
      showNotification(`⚠️ Reservation #${data.reservationId} cancelled by ${data.user.username}`);
      // Free up the slot in schedule
      updateSchedule();
    } else if (data.currentStatus === 'completed') {
      showNotification(`✅ Reservation #${data.reservationId} completed!`);
      // Update statistics
      incrementCompletedCount();
    }
  }
});
```

### 2. User Mobile App - Order Tracking

**Scenario:** User nhận notification khi reservation của họ thay đổi

```typescript
// Frontend - Mobile App
socket.on('reservation.status.updated', (data) => {
  // Filter cho user hiện tại
  if (data.user.id === currentUserId) {
    
    // Update order status UI
    updateOrderStatus(data.reservationId, data.currentStatus);
    
    // Push notification
    if (data.currentStatus === 'cancelled') {
      sendPushNotification({
        title: 'Reservation Cancelled',
        body: `Your reservation at ${data.stationName} has been cancelled`,
        icon: '⚠️'
      });
    } else if (data.currentStatus === 'completed') {
      sendPushNotification({
        title: 'Reservation Completed',
        body: `Your battery swap at ${data.stationName} is complete!`,
        icon: '✅'
      });
    }
  }
});
```

### 3. Admin Dashboard - System-wide Monitoring

**Scenario:** Admin monitor tất cả status changes trong hệ thống

```typescript
// Frontend - Admin Dashboard
socket.on('reservation.status.updated', (data) => {
  // Log all changes
  addToActivityLog({
    type: 'reservation_status_change',
    reservationId: data.reservationId,
    station: data.stationName,
    user: data.user.username,
    change: `${data.previousStatus} → ${data.currentStatus}`,
    timestamp: data.timestamp,
    updatedBy: data.updatedBy?.username || 'System'
  });
  
  // Update analytics
  updateStatusChangeMetrics({
    fromStatus: data.previousStatus,
    toStatus: data.currentStatus,
    stationId: data.stationId,
    timestamp: data.timestamp
  });
  
  // Alert on unusual patterns
  if (data.currentStatus === 'cancelled') {
    checkCancellationRate(data.stationId);
  }
});
```

### 4. Digital Display - Station Queue Monitor

**Scenario:** Màn hình hiển thị queue tại station cập nhật real-time

```typescript
// Frontend - Station Display
socket.on('reservation.status.updated', (data) => {
  if (data.stationId === currentStationId) {
    
    if (data.currentStatus === 'completed' || data.currentStatus === 'cancelled') {
      // Remove from queue
      removeFromQueue(data.reservationId);
      
      // Show next in line
      showNextCustomer();
      
      // Update queue length
      updateQueueDisplay();
    }
  }
});
```

## Frontend Integration Examples

### React Hook

```typescript
// hooks/useReservationUpdates.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ReservationUpdate {
  reservationId: number;
  stationId: number;
  stationName: string;
  previousStatus: string;
  currentStatus: string;
  timestamp: string;
}

export const useReservationUpdates = (stationId?: number) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [updates, setUpdates] = useState<ReservationUpdate[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<ReservationUpdate | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:8080/reservations');
    setSocket(newSocket);

    newSocket.on('reservation.status.updated', (data) => {
      // Filter by station if specified
      if (!stationId || data.stationId === stationId) {
        setLatestUpdate(data);
        setUpdates(prev => [data, ...prev].slice(0, 50)); // Keep last 50
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [stationId]);

  return { socket, updates, latestUpdate };
};

// Usage in component
function StaffDashboard() {
  const { updates, latestUpdate } = useReservationUpdates(currentStationId);

  useEffect(() => {
    if (latestUpdate) {
      toast.info(`Reservation ${latestUpdate.currentStatus}: #${latestUpdate.reservationId}`);
    }
  }, [latestUpdate]);

  return (
    <div>
      <h2>Recent Updates</h2>
      <ul>
        {updates.map(update => (
          <li key={update.reservationId}>
            #{update.reservationId}: {update.previousStatus} → {update.currentStatus}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Vue Composable

```typescript
// composables/useReservationUpdates.ts
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

export function useReservationUpdates(stationId?: number) {
  const socket = ref(null);
  const updates = ref([]);
  const latestUpdate = ref(null);

  onMounted(() => {
    socket.value = io('http://localhost:8080/reservations');

    socket.value.on('reservation.status.updated', (data) => {
      if (!stationId || data.stationId === stationId) {
        latestUpdate.value = data;
        updates.value = [data, ...updates.value].slice(0, 50);
      }
    });
  });

  onUnmounted(() => {
    if (socket.value) {
      socket.value.disconnect();
    }
  });

  return { socket, updates, latestUpdate };
}
```

### Angular Service

```typescript
// services/reservation-websocket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservationWebSocketService {
  private socket: Socket;
  private statusUpdates$ = new Subject<any>();

  constructor() {
    this.socket = io('http://localhost:8080/reservations');
    
    this.socket.on('reservation.status.updated', (data) => {
      this.statusUpdates$.next(data);
    });
  }

  getStatusUpdates(): Observable<any> {
    return this.statusUpdates$.asObservable();
  }

  disconnect() {
    this.socket.disconnect();
  }
}

// Component usage
export class StaffDashboardComponent implements OnInit {
  constructor(private wsService: ReservationWebSocketService) {}

  ngOnInit() {
    this.wsService.getStatusUpdates().subscribe(update => {
      console.log('Status updated:', update);
      this.handleStatusUpdate(update);
    });
  }

  handleStatusUpdate(update: any) {
    // Update UI, show notification, etc.
  }
}
```

## Event Flow Diagram

```
User/Staff Action
    ↓
API Request: PATCH /reservations/:id/cancel
    ↓
reservations.service.ts::updateReservationStatus()
    ↓
1. Validate user & reservation
2. Store previousStatus
3. Update battery if cancelled
4. Update reservation in DB
    ↓
Check if status changed
    ↓ (if yes)
Build payload with reservation data
    ↓
reservations.gateway.ts::notifyReservationStatusUpdated()
    ↓
Emit 'reservation.status.updated' via Socket.IO
    ↓
All connected clients receive event
    ↓
Client-side handlers process event:
  - Staff Dashboard: Update UI, show notification
  - User App: Push notification, update order status
  - Admin Panel: Log activity, update metrics
  - Display Screen: Update queue
```

## Status Transition Matrix

| From Status | To Status | Triggered By | Battery Status Change | Event Emitted |
|-------------|-----------|--------------|----------------------|---------------|
| scheduled | cancelled | User/System | booked → full | ✅ Yes |
| scheduled | completed | Staff/System | booked → in_use | ✅ Yes |
| cancelled | scheduled | N/A (not allowed) | - | ❌ No |
| completed | cancelled | N/A (not allowed) | - | ❌ No |

## Performance Considerations

### Event Frequency

- **Normal Load:** 5-10 status updates per minute per station
- **Peak Load:** 20-30 status updates per minute per station
- **Network Traffic:** ~1KB per event

### Optimization Tips

1. **Client-side Filtering:**
```typescript
// Don't subscribe to all stations if you only need one
socket.on('reservation.status.updated', (data) => {
  if (data.stationId !== currentStationId) return; // Early return
  // Process event
});
```

2. **Room-based Broadcasting (Future Enhancement):**
```typescript
// Server-side - send only to relevant clients
notifyStation(stationId, 'reservation.status.updated', payload);
notifyUser(userId, 'reservation.status.updated', payload);
```

3. **Debouncing (Client-side):**
```typescript
// If receiving too many events, debounce UI updates
const debouncedUpdate = debounce((data) => {
  updateUI(data);
}, 300);

socket.on('reservation.status.updated', debouncedUpdate);
```

## Error Handling

### Server-side

```typescript
try {
  this.reservationsGateway.notifyReservationStatusUpdated(payload);
} catch (error) {
  this.logger.error(`Failed to emit reservation.status.updated: ${error.message}`);
  // Continue - don't block DB update if WebSocket fails
}
```

### Client-side

```typescript
socket.on('connect_error', (error) => {
  console.error('WebSocket connection failed:', error);
  // Fallback to polling
  startPolling();
});

socket.on('reservation.status.updated', (data) => {
  try {
    updateUI(data);
  } catch (error) {
    console.error('Error handling status update:', error);
    // Log to error tracking service
  }
});
```

## Security Considerations

### Current Implementation (Public Broadcast)
- All connected clients receive all events
- Suitable for staff dashboards monitoring entire system
- **Risk:** Users could see other users' reservations

### Recommended Enhancement (Room-based)

```typescript
// Join specific rooms based on role
socket.on('connect', () => {
  if (userRole === 'staff') {
    socket.emit('join:station', { stationId: currentStationId });
  } else if (userRole === 'customer') {
    socket.emit('join:user', { userId: currentUserId });
  } else if (userRole === 'admin') {
    socket.emit('join:admin');
  }
});

// Server-side - emit to specific rooms
notifyStation(stationId, 'reservation.status.updated', payload);
notifyUser(userId, 'reservation.status.updated', payload);
notifyAdmins('reservation.status.updated', payload);
```

## Next Steps & Enhancements

1. **Room-based Broadcasting** ⭐ High Priority
   - Implement `notifyStation()`, `notifyUser()` methods
   - Add join/leave room logic
   - Filter events by user role

2. **Add updatedBy field** ⭐ Medium Priority
   - Track who made the status change (user/staff/system)
   - Include in event payload
   - Useful for audit logs

3. **Batch Updates** 🔄 Low Priority
   - For cron job cancellations (many at once)
   - Group multiple updates into single event
   - Reduce network traffic

4. **Event Acknowledgment** 🔄 Low Priority
   - Client confirms receipt of important events
   - Retry failed deliveries
   - Track delivery success rate

5. **Rate Limiting** 🔄 Low Priority
   - Prevent abuse of status update API
   - Limit events per user/station
   - Throttle rapid status changes

## Testing Checklist

- [x] ✅ Interface `ReservationStatusUpdatedEvent` defined in gateway
- [x] ✅ Method `notifyReservationStatusUpdated()` implemented in gateway
- [x] ✅ Gateway injected in service constructor
- [x] ✅ Service method emits event on status change
- [x] ✅ Event includes all required fields (reservation, station, user, vehicle)
- [x] ✅ Previous status tracked and included
- [x] ✅ Timestamp added to event
- [x] ✅ HTML test client updated to show status updates
- [x] ✅ Statistics counter for status updates
- [x] ✅ Event logging with color coding
- [ ] 🔲 Manual test: Cancel reservation via API
- [ ] 🔲 Manual test: Complete reservation via API
- [ ] 🔲 Verify event payload structure
- [ ] 🔲 Test with multiple connected clients
- [ ] 🔲 Test with different user roles

## Troubleshooting

### Event not received by client

**Check:**
1. WebSocket connected? (See connection status in HTML client)
2. Correct namespace? Should be `/reservations`
3. Status actually changed? (previousStatus !== currentStatus)
4. Check server logs for "Broadcasting reservation.status.updated"
5. Browser console for errors

### Wrong data in payload

**Check:**
1. Reservation exists in DB?
2. Relations loaded? (station, vehicle, user)
3. previousStatus captured before update?
4. TypeScript types match interfaces?

### Multiple events received

**Possible causes:**
1. Multiple clients connected (normal behavior)
2. Status updated multiple times in quick succession
3. Client not filtering by stationId/userId

## Related Files

- `src/modules/reservations/reservations.gateway.ts` - Gateway with event definitions
- `src/modules/reservations/reservations.service.ts` - Service emitting events
- `src/modules/reservations/reservations.module.ts` - Module configuration
- `test/test-websocket-reservations.html` - HTML test client
- `docs/WEB-SOCKET/IMPLEMENTATION_BATTERIES_SWAPS.md` - Similar implementation for batteries/swaps
- `docs/WEB-SOCKET/WEBSOCKET_USE_CASES.md` - Use cases analysis
- `docs/WEB-SOCKET/FRONTEND_WEBSOCKET_INTEGRATION.md` - Frontend integration guide

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Author:** Development Team
