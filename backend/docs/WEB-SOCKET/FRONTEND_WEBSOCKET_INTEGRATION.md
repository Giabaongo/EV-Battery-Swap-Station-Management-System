# WebSocket Integration Guide for Frontend

## 📡 Overview

Hệ thống đã implement WebSocket để nhận real-time notifications khi có reservation mới được tạo. Document này hướng dẫn Frontend team cách integrate WebSocket vào ứng dụng.

---

## 🔧 Technical Specifications

### WebSocket Endpoint
```
URL: http://localhost:8080/reservations
Protocol: Socket.IO v4.x
Transport: WebSocket + Polling (fallback)
```

### CORS Configuration
- **Development:** Allow all origins (`origin: true`)
- **Production:** Specific domains only
- **Credentials:** Enabled

### Authentication
- ❌ **NOT required** for WebSocket connection
- ✅ **Required** for API calls (JWT Bearer token)

---

## 📦 Installation

### React/Next.js
```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

### Vue.js
```bash
npm install socket.io-client
# or
yarn add socket.io-client vue-socket.io-extended
```

### Angular
```bash
npm install socket.io-client
# or
yarn add socket.io-client ngx-socket-io
```

---

## 🚀 Implementation

### React/Next.js Example

#### 1. Create WebSocket Hook

**`hooks/useReservationSocket.ts`**
```typescript
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface ReservationCreatedEvent {
  reservationId: number;
  stationId: number;
  stationName: string;
  scheduledTime: string; // ISO 8601
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

interface UseReservationSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  lastReservation: ReservationCreatedEvent | null;
  reservations: ReservationCreatedEvent[];
  error: string | null;
}

export const useReservationSocket = (
  serverUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
): UseReservationSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastReservation, setLastReservation] = useState<ReservationCreatedEvent | null>(null);
  const [reservations, setReservations] = useState<ReservationCreatedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create socket connection
    const socketInstance = io(`${serverUrl}/reservations`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection events
    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected:', socketInstance.id);
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
      setError(err.message);
      setIsConnected(false);
    });

    // Business event: reservation.created
    socketInstance.on('reservation.created', (data: ReservationCreatedEvent) => {
      console.log('🔔 New reservation created:', data);
      setLastReservation(data);
      setReservations(prev => [data, ...prev]);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [serverUrl]);

  return {
    socket,
    isConnected,
    lastReservation,
    reservations,
    error,
  };
};
```

#### 2. Create Context Provider (Optional)

**`contexts/ReservationSocketContext.tsx`**
```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { useReservationSocket } from '@/hooks/useReservationSocket';
import { Socket } from 'socket.io-client';

interface ReservationCreatedEvent {
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

interface ReservationSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  lastReservation: ReservationCreatedEvent | null;
  reservations: ReservationCreatedEvent[];
  error: string | null;
}

const ReservationSocketContext = createContext<ReservationSocketContextValue | undefined>(undefined);

export const ReservationSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const socketData = useReservationSocket();

  return (
    <ReservationSocketContext.Provider value={socketData}>
      {children}
    </ReservationSocketContext.Provider>
  );
};

export const useReservationSocketContext = () => {
  const context = useContext(ReservationSocketContext);
  if (!context) {
    throw new Error('useReservationSocketContext must be used within ReservationSocketProvider');
  }
  return context;
};
```

#### 3. Wrap App with Provider

**`app/layout.tsx`** (Next.js) or **`App.tsx`** (React)
```typescript
import { ReservationSocketProvider } from '@/contexts/ReservationSocketContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ReservationSocketProvider>
          {children}
        </ReservationSocketProvider>
      </body>
    </html>
  );
}
```

#### 4. Use in Components

**`components/StationDashboard.tsx`**
```typescript
'use client';

import { useReservationSocketContext } from '@/contexts/ReservationSocketContext';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast'; // or your notification library

export default function StationDashboard() {
  const { isConnected, lastReservation, reservations, error } = useReservationSocketContext();

  useEffect(() => {
    if (lastReservation) {
      // Show toast notification
      toast.success(
        `New reservation at ${lastReservation.stationName}!\n` +
        `User: ${lastReservation.user.username}\n` +
        `Time: ${new Date(lastReservation.scheduledTime).toLocaleString()}`
      );

      // Play sound (optional)
      const audio = new Audio('/notification.mp3');
      audio.play().catch(err => console.log('Audio play failed:', err));
    }
  }, [lastReservation]);

  return (
    <div className="p-6">
      {/* Connection Status */}
      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-sm ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
        {error && <p className="text-red-600 text-sm mt-2">Error: {error}</p>}
      </div>

      {/* Reservations List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Recent Reservations</h2>
        {reservations.length === 0 ? (
          <p className="text-gray-500">No reservations yet...</p>
        ) : (
          <div className="grid gap-4">
            {reservations.map((reservation) => (
              <div 
                key={reservation.reservationId}
                className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {reservation.stationName}
                    </h3>
                    <p className="text-gray-600">
                      User: {reservation.user.username} ({reservation.user.email})
                    </p>
                    <p className="text-gray-600">
                      Vehicle: {reservation.vehicle.vin}
                    </p>
                    <p className="text-gray-600">
                      Battery ID: {reservation.batteryId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(reservation.scheduledTime).toLocaleString()}
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      ID: {reservation.reservationId}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Vue.js Example

#### 1. Create Composable

**`composables/useReservationSocket.ts`**
```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

interface ReservationCreatedEvent {
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

export const useReservationSocket = () => {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);
  const lastReservation = ref<ReservationCreatedEvent | null>(null);
  const reservations = ref<ReservationCreatedEvent[]>([]);
  const error = ref<string | null>(null);

  onMounted(() => {
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    
    socket.value = io(`${serverUrl}/reservations`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.value.on('connect', () => {
      console.log('✅ WebSocket connected');
      isConnected.value = true;
      error.value = null;
    });

    socket.value.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      isConnected.value = false;
    });

    socket.value.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
      error.value = err.message;
      isConnected.value = false;
    });

    socket.value.on('reservation.created', (data: ReservationCreatedEvent) => {
      console.log('🔔 New reservation:', data);
      lastReservation.value = data;
      reservations.value.unshift(data);
    });
  });

  onUnmounted(() => {
    socket.value?.disconnect();
  });

  return {
    socket,
    isConnected,
    lastReservation,
    reservations,
    error,
  };
};
```

#### 2. Use in Component

**`components/StationDashboard.vue`**
```vue
<template>
  <div class="p-6">
    <!-- Connection Status -->
    <div class="mb-4">
      <span 
        :class="[
          'px-3 py-1 rounded-full text-sm',
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        ]"
      >
        {{ isConnected ? '🟢 Connected' : '🔴 Disconnected' }}
      </span>
      <p v-if="error" class="text-red-600 text-sm mt-2">Error: {{ error }}</p>
    </div>

    <!-- Reservations List -->
    <div class="space-y-4">
      <h2 class="text-2xl font-bold">Recent Reservations</h2>
      <p v-if="reservations.length === 0" class="text-gray-500">
        No reservations yet...
      </p>
      <div v-else class="grid gap-4">
        <div 
          v-for="reservation in reservations" 
          :key="reservation.reservationId"
          class="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500"
        >
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-semibold text-lg">{{ reservation.stationName }}</h3>
              <p class="text-gray-600">
                User: {{ reservation.user.username }} ({{ reservation.user.email }})
              </p>
              <p class="text-gray-600">Vehicle: {{ reservation.vehicle.vin }}</p>
              <p class="text-gray-600">Battery ID: {{ reservation.batteryId }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">
                {{ formatDate(reservation.scheduledTime) }}
              </p>
              <span class="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                ID: {{ reservation.reservationId }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useReservationSocket } from '@/composables/useReservationSocket';
import { useToast } from 'vue-toastification'; // or your notification library

const { isConnected, lastReservation, reservations, error } = useReservationSocket();
const toast = useToast();

// Watch for new reservations
watch(lastReservation, (newReservation) => {
  if (newReservation) {
    toast.success(
      `New reservation at ${newReservation.stationName}!\n` +
      `User: ${newReservation.user.username}`
    );

    // Play sound
    const audio = new Audio('/notification.mp3');
    audio.play().catch(err => console.log('Audio play failed:', err));
  }
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};
</script>
```

---

### Angular Example

#### 1. Create Service

**`services/reservation-socket.service.ts`**
```typescript
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class ReservationSocketService {
  private socket: Socket;
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  private lastReservationSubject = new BehaviorSubject<ReservationCreatedEvent | null>(null);
  private reservationsSubject = new BehaviorSubject<ReservationCreatedEvent[]>([]);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public isConnected$: Observable<boolean> = this.isConnectedSubject.asObservable();
  public lastReservation$: Observable<ReservationCreatedEvent | null> = this.lastReservationSubject.asObservable();
  public reservations$: Observable<ReservationCreatedEvent[]> = this.reservationsSubject.asObservable();
  public error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor() {
    this.socket = io(`${environment.apiUrl}/reservations`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      this.isConnectedSubject.next(true);
      this.errorSubject.next(null);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnectedSubject.next(false);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
      this.errorSubject.next(err.message);
      this.isConnectedSubject.next(false);
    });

    this.socket.on('reservation.created', (data: ReservationCreatedEvent) => {
      console.log('🔔 New reservation:', data);
      this.lastReservationSubject.next(data);
      
      const currentReservations = this.reservationsSubject.value;
      this.reservationsSubject.next([data, ...currentReservations]);
    });
  }

  public disconnect(): void {
    this.socket.disconnect();
  }
}
```

#### 2. Use in Component

**`components/station-dashboard.component.ts`**
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReservationSocketService, ReservationCreatedEvent } from '../services/reservation-socket.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr'; // or your notification library

@Component({
  selector: 'app-station-dashboard',
  templateUrl: './station-dashboard.component.html',
  styleUrls: ['./station-dashboard.component.css']
})
export class StationDashboardComponent implements OnInit, OnDestroy {
  isConnected = false;
  reservations: ReservationCreatedEvent[] = [];
  error: string | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private reservationSocket: ReservationSocketService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Subscribe to connection status
    this.subscriptions.push(
      this.reservationSocket.isConnected$.subscribe(
        connected => this.isConnected = connected
      )
    );

    // Subscribe to reservations
    this.subscriptions.push(
      this.reservationSocket.reservations$.subscribe(
        reservations => this.reservations = reservations
      )
    );

    // Subscribe to errors
    this.subscriptions.push(
      this.reservationSocket.error$.subscribe(
        error => this.error = error
      )
    );

    // Subscribe to new reservations for notifications
    this.subscriptions.push(
      this.reservationSocket.lastReservation$.subscribe(
        reservation => {
          if (reservation) {
            this.toastr.success(
              `User: ${reservation.user.username}`,
              `New reservation at ${reservation.stationName}`
            );

            // Play sound
            const audio = new Audio('/assets/notification.mp3');
            audio.play().catch(err => console.log('Audio play failed:', err));
          }
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.reservationSocket.disconnect();
  }
}
```

**`components/station-dashboard.component.html`**
```html
<div class="p-6">
  <!-- Connection Status -->
  <div class="mb-4">
    <span 
      [class]="isConnected 
        ? 'px-3 py-1 rounded-full text-sm bg-green-100 text-green-800' 
        : 'px-3 py-1 rounded-full text-sm bg-red-100 text-red-800'"
    >
      {{ isConnected ? '🟢 Connected' : '🔴 Disconnected' }}
    </span>
    <p *ngIf="error" class="text-red-600 text-sm mt-2">Error: {{ error }}</p>
  </div>

  <!-- Reservations List -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold">Recent Reservations</h2>
    <p *ngIf="reservations.length === 0" class="text-gray-500">
      No reservations yet...
    </p>
    <div *ngIf="reservations.length > 0" class="grid gap-4">
      <div 
        *ngFor="let reservation of reservations"
        class="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-lg">{{ reservation.stationName }}</h3>
            <p class="text-gray-600">
              User: {{ reservation.user.username }} ({{ reservation.user.email }})
            </p>
            <p class="text-gray-600">Vehicle: {{ reservation.vehicle.vin }}</p>
            <p class="text-gray-600">Battery ID: {{ reservation.batteryId }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500">
              {{ reservation.scheduledTime | date:'short' }}
            </p>
            <span class="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              ID: {{ reservation.reservationId }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 📋 Event Reference

### Event: `reservation.created`

**Emitted when:** User successfully creates a new reservation via API

**Payload Type:**
```typescript
interface ReservationCreatedEvent {
  reservationId: number;        // ID của reservation vừa tạo
  stationId: number;            // ID của station
  stationName: string;          // Tên station
  scheduledTime: string;        // Thời gian đặt lịch (ISO 8601 format)
  batteryId: number;            // ID của battery được book
  vehicle: {
    id: number;                 // ID của vehicle
    vin: string;                // VIN số
    batteryModel: string;       // Model của battery (VD: "LFP-100")
    batteryType: string;        // Loại battery (VD: "Lithium Iron Phosphate")
  };
  user: {
    id: number;                 // ID của user
    username: string;           // Username
    email: string;              // Email
    phone: string;              // Số điện thoại
  };
}
```

**Example Payload:**
```json
{
  "reservationId": 42,
  "stationId": 1,
  "stationName": "Station A - Downtown",
  "scheduledTime": "2025-11-19T15:30:00.000Z",
  "batteryId": 15,
  "vehicle": {
    "id": 7,
    "vin": "1HGBH41JXMN109186",
    "batteryModel": "LFP-100",
    "batteryType": "Lithium Iron Phosphate"
  },
  "user": {
    "id": 23,
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "0901234567"
  }
}
```

---

## 🎨 UI/UX Recommendations

### 1. Connection Indicator
Display WebSocket connection status clearly:
```
🟢 Live (connected)
🟡 Connecting...
🔴 Offline (disconnected)
```

### 2. Toast Notifications
Show temporary notifications when new reservations arrive:
- Title: "New Reservation!"
- Body: Station name, user name, time
- Duration: 5-7 seconds
- Position: Top-right corner

### 3. Sound Alerts (Optional)
Play sound when new reservation:
- Use subtle, non-intrusive sound
- Allow users to mute/unmute
- Save preference in localStorage

### 4. Badge Counter
Show number of unread/new reservations:
```tsx
<Bell className="w-6 h-6" />
{newCount > 0 && (
  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
    {newCount}
  </span>
)}
```

### 5. Auto-scroll
When new reservation arrives, auto-scroll to top of list or highlight new item.

### 6. Filter by Station (for Staff)
If user is station staff, only show reservations for their station:
```typescript
const filteredReservations = reservations.filter(
  r => r.stationId === currentUser.station_id
);
```

---

## 🔒 Security Considerations

### 1. Environment Variables
Store API URL in environment variables:

**React/Next.js (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Vue.js (.env):**
```env
VITE_API_URL=http://localhost:8080
```

**Angular (environment.ts):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

### 2. Production URLs
Update for production:
```env
# Production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Staging
NEXT_PUBLIC_API_URL=https://staging-api.yourdomain.com
```

### 3. No Sensitive Data
WebSocket connection doesn't require authentication, but:
- Don't send sensitive data through WebSocket
- Validate all data received from server
- Use API with JWT for sensitive operations

---

## 🐛 Error Handling

### Common Issues & Solutions

#### 1. Connection Failed
```typescript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  
  // Show user-friendly message
  showNotification({
    type: 'error',
    title: 'Connection Lost',
    message: 'Unable to connect to real-time updates. Retrying...'
  });
});
```

#### 2. Reconnection
```typescript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  
  showNotification({
    type: 'success',
    title: 'Connected',
    message: 'Real-time updates restored!'
  });
});
```

#### 3. Max Reconnection Attempts
```typescript
socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect after maximum attempts');
  
  showNotification({
    type: 'error',
    title: 'Connection Failed',
    message: 'Please refresh the page to reconnect.',
    action: {
      label: 'Refresh',
      onClick: () => window.location.reload()
    }
  });
});
```

---

## 📊 Testing

### Test Checklist

- [ ] Socket connects successfully on app load
- [ ] Connection status indicator updates correctly
- [ ] New reservation event triggers notification
- [ ] Event data is displayed correctly in UI
- [ ] Multiple events are handled properly
- [ ] Reconnection works after disconnect
- [ ] Error states are displayed
- [ ] Sound notification plays (if implemented)
- [ ] Badge counter updates correctly
- [ ] Cleanup on component unmount (no memory leaks)

### Manual Testing Steps

1. **Start both servers:**
   ```bash
   # Backend
   cd backend
   npm run start:dev
   
   # Frontend
   cd frontend
   npm run dev
   ```

2. **Open app in browser**
   - Check connection indicator shows "Connected"

3. **Create reservation via API:**
   - Use Postman or cURL
   - POST `/api/v1/reservations`
   - With valid JWT token

4. **Verify in UI:**
   - Toast notification appears
   - New reservation shows in list
   - Data is correct

5. **Test reconnection:**
   - Stop backend server
   - Check status shows "Disconnected"
   - Restart server
   - Check auto-reconnect works

---

## 📈 Performance Optimization

### 1. Debounce Updates
If receiving many events, debounce UI updates:
```typescript
import { debounce } from 'lodash';

const updateReservationList = debounce((newReservation) => {
  setReservations(prev => [newReservation, ...prev]);
}, 300);
```

### 2. Limit Stored Reservations
Don't keep all reservations in memory:
```typescript
const MAX_RESERVATIONS = 50;

setReservations(prev => {
  const updated = [newReservation, ...prev];
  return updated.slice(0, MAX_RESERVATIONS);
});
```

### 3. Lazy Load Old Reservations
Load older reservations from API when needed:
```typescript
const loadMoreReservations = async () => {
  const response = await fetch('/api/v1/reservations/station/1?page=2');
  const olderReservations = await response.json();
  setReservations(prev => [...prev, ...olderReservations]);
};
```

---

## 🚀 Deployment

### Frontend Build

Ensure WebSocket URL is configurable:

**Next.js:**
```javascript
// next.config.js
module.exports = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
};
```

**React (Vite):**
```javascript
// vite.config.ts
export default defineConfig({
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8080'),
  },
});
```

### Environment Variables (Production)

Set in your deployment platform:

**Vercel:**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

**Netlify:**
```
VITE_API_URL=https://api.yourdomain.com
```

**Docker:**
```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

---

## 📞 Support & Resources

### Documentation
- Socket.IO Client: https://socket.io/docs/v4/client-api/
- React hooks: https://react.dev/reference/react
- Vue composables: https://vuejs.org/guide/reusability/composables.html
- Angular services: https://angular.io/guide/architecture-services

### Backend API
- Base URL: `http://localhost:8080/api/v1`
- WebSocket: `http://localhost:8080/reservations`
- API Docs: `http://localhost:8080/api/docs`

### Contact
- Backend team for API issues
- Check server logs for debugging
- Review browser console for client errors

---

## ✅ Implementation Checklist

- [ ] Install socket.io-client package
- [ ] Create socket hook/service/composable
- [ ] Add connection status indicator
- [ ] Implement event listener for `reservation.created`
- [ ] Display notifications (toast/alert)
- [ ] Update reservation list in real-time
- [ ] Add error handling
- [ ] Test connection/disconnection
- [ ] Test event reception
- [ ] Add cleanup on unmount
- [ ] Configure environment variables
- [ ] Test in production environment

---

**Happy Coding! 🎉**

If you need help, contact the backend team or check the test files in `backend/test-websocket-reservations.html` for working examples.
