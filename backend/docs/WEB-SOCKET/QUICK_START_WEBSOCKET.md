# 🚀 Quick Start - Test WebSocket Reservations

## ⚡ Fastest Way to Test (HTML Client)

### 1. Start Backend Server
```bash
cd backend
npm run start:dev
```
Đợi cho đến khi thấy: `Nest application successfully started`

### 2. Mở HTML Test Client
- Mở file: `backend/test-websocket-reservations.html` trong browser
- Hoặc double-click vào file

### 3. Connect WebSocket
- Server URL: `http://localhost:8080` (default)
- Namespace: `/reservations` (default)
- Click button **"Connect to WebSocket"**
- Đợi status hiển thị: ✅ **Connected**

### 4. Lấy JWT Token
**Option A: Sử dụng existing token** (nếu đã login trước đó)
- Copy token từ session trước
- Paste vào field "JWT Token (Bearer)"

**Option B: Login qua Postman/cURL**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "password123"
  }'
```
- Copy `access_token` từ response
- Paste vào field "JWT Token (Bearer)" trong HTML client

**Option C: Sử dụng Postman Collection**
- Import file: `Postman_WebSocket_Reservations_Testing.json`
- Run request: "Login - Get JWT Token"
- Token tự động được lưu vào collection variables

### 5. Tạo Reservation
**Trong HTML Test Client:**
- User ID: `1` (hoặc user_id của bạn)
- Vehicle ID: `1` (vehicle thuộc user đó)
- Station ID: `1` (station tồn tại trong DB)
- Scheduled Time: Tự động set 30 phút từ bây giờ
- Click **"Create Reservation via API"**

### 6. Observe Event
Ngay sau khi tạo reservation thành công, bạn sẽ thấy:
- ✅ Alert: "Reservation created successfully"
- 🔔 Event Log xuất hiện event mới: **`RESERVATION.CREATED`**
- 📊 Statistics counter tăng lên
- 📬 Notification badge xuất hiện góc phải màn hình
- 📋 Latest Event được update với thông tin mới

**Event Payload sẽ có:**
```json
{
  "reservationId": 1,
  "stationId": 1,
  "stationName": "Station A",
  "scheduledTime": "2025-11-19T15:30:00.000Z",
  "batteryId": 5,
  "vehicle": {
    "id": 1,
    "vin": "1HGBH41JXMN109186",
    "batteryModel": "LFP-100",
    "batteryType": "Lithium Iron Phosphate"
  },
  "user": {
    "id": 1,
    "username": "driver123",
    "email": "driver@example.com",
    "phone": "0901234567"
  }
}
```

---

## 🔧 Alternative Methods

### Method 2: Node.js Client

#### Install Socket.IO Client (first time only):
```bash
cd backend
npm install socket.io-client
```

#### Run Test Client:
```bash
node test-ws-client.js
```

Bạn sẽ thấy:
```
╔═══════════════════════════════════════════════════════════╗
║  WebSocket Reservation Test Client (Node.js)              ║
╚═══════════════════════════════════════════════════════════╝

ℹ️  Connecting to: http://localhost:8080/reservations
✅ Connected to WebSocket server
ℹ️  Socket ID: abc123xyz
```

#### Trigger Event:
Từ terminal khác hoặc Postman, tạo reservation:
```bash
curl -X POST http://localhost:8080/api/v1/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "user_id": 1,
    "vehicle_id": 1,
    "station_id": 1,
    "scheduled_time": "2025-11-19T15:30:00.000Z"
  }'
```

Node.js client sẽ log event:
```
============================================================
🔔 NEW RESERVATION CREATED!
============================================================

Reservation Details:
  Reservation ID:  1
  Station:         Station A (ID: 1)
  Scheduled Time:  11/19/2025, 3:30:00 PM
  Battery ID:      5

User Information:
  User ID:         1
  Username:        driver123
  Email:           driver@example.com
  Phone:           0901234567

Vehicle Information:
  Vehicle ID:      1
  VIN:             1HGBH41JXMN109186
  Battery Model:   LFP-100
  Battery Type:    Lithium Iron Phosphate

============================================================
```

---

### Method 3: Postman WebSocket

#### Connect:
1. Mở Postman
2. New → **WebSocket Request**
3. URL: `ws://localhost:8080/reservations`
4. Click **"Connect"**

#### Listen:
Postman tự động listen tất cả events.

#### Trigger:
1. Import collection: `Postman_WebSocket_Reservations_Testing.json`
2. Run: "Login - Get JWT Token" (token tự động save)
3. Run: "Create Reservation (Trigger WebSocket Event)"
4. Switch về WebSocket tab
5. Xem message mới với event `reservation.created`

---

### Method 4: Browser Console

#### Mở DevTools Console (F12) và paste:
```javascript
const socket = io('http://localhost:8080/reservations');

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('reservation.created', (data) => {
  console.log('🔔 New Reservation Created!');
  console.table({
    'Reservation ID': data.reservationId,
    'Station': data.stationName,
    'User': data.user.username,
    'Time': new Date(data.scheduledTime).toLocaleString()
  });
  console.log('Full data:', data);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});
```

Sau đó tạo reservation qua Postman/API để trigger event.

---

## ✅ Verification Checklist

Test thành công khi:

- [ ] WebSocket client connect thành công (status "Connected")
- [ ] POST `/api/v1/reservations` returns 201 Created
- [ ] WebSocket event `reservation.created` được emit
- [ ] Event payload chứa đầy đủ thông tin:
  - [ ] reservationId
  - [ ] stationId + stationName
  - [ ] scheduledTime
  - [ ] batteryId
  - [ ] vehicle (id, vin, batteryModel, batteryType)
  - [ ] user (id, username, email, phone)
- [ ] Multiple clients (nếu có) đều nhận được event

---

## 🐛 Troubleshooting

### Issue: Cannot connect to WebSocket
**Check:**
- Server đang chạy? `npm run start:dev`
- URL đúng? `http://localhost:8080/reservations`
- Port 8080 có bị block không?

**Solution:**
```bash
# Restart server
npm run start:dev

# Check server logs
# Should see: "Nest application successfully started on port 8080"
```

---

### Issue: Event không nhận được
**Check:**
- WebSocket đã connected? (check status)
- API call thành công? (status 201)
- Event name đúng? `reservation.created`

**Debug:**
```javascript
// Trong browser console
socket.onAny((eventName, ...args) => {
  console.log('Event:', eventName, args);
});
```

---

### Issue: API returns 400 Bad Request
**Common causes:**
- JWT token expired/invalid
- User không tồn tại
- Vehicle không thuộc user
- Subscription không active
- Scheduled time trong quá khứ
- Scheduled time > 60 phút

**Check:**
```bash
# Get user vehicles
curl http://localhost:8080/api/v1/vehicles/user/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check subscription status
curl http://localhost:8080/api/v1/subscriptions/vehicle/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Expected Server Logs

Khi test thành công, server logs sẽ hiển thị:

```
[ReservationsGateway] Reservation socket connected: abc123xyz
[ReservationsService] New reservation created with ID 1 for user ID 1 at station ID 1
```

---

## 🎯 Next Steps

Sau khi test thành công:

1. **Test multiple clients:**
   - Mở 2-3 browser tabs với HTML client
   - Tạo reservation từ 1 tab
   - Verify tất cả tabs đều nhận event

2. **Test disconnect/reconnect:**
   - Disconnect client
   - Tạo reservation (không nhận event)
   - Reconnect client
   - Tạo reservation mới (nhận event)

3. **Test error cases:**
   - Tạo reservation với invalid data
   - Verify không có event được emit

4. **Integration với Frontend:**
   - Connect frontend app tới WebSocket
   - Display real-time notifications cho station staff
   - Update reservation list realtime

---

## 📞 Need Help?

- Check `WEBSOCKET_TESTING_GUIDE.md` để có hướng dẫn chi tiết
- Review code trong:
  - `src/modules/reservations/reservations.gateway.ts`
  - `src/modules/reservations/reservations.service.ts`
- Check server logs cho error messages

Happy Testing! 🎉
