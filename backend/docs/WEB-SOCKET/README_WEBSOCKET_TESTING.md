# 📦 WebSocket Reservations - Testing Package

## 🎯 Tổng quan

Package này chứa tất cả tools và documentation cần thiết để test WebSocket implementation cho module Reservations.

---

## 📁 Files Included

### 1. **test-websocket-reservations.html**
- **Mô tả:** Interactive HTML test client với UI đẹp
- **Sử dụng:** Mở trong browser, không cần install gì
- **Tính năng:**
  - ✅ Connect/disconnect WebSocket
  - ✅ Tạo reservation qua API call
  - ✅ Real-time event logging
  - ✅ Statistics tracking
  - ✅ Desktop notifications
  - ✅ Beautiful UI with animations

### 2. **test-ws-client.js**
- **Mô tả:** Node.js CLI test client
- **Sử dụng:** `node test-ws-client.js`
- **Yêu cầu:** `npm install socket.io-client`
- **Tính năng:**
  - ✅ Auto-reconnect
  - ✅ Colored console output
  - ✅ Detailed event logging
  - ✅ Connection status monitoring

### 3. **Postman_WebSocket_Reservations_Testing.json**
- **Mô tả:** Postman collection với pre-configured requests
- **Import:** Postman → Import → Select file
- **Includes:**
  - Login API (auto-save token)
  - Create reservation API
  - Get reservations by user/station
  - Cancel reservation API
  - Supporting APIs (get vehicles, stations)

### 4. **WEBSOCKET_TESTING_GUIDE.md**
- **Mô tả:** Comprehensive testing guide
- **Nội dung:**
  - 4 phương pháp test khác nhau
  - Detailed test cases (6 scenarios)
  - Troubleshooting guide
  - Code review checklist
  - Improvement suggestions

### 5. **QUICK_START_WEBSOCKET.md**
- **Mô tả:** Quick start guide để test nhanh
- **Nội dung:**
  - Step-by-step instructions
  - Multiple testing methods
  - Verification checklist
  - Common issues & solutions

---

## 🚀 Recommended Testing Flow

### Beginner Level (5 minutes)
1. Start server: `npm run start:dev`
2. Open `test-websocket-reservations.html` in browser
3. Click "Connect to WebSocket"
4. Get JWT token (login via Postman/cURL)
5. Fill form and click "Create Reservation via API"
6. See event in Event Log ✅

### Intermediate Level (10 minutes)
1. Install: `npm install socket.io-client`
2. Run: `node test-ws-client.js`
3. Use Postman to trigger API calls
4. Observe events in terminal
5. Test multiple scenarios

### Advanced Level (20 minutes)
1. Import Postman collection
2. Use Postman WebSocket feature
3. Run all test cases from WEBSOCKET_TESTING_GUIDE.md
4. Test edge cases (invalid data, expired tokens, etc.)
5. Test multiple concurrent clients

---

## 📋 WebSocket Implementation Summary

### Gateway Configuration
```typescript
@WebSocketGateway({
  namespace: 'reservations',
  cors: { origin: '*', credentials: true }
})
export class ReservationsGateway {
  @WebSocketServer()
  private server: Server;
  
  notifyReservationCreated(payload: ReservationCreatedEvent) {
    this.server.emit('reservation.created', payload);
  }
}
```

### Service Integration
```typescript
@Injectable()
export class ReservationsService {
  constructor(
    private reservationsGateway: ReservationsGateway
  ) {}
  
  async create(dto: CreateReservationDto) {
    // ... create reservation logic
    
    const payload: ReservationCreatedEvent = {
      reservationId,
      stationId,
      stationName,
      scheduledTime,
      batteryId,
      vehicle: { ... },
      user: { ... }
    };
    
    this.reservationsGateway.notifyReservationCreated(payload);
  }
}
```

### Module Setup
```typescript
@Module({
  imports: [/* dependencies */],
  providers: [ReservationsService, ReservationsGateway],
  exports: [ReservationsService]
})
export class ReservationsModule {}
```

---

## 🔧 Technical Specifications

### WebSocket Endpoint
- **URL:** `http://localhost:8080/reservations`
- **Protocol:** Socket.IO (WebSocket + polling fallback)
- **Namespace:** `/reservations`
- **CORS:** Enabled for all origins

### Events

#### `reservation.created`
**Trigger:** Khi có reservation mới được tạo thành công

**Payload:**
```typescript
{
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
```

**Broadcasted to:** All connected clients

---

## ✅ Test Scenarios

### ✔️ Scenario 1: Basic Connection
- Connect client
- Verify connection status
- Check socket ID assigned

### ✔️ Scenario 2: Event Emission
- Create reservation via API
- Verify event received
- Validate payload structure

### ✔️ Scenario 3: Multiple Clients
- Connect 2+ clients
- Trigger event
- Verify all clients receive event

### ✔️ Scenario 4: Reconnection
- Connect → Disconnect → Reconnect
- Verify auto-reconnect works
- Events still received after reconnect

### ✔️ Scenario 5: Error Handling
- Invalid reservation data
- Verify no event emitted
- API returns proper error

### ✔️ Scenario 6: Authorization
- Test with/without JWT token
- Verify API authorization
- WebSocket connection doesn't require auth

---

## 📊 Expected Behaviors

### Successful Reservation Creation
1. ✅ API returns 201 Created
2. ✅ Reservation saved to database
3. ✅ Battery status updated to 'booked'
4. ✅ WebSocket event emitted
5. ✅ All connected clients receive event
6. ✅ Server logs show reservation created

### Failed Reservation Creation
1. ❌ API returns 400 Bad Request
2. ❌ No database changes
3. ❌ Battery status unchanged
4. ❌ NO WebSocket event emitted
5. ❌ Clients don't receive notification
6. ⚠️ Server logs show error reason

---

## 🐛 Common Issues & Solutions

### Issue: WebSocket won't connect
**Solutions:**
- Ensure server is running
- Check URL and namespace are correct
- Verify port 8080 is not blocked
- Try polling transport: `{ transports: ['polling'] }`

### Issue: Events not received
**Solutions:**
- Confirm client is connected
- Verify event name: `reservation.created`
- Check API call succeeded (201 status)
- Review server logs for errors

### Issue: CORS errors
**Solutions:**
- Already configured: `cors: { origin: '*' }`
- If still issues, check server CORS settings
- Ensure request headers are correct

---

## 🎓 Learning Resources

### Socket.IO Documentation
- Client API: https://socket.io/docs/v4/client-api/
- Server API: https://socket.io/docs/v4/server-api/
- Namespaces: https://socket.io/docs/v4/namespaces/

### NestJS WebSocket
- Gateway: https://docs.nestjs.com/websockets/gateways
- Adapters: https://docs.nestjs.com/websockets/adapter

---

## 🔮 Future Enhancements

### Potential Improvements

1. **Room-based Notifications**
   ```typescript
   // Staff join room by station
   socket.join(`station:${stationId}`);
   
   // Emit only to that station
   this.server.to(`station:${stationId}`).emit('reservation.created', payload);
   ```

2. **Authentication for WebSocket**
   ```typescript
   // Middleware to verify JWT on connection
   @WebSocketGateway({
     namespace: 'reservations',
     middlewares: [AuthMiddleware]
   })
   ```

3. **Additional Events**
   - `reservation.cancelled` - When user cancels
   - `reservation.expired` - Auto-cancelled by cron job
   - `reservation.completed` - After successful swap
   - `reservation.updated` - Schedule time changed

4. **Acknowledgements**
   ```typescript
   socket.emit('reservation.created', payload, (ack) => {
     console.log('Client acknowledged:', ack);
   });
   ```

5. **Typing Indicators**
   ```typescript
   socket.emit('user.typing', { userId, isTyping: true });
   ```

6. **Online Status**
   ```typescript
   socket.emit('staff.online', { stationId, staffCount });
   ```

---

## 📝 Testing Checklist

Before marking as complete, verify:

- [ ] Server starts without errors
- [ ] WebSocket gateway initializes
- [ ] Clients can connect successfully
- [ ] Events emit on reservation creation
- [ ] Event payload matches expected structure
- [ ] Multiple clients receive events
- [ ] Reconnection works properly
- [ ] Error cases don't emit events
- [ ] Server logs show connection/disconnection
- [ ] No memory leaks on repeated connections
- [ ] CORS works from different origins
- [ ] Performance acceptable (< 100ms event delivery)

---

## 📞 Support

### If you encounter issues:

1. **Check server logs:**
   ```
   [ReservationsGateway] Reservation socket connected: xyz
   [ReservationsService] New reservation created with ID 1
   ```

2. **Check browser console:**
   - Connection status
   - Error messages
   - Event data

3. **Check Network tab:**
   - WebSocket connection (WS filter)
   - Messages sent/received
   - Connection frames

4. **Review implementation:**
   - `src/modules/reservations/reservations.gateway.ts`
   - `src/modules/reservations/reservations.service.ts`
   - `src/modules/reservations/reservations.module.ts`

---

## 🎉 Success Criteria

**Test is successful when:**

1. ✅ WebSocket client connects to `/reservations` namespace
2. ✅ Creating reservation via API triggers `reservation.created` event
3. ✅ Event payload contains complete reservation data
4. ✅ All connected clients receive the event in real-time
5. ✅ Event Log shows proper formatting and data
6. ✅ No errors in server logs or browser console

**You're ready to integrate with frontend! 🚀**

---

## 📅 Version History

- **v1.0.0** (Nov 19, 2025) - Initial WebSocket implementation
  - Basic reservation.created event
  - Gateway with CORS support
  - Service integration
  - Testing tools and documentation

---

**Happy Testing! 🎊**

For detailed guides, see:
- `QUICK_START_WEBSOCKET.md` - Fast testing guide
- `WEBSOCKET_TESTING_GUIDE.md` - Comprehensive guide
- `STATION_QUERY_APIS_TEST_CASES.md` - Station APIs testing

For questions or improvements, contact your backend team! 👨‍💻👩‍💻
