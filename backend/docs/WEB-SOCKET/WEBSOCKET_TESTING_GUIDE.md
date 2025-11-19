npm # WebSocket Reservation Testing Guide

## 🎯 Tổng quan

WebSocket implementation cho module Reservations đã được thêm vào với các thông tin sau:

### 📡 WebSocket Configuration
- **Namespace:** `/reservations`
- **Full URL:** `http://localhost:8080/reservations`
- **CORS:** Enabled (`origin: '*'`)
- **Transports:** WebSocket, Polling

### 📤 Events Emitted
- **Event Name:** `reservation.created`
- **Trigger:** Khi có reservation mới được tạo qua API POST `/api/v1/reservations`
- **Payload Structure:**
```typescript
{
  reservationId: number;
  stationId: number;
  stationName: string;
  scheduledTime: string; // ISO format
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
```

---

## 🧪 Phương pháp Test

### **Phương pháp 1: HTML Test Client (Recommended)**

1. **Mở file HTML:**
   - Mở file `test-websocket-reservations.html` trong browser
   - Path: `backend/test-websocket-reservations.html`

2. **Kết nối WebSocket:**
   - Server URL: `http://localhost:8080` (hoặc URL server của bạn)
   - Namespace: `/reservations`
   - Click "Connect to WebSocket"
   - Kiểm tra status hiển thị "Connected"

3. **Lấy JWT Token:**
   - Login qua API: `POST /api/v1/auth/login`
   - Copy token từ response
   - Paste vào field "JWT Token (Bearer)"

4. **Tạo Reservation:**
   - Nhập thông tin:
     - User ID (user đã login)
     - Vehicle ID (vehicle thuộc user đó)
     - Station ID (station tồn tại)
     - Scheduled Time (chọn thời gian trong tương lai, tối đa 60 phút)
   - Click "Create Reservation via API"
   - Quan sát Event Log để thấy WebSocket event

5. **Verify:**
   - Event Log sẽ hiển thị event `RESERVATION.CREATED`
   - Notification badge sẽ xuất hiện góc phải màn hình
   - Statistics counter sẽ tăng

---

### **Phương pháp 2: Postman WebSocket**

#### Setup Connection:
1. Mở Postman
2. New → WebSocket Request
3. URL: `ws://localhost:8080/reservations`
4. Click "Connect"

#### Listen for Events:
Sau khi connected, Postman sẽ tự động listen tất cả events từ server.

#### Trigger Event:
1. Mở tab mới trong Postman
2. Tạo POST request tới `http://localhost:8080/api/v1/reservations`
3. Headers:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   Content-Type: application/json
   ```
4. Body (raw JSON):
   ```json
   {
     "user_id": 1,
     "vehicle_id": 1,
     "station_id": 1,
     "scheduled_time": "2025-11-19T15:30:00.000Z"
   }
   ```
5. Send request
6. Quay lại WebSocket tab để xem event `reservation.created`

---

### **Phương pháp 3: Socket.IO Client (Node.js)**

#### Install dependencies:
```bash
npm install socket.io-client
```

#### Create test script `test-ws.js`:
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:8080/reservations', {
  transports: ['websocket', 'polling'],
  reconnection: true
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
  console.log('Socket ID:', socket.id);
});

socket.on('reservation.created', (data) => {
  console.log('\n🔔 New Reservation Created!');
  console.log('─────────────────────────────');
  console.log('Reservation ID:', data.reservationId);
  console.log('Station:', data.stationName, `(ID: ${data.stationId})`);
  console.log('Scheduled Time:', new Date(data.scheduledTime).toLocaleString());
  console.log('Battery ID:', data.batteryId);
  console.log('\nUser Info:');
  console.log('  - Username:', data.user.username);
  console.log('  - Email:', data.user.email);
  console.log('  - Phone:', data.user.phone);
  console.log('\nVehicle Info:');
  console.log('  - VIN:', data.vehicle.vin);
  console.log('  - Model:', data.vehicle.batteryModel);
  console.log('  - Type:', data.vehicle.batteryType);
  console.log('─────────────────────────────\n');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection Error:', error.message);
});

console.log('🔌 Connecting to WebSocket...');
console.log('Waiting for events... (Press Ctrl+C to exit)');
```

#### Run:
```bash
node test-ws.js
```

Sau đó tạo reservation qua API hoặc Postman để trigger event.

---

### **Phương pháp 4: Browser Console**

#### Mở DevTools Console và chạy:
```javascript
const socket = io('http://localhost:8080/reservations');

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('reservation.created', (data) => {
  console.log('🔔 New Reservation:', data);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});
```

---

## 📋 Test Cases

### TC1: Kết nối WebSocket thành công
**Steps:**
1. Start server: `npm run start:dev`
2. Connect client tới `http://localhost:8080/reservations`

**Expected:**
- Connection established
- Receive `connect` event
- Client có socket ID

---

### TC2: Nhận event khi tạo reservation
**Preconditions:**
- WebSocket client đã connected
- User đã login và có JWT token
- User có vehicle với subscription active
- Station có battery available

**Steps:**
1. POST `/api/v1/reservations` with valid data
2. Observe WebSocket client

**Expected:**
- API returns 201 Created
- WebSocket emits `reservation.created` event
- Event payload chứa đầy đủ thông tin:
  - reservationId
  - stationId, stationName
  - scheduledTime
  - batteryId
  - vehicle info (id, vin, model, type)
  - user info (id, username, email, phone)

---

### TC3: Multiple clients nhận cùng event
**Steps:**
1. Connect 2+ WebSocket clients
2. Create reservation via API

**Expected:**
- Tất cả clients nhận được event `reservation.created`
- Payload giống nhau cho tất cả clients

---

### TC4: Reconnection sau disconnect
**Steps:**
1. Connect client
2. Stop server hoặc disconnect manually
3. Restart server hoặc reconnect

**Expected:**
- Client tự động reconnect (nếu enable reconnection)
- Receive `connect` event sau khi reconnect
- Tiếp tục nhận events bình thường

---

### TC5: Invalid reservation không emit event
**Steps:**
1. Connect WebSocket client
2. POST reservation với invalid data:
   - User không tồn tại
   - Vehicle không thuộc user
   - Subscription không active
   - Scheduled time trong quá khứ
   - etc.

**Expected:**
- API returns 400 Bad Request
- WebSocket KHÔNG emit event
- Client không nhận notification

---

### TC6: CORS và multiple origins
**Steps:**
1. Connect từ different origins (localhost:3000, localhost:4200, etc.)

**Expected:**
- Tất cả origins đều connect thành công (CORS: `origin: '*'`)

---

## 🔍 Debugging

### Check WebSocket connection trong Network tab:
1. Mở Chrome DevTools
2. Tab "Network" → Filter "WS" (WebSocket)
3. Tìm connection tới `/reservations`
4. Click vào connection để xem:
   - Messages sent/received
   - Connection status
   - Ping/pong frames

### Server logs:
Khi client connect/disconnect, server sẽ log:
```
[ReservationsGateway] Reservation socket connected: <socket_id>
[ReservationsGateway] Reservation socket disconnected: <socket_id>
```

Khi emit event:
```
[ReservationsService] New reservation created with ID <id> for user ID <user_id> at station ID <station_id>
```

---

## 📝 Code Review Checklist

✅ **ReservationsGateway:**
- [x] `@WebSocketGateway` với namespace `/reservations`
- [x] CORS enabled
- [x] Implements `OnGatewayConnection`, `OnGatewayDisconnect`
- [x] `@WebSocketServer()` decorator cho server instance
- [x] `notifyReservationCreated()` method để emit event
- [x] Logging cho connection/disconnection

✅ **ReservationsService:**
- [x] Inject `ReservationsGateway` trong constructor
- [x] Call `reservationsGateway.notifyReservationCreated()` sau khi tạo reservation
- [x] Prepare payload với đầy đủ thông tin (user, vehicle, station, battery)

✅ **ReservationsModule:**
- [x] Add `ReservationsGateway` vào providers array
- [x] Import required modules (BatteriesModule, VehiclesModule, etc.)

✅ **Package.json:**
- [x] Dependencies: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`

---

## 🚀 Next Steps

### Improvements có thể thêm:

1. **Room-based notifications:**
   ```typescript
   // Client join room theo station_id
   socket.join(`station:${station_id}`);
   
   // Emit event chỉ tới staff ở station đó
   this.server.to(`station:${station_id}`).emit('reservation.created', payload);
   ```

2. **Authentication cho WebSocket:**
   ```typescript
   @WebSocketGateway({
     namespace: 'reservations',
     middlewares: [AuthMiddleware] // Custom auth
   })
   ```

3. **Thêm events khác:**
   - `reservation.cancelled` - Khi user hủy reservation
   - `reservation.expired` - Khi reservation hết hạn (auto-cancelled)
   - `reservation.completed` - Khi user đã swap xong

4. **Acknowledge pattern:**
   ```typescript
   socket.emit('reservation.created', payload, (ack) => {
     console.log('Client acknowledged:', ack);
   });
   ```

5. **Error handling:**
   ```typescript
   socket.on('error', (error) => {
     this.logger.error('WebSocket error:', error);
   });
   ```

---

## ❓ Common Issues

### Issue: Cannot connect to WebSocket
**Solution:**
- Check server đang chạy
- Verify URL và namespace đúng
- Check firewall/antivirus không block port
- Try polling transport nếu websocket bị block

### Issue: Events không nhận được
**Solution:**
- Verify client đã connect (check socket.connected)
- Check event name đúng ('reservation.created')
- Verify server emit event (check logs)
- Check CORS settings

### Issue: Multiple events received
**Solution:**
- Check không có duplicate socket connections
- Ensure disconnect old connection before creating new one

---

## 📞 Support

Nếu gặp vấn đề khi test, check:
1. Server logs trong terminal
2. Browser console logs
3. Network tab (WebSocket frames)
4. Postman WebSocket messages

Happy Testing! 🎉
