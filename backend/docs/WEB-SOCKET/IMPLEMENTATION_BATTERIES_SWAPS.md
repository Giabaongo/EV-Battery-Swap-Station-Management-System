# WebSocket Implementation - Batteries & Swap Transactions

## ✅ Đã Implement

Tôi đã implement **2 WebSocket features** theo use cases đã định nghĩa:

### 🔋 1. Battery Status Updates
- **Gateway**: `BatteriesGateway` (`/batteries` namespace)
- **Events**:
  - `battery.status.changed` - Khi trạng thái pin thay đổi
  - `battery.charge.updated` - Khi mức sạc pin thay đổi

### 🔄 2. Swap Transactions Real-time Updates  
- **Gateway**: `SwapTransactionsGateway` (`/swap-transactions` namespace)
- **Events**:
  - `swap.created` - Khi có giao dịch đổi pin mới
  - `swap.status.updated` - Khi trạng thái giao dịch thay đổi

---

## 📁 Files Created/Modified

### New Files Created:
1. `src/modules/batteries/batteries.gateway.ts` ✨ NEW
2. `src/modules/swap-transactions/swap-transactions.gateway.ts` ✨ NEW
3. `test/test-websocket-batteries-swaps.html` ✨ NEW (Test client)

### Modified Files:
1. `src/modules/batteries/batteries.module.ts` - Added BatteriesGateway to providers
2. `src/modules/batteries/batteries.service.ts` - Inject gateway & emit events
3. `src/modules/swap-transactions/swap-transactions.module.ts` - Added SwapTransactionsGateway
4. `src/modules/swap-transactions/swap-transactions.service.ts` - Inject gateway & emit events
5. `src/modules/swapping/swapping.service.ts` - Emit events when swap created

---

## 🔥 WebSocket Events Details

### Battery Events

#### Event: `battery.status.changed`
**Khi nào trigger:**
- Pin được assign vào xe (available → in_use)
- Pin được return về trạm (in_use → charging)
- Pin sạc đầy (charging → full)
- Pin được book (available/full → booked)
- Pin bị lỗi (any → defective)
- Admin update status manually

**Payload:**
```typescript
{
  batteryId: number;              // 15
  stationId: number;              // 1
  stationName: string;            // "Station A - Downtown"
  previousStatus: BatteryStatus;  // "charging"
  currentStatus: BatteryStatus;   // "full"
  currentCharge: number;          // 100
  timestamp: string;              // "2025-11-20T10:30:00.000Z"
  changedBy?: {                   // Optional (if available)
    userId: number;
    username: string;
    role: string;
  }
}
```

**Example:**
```json
{
  "batteryId": 15,
  "stationId": 1,
  "stationName": "Station A - Downtown",
  "previousStatus": "charging",
  "currentStatus": "full",
  "currentCharge": 100,
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

---

#### Event: `battery.charge.updated`
**Khi nào trigger:**
- Admin set battery charge manually (`setBatteryCharge`)
- Battery charge thay đổi tự động

**Payload:**
```typescript
{
  batteryId: number;       // 15
  stationId: number;       // 1
  previousCharge: number;  // 75
  currentCharge: number;   // 100
  chargeChange: number;    // +25
  status: BatteryStatus;   // "full"
  timestamp: string;       // "2025-11-20T10:30:00.000Z"
}
```

**Example:**
```json
{
  "batteryId": 15,
  "stationId": 1,
  "previousCharge": 75,
  "currentCharge": 100,
  "chargeChange": 25,
  "status": "full",
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

---

### Swap Transaction Events

#### Event: `swap.created`
**Khi nào trigger:**
- User swap pin thành công (`swapBatteries`)
- User initialize battery lần đầu (`initializeBattery`)
- Staff tạo manual swap transaction

**Payload:**
```typescript
{
  transactionId: number;
  stationId: number;
  stationName: string;
  user: {
    userId: number;
    username: string;
    email: string;
  };
  vehicle: {
    vehicleId: number;
    vin: string;
    batteryModel: string;
  };
  batteryTaken: {
    batteryId: number;
    charge: number;
  };
  batteryReturned?: {      // Optional - không có khi first swap
    batteryId: number;
    charge: number;
  };
  status: SwapTransactionStatus;  // "completed"
  timestamp: string;
  distanceTraveled?: number;      // km
  batteryUsedPercent?: number;    // %
}
```

**Example (Regular Swap):**
```json
{
  "transactionId": 42,
  "stationId": 1,
  "stationName": "Station A - Downtown",
  "user": {
    "userId": 5,
    "username": "john_doe",
    "email": "john@example.com"
  },
  "vehicle": {
    "vehicleId": 9,
    "vin": "1HGBH41JXMN109186",
    "batteryModel": "LFP-100"
  },
  "batteryTaken": {
    "batteryId": 15,
    "charge": 100
  },
  "batteryReturned": {
    "batteryId": 8,
    "charge": 45
  },
  "status": "completed",
  "timestamp": "2025-11-20T10:30:00.000Z",
  "distanceTraveled": 275,
  "batteryUsedPercent": 55
}
```

**Example (First Swap - Initialize):**
```json
{
  "transactionId": 1,
  "stationId": 1,
  "stationName": "Station A - Downtown",
  "user": {
    "userId": 5,
    "username": "john_doe",
    "email": "john@example.com"
  },
  "vehicle": {
    "vehicleId": 9,
    "vin": "1HGBH41JXMN109186",
    "batteryModel": "LFP-100"
  },
  "batteryTaken": {
    "batteryId": 15,
    "charge": 100
  },
  "status": "completed",
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

---

#### Event: `swap.status.updated`
**Khi nào trigger:**
- Admin update swap transaction status
- System auto-update (timeout, error handling)

**Payload:**
```typescript
{
  transactionId: number;
  previousStatus: SwapTransactionStatus;  // "completed"
  currentStatus: SwapTransactionStatus;   // "failed"
  updatedBy?: {
    userId: number;
    username: string;
    role: string;
  };
  reason?: string;
  timestamp: string;
}
```

**Example:**
```json
{
  "transactionId": 42,
  "previousStatus": "completed",
  "currentStatus": "failed",
  "updatedBy": {
    "userId": 1,
    "username": "admin",
    "role": "admin"
  },
  "reason": "Battery defective after swap",
  "timestamp": "2025-11-20T10:35:00.000Z"
}
```

---

## 🧪 Testing

### 1. Open Test Client

Mở file HTML test client trong browser:
```
backend/test/test-websocket-batteries-swaps.html
```

### 2. Connect to WebSocket Servers

Click **"Connect"** button cho mỗi namespace:
- Battery Status (namespace: `/batteries`)
- Swap Transactions (namespace: `/swap-transactions`)

### 3. Trigger Events

#### Test Battery Status Change:
```bash
# Method 1: Via API (Postman/cURL)
PATCH http://localhost:8080/api/v1/batteries/15/status
{
  "status": "full"
}

# Method 2: Via Swagger
http://localhost:8080/api/docs
```

#### Test Battery Charge Update:
```bash
# Via API
PATCH http://localhost:8080/api/v1/batteries/15/charge
{
  "charge": 100
}
```

#### Test Swap Transaction Created:
```bash
# Method 1: Create swap via automatic endpoint
POST http://localhost:8080/api/v1/swapping
{
  "user_id": 5,
  "vehicle_id": 9,
  "station_id": 1
}

# Method 2: Manual swap transaction
POST http://localhost:8080/api/v1/swap-transactions
{
  "user_id": 5,
  "vehicle_id": 9,
  "station_id": 1,
  "battery_taken_id": 15,
  "battery_returned_id": 8,
  "subscription_id": 3
}
```

#### Test Swap Status Update:
```bash
PATCH http://localhost:8080/api/v1/swap-transactions/42
{
  "status": "failed"
}
```

### 4. Observe Real-time Events

Bạn sẽ thấy events xuất hiện real-time trong test client:
- ✅ Connection status
- 🔋 Battery status changes
- ⚡ Battery charge updates
- 🔄 Swap transactions created
- 📝 Swap status updates
- 📊 Statistics counter

---

## 🎯 Integration Points

### Where Events Are Emitted:

#### Battery Events:
1. **`batteries.service.ts`**:
   - `updateBatteryStatus()` - Line ~270
   - `setBatteryCharge()` - Line ~420

#### Swap Transaction Events:
1. **`swapping.service.ts`**:
   - `swapBatteries()` - Line ~135 (after swap created)
   - `initializeBattery()` - Line ~210 (first swap)

2. **`swap-transactions.service.ts`**:
   - `updateStatus()` - Line ~185 (status update)

---

## 🔧 Backend Code Examples

### Listen to Battery Events (Frontend):
```typescript
import { io } from 'socket.io-client';

const batterySocket = io('http://localhost:8080/batteries');

// Battery status changed
batterySocket.on('battery.status.changed', (data) => {
  console.log('Battery status changed:', data);
  // Update UI: show notification, update battery list
  updateBatteryStatus(data.batteryId, data.currentStatus);
});

// Battery charge updated
batterySocket.on('battery.charge.updated', (data) => {
  console.log('Battery charge updated:', data);
  // Update UI: update progress bar
  updateBatteryCharge(data.batteryId, data.currentCharge);
});
```

### Listen to Swap Transaction Events (Frontend):
```typescript
const swapSocket = io('http://localhost:8080/swap-transactions');

// New swap transaction
swapSocket.on('swap.created', (data) => {
  console.log('New swap transaction:', data);
  // Update UI: add to transaction list, show notification
  addSwapTransaction(data);
  showNotification(`New swap at ${data.stationName}`);
});

// Swap status updated
swapSocket.on('swap.status.updated', (data) => {
  console.log('Swap status updated:', data);
  // Update UI: update transaction status
  updateSwapStatus(data.transactionId, data.currentStatus);
});
```

---

## 📊 Use Cases

### 1. Battery Monitoring Dashboard
**Admin/Staff View:**
- Real-time battery status grid
- Color-coded by status (green=full, yellow=charging, red=defective)
- Live charge progress bars
- Alert when battery full/defective

### 2. Station Dashboard
**Staff View:**
- See incoming swap transactions real-time
- Prepare batteries before customer arrives
- Monitor battery inventory (available/charging/in-use)
- Alert when running low on available batteries

### 3. User Mobile App
**Customer View:**
- See battery charge % after swap
- Transaction confirmation notification
- Real-time swap status updates
- Distance traveled calculation

### 4. Analytics Dashboard
**Admin View:**
- Live swap transaction counter
- Peak hours visualization
- Battery utilization rate
- Revenue tracking (real-time)

---

## 🚀 Next Steps

### Recommended Enhancements:

1. **Room-based Broadcasting**:
   ```typescript
   // Only notify specific station
   this.batteriesGateway.notifyStation(stationId, 'battery.status.changed', data);
   
   // Only notify specific user
   this.swapGateway.notifyUser(userId, 'swap.created', data);
   ```

2. **Authentication** (Optional):
   ```typescript
   // Add JWT validation to WebSocket
   @UseGuards(WsJwtGuard)
   handleConnection(client: Socket) {
     const user = client.handshake.auth.user;
     // Join user-specific room
     client.join(`user-${user.userId}`);
   }
   ```

3. **Historical Data Playback**:
   - Emit last 10 events when client connects
   - Useful for syncing state

4. **Performance Optimization**:
   - Debounce high-frequency events (battery charge updates)
   - Compress payloads for mobile clients

---

## ✅ Testing Checklist

- [ ] Battery status change emits event
- [ ] Battery charge update emits event
- [ ] Swap transaction created emits event
- [ ] Swap status update emits event
- [ ] Multiple clients receive same event
- [ ] Reconnection works after disconnect
- [ ] Events include all required fields
- [ ] Desktop notifications work (if permission granted)
- [ ] Statistics counter updates correctly
- [ ] No memory leaks on connect/disconnect

---

## 📚 Related Documentation

- [WebSocket Use Cases](./WEBSOCKET_USE_CASES.md) - All possible use cases
- [Frontend Integration Guide](./FRONTEND_WEBSOCKET_INTEGRATION.md) - React/Vue/Angular examples
- [WebSocket Testing Guide](./WEBSOCKET_TESTING_GUIDE.md) - Comprehensive testing guide

---

**Status:** ✅ **Fully Implemented & Ready for Testing**

**Last Updated:** November 20, 2025

**Implemented By:** AI Assistant

**Features Completed:**
- ✅ Battery Status Updates
- ✅ Swap Transactions Real-time Updates
- ✅ Test Client (HTML)
- ✅ Documentation

**Next Priority:** Station Availability Updates (see WEBSOCKET_USE_CASES.md)
