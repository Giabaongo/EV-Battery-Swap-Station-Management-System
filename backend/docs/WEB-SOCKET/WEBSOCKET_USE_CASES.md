# WebSocket Use Cases - EV Battery Swap Station Management System

## 📊 Tổng quan

Document này liệt kê chi tiết **các chức năng có thể áp dụng công nghệ WebSocket** trong hệ thống quản lý trạm đổi pin xe điện. Dựa trên kiến trúc hiện tại với các modules: Reservations, Swap Transactions, Batteries, Stations, Supports, Payments, và Users.

---

## 🎯 Các Use Cases Đã Implement

### ✅ 1. Real-time Reservation Notifications

**Status:** ✅ **ĐÃ IMPLEMENT**

**Mô tả:** Thông báo real-time khi có reservation mới được tạo

**Gateway:** `ReservationsGateway` (`/reservations` namespace)

**Event:** `reservation.created`

**Payload:**
```typescript
{
  reservationId: number;
  stationId: number;
  stationName: string;
  scheduledTime: string;
  batteryId: number;
  vehicle: { id, vin, batteryModel, batteryType };
  user: { id, username, email, phone };
}
```

**Use Case:**
- 👤 **User** đặt lịch swap pin qua app
- 📡 **WebSocket** broadcast event `reservation.created` 
- 🏢 **Station Staff** nhận notification real-time
- 📊 **Admin Dashboard** cập nhật số liệu real-time

**Benefits:**
- Staff biết ngay có khách đặt lịch
- Chuẩn bị pin trước giờ khách đến
- Giảm thời gian chờ đợi

---

## 🚀 Các Use Cases Nên Implement

### 🔋 2. Battery Status Real-time Updates

**Priority:** 🔴 **HIGH** - Tác động trực tiếp đến operations

**Mô tả:** Thông báo real-time khi trạng thái pin thay đổi

**Proposed Gateway:** `BatteriesGateway` (`/batteries` namespace)

**Events:**

#### Event 2.1: `battery.status.changed`
```typescript
{
  batteryId: number;
  stationId: number;
  stationName: string;
  previousStatus: BatteryStatus; // 'available', 'charging', 'in_use', 'full', 'booked', 'defective', 'maintenance'
  currentStatus: BatteryStatus;
  currentCharge: number; // 0-100%
  timestamp: string;
  changedBy?: {
    userId: number;
    username: string;
    role: string;
  };
}
```

**Khi nào trigger:**
- Pin được gắn vào xe (available → in_use)
- Pin được trả về trạm (in_use → charging)
- Pin sạc đầy (charging → full)
- Pin được đặt trước (available/full → booked)
- Pin bị lỗi (any → defective)
- Pin bảo trì (any → maintenance)

**Use Cases:**
- 📊 **Real-time Dashboard**: Admin/Staff xem trạng thái pin real-time
- 🔌 **Charging Monitor**: Hiển thị tiến trình sạc của từng pin
- ⚠️ **Alert System**: Cảnh báo khi pin defective/low charge
- 📈 **Analytics**: Theo dõi số lượng pin available/charging/in_use

#### Event 2.2: `battery.charge.updated`
```typescript
{
  batteryId: number;
  stationId: number;
  previousCharge: number;
  currentCharge: number;
  chargeChange: number; // +/- value
  chargingRate?: number; // %/hour
  estimatedFullTime?: string; // ISO timestamp
  status: BatteryStatus;
}
```

**Khi nào trigger:**
- Pin đang sạc (cập nhật mỗi 5-10 phút)
- Admin set charge manually

**Use Cases:**
- 📊 **Live Charging Monitor**: Hiển thị % sạc real-time
- ⏱️ **Time Estimation**: Dự đoán khi nào pin sạc đầy
- 📈 **Charging Analytics**: Phân tích tốc độ sạc

**Implementation Points:**
```typescript
// In batteries.service.ts
async updateBatteryStatus(batteryId: number, newStatus: BatteryStatus) {
  const battery = await this.update(batteryId, { status: newStatus });
  
  // Emit WebSocket event
  this.batteriesGateway.notifyBatteryStatusChanged({
    batteryId: battery.battery_id,
    stationId: battery.station_id,
    stationName: battery.station?.name,
    previousStatus: oldStatus,
    currentStatus: newStatus,
    currentCharge: battery.current_charge,
    timestamp: new Date().toISOString(),
  });
  
  return battery;
}

async setBatteryCharge(batteryId: number, charge: number) {
  const battery = await this.update(batteryId, { current_charge: charge });
  
  // Emit charge update event
  this.batteriesGateway.notifyBatteryChargeUpdated({
    batteryId,
    stationId: battery.station_id,
    previousCharge: oldCharge,
    currentCharge: charge,
    chargeChange: charge - oldCharge,
    status: battery.status,
  });
  
  return battery;
}
```

---

### 🔄 3. Swap Transaction Real-time Updates

**Priority:** 🔴 **HIGH** - Core business operation

**Mô tả:** Thông báo real-time về giao dịch đổi pin

**Proposed Gateway:** `SwapTransactionsGateway` (`/swap-transactions` namespace)

**Events:**

#### Event 3.1: `swap.created`
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
  batteryReturned?: {
    batteryId: number;
    charge: number;
  };
  status: SwapTransactionStatus; // 'completed', 'failed', 'cancelled'
  timestamp: string;
  distanceTraveled?: number;
  batteryUsedPercent?: number;
}
```

**Khi nào trigger:**
- User swap pin thành công
- Staff thực hiện swap transaction

**Use Cases:**
- 📊 **Live Transaction Monitor**: Admin xem giao dịch real-time
- 🏪 **Station Dashboard**: Staff theo dõi số lượng swap trong ngày
- 📈 **Revenue Tracking**: Cập nhật doanh thu real-time
- 🎯 **Performance Metrics**: Transactions per hour/day

#### Event 3.2: `swap.status.updated`
```typescript
{
  transactionId: number;
  previousStatus: SwapTransactionStatus;
  currentStatus: SwapTransactionStatus;
  updatedBy: {
    userId: number;
    username: string;
    role: string;
  };
  reason?: string; // If failed/cancelled
  timestamp: string;
}
```

**Khi nào trigger:**
- Admin update transaction status
- System auto-update status (timeout, error)

**Use Cases:**
- 🔍 **Dispute Resolution**: Admin xử lý tranh chấp
- ❌ **Failed Transaction Handling**: Xử lý giao dịch lỗi
- 📝 **Audit Trail**: Lưu vết thay đổi

**Implementation Points:**
```typescript
// In swapping.service.ts
async swapBatteries(swapDto: SwappingDto) {
  const result = await this.$transaction(async (prisma) => {
    // ... existing swap logic ...
    const swapRecord = await this.swapTransactionsService.create({...}, prisma);
    
    // Emit WebSocket event
    this.swapGateway.notifySwapCreated({
      transactionId: swapRecord.transaction_id,
      stationId: station_id,
      stationName: station.name,
      user: { userId: user_id, username: user.username, email: user.email },
      vehicle: { vehicleId: vehicle_id, vin: vehicle.vin, batteryModel: vehicle.batteryModel },
      batteryTaken: { batteryId: taken_battery_id, charge: takenBattery.current_charge },
      batteryReturned: { batteryId: return_battery_id, charge: returnBattery.current_charge },
      status: SwapTransactionStatus.completed,
      timestamp: new Date().toISOString(),
      distanceTraveled,
      batteryUsedPercent,
    });
    
    return result;
  });
}
```

---

### 🏢 4. Station Status Real-time Updates

**Priority:** 🟡 **MEDIUM** - Improves user experience

**Mô tả:** Thông báo real-time về trạng thái trạm và pin khả dụng

**Proposed Gateway:** `StationsGateway` (`/stations` namespace)

**Events:**

#### Event 4.1: `station.availability.changed`
```typescript
{
  stationId: number;
  stationName: string;
  location: string;
  totalBatteries: number;
  availableBatteries: number;
  chargingBatteries: number;
  fullBatteries: number;
  bookedBatteries: number;
  defectiveBatteries: number;
  timestamp: string;
  batteryTypes: {
    [batteryModel: string]: {
      available: number;
      total: number;
    };
  };
}
```

**Khi nào trigger:**
- Pin được swap (available count changes)
- Pin sạc đầy (charging → full)
- Pin được đặt trước (available → booked)
- Pin bị lỗi (available → defective)

**Use Cases:**
- 🗺️ **Station Finder Map**: User xem trạm nào có pin available
- 📊 **Station Dashboard**: Staff monitor station capacity
- 🚨 **Low Stock Alert**: Cảnh báo khi pin sắp hết
- 📈 **Capacity Planning**: Dự đoán nhu cầu pin

#### Event 4.2: `station.status.changed`
```typescript
{
  stationId: number;
  stationName: string;
  previousStatus: 'active' | 'inactive' | 'maintenance';
  currentStatus: 'active' | 'inactive' | 'maintenance';
  reason?: string;
  estimatedResumeTime?: string;
  timestamp: string;
}
```

**Khi nào trigger:**
- Admin đóng/mở trạm
- Trạm bảo trì
- Trạm gặp sự cố

**Use Cases:**
- 🚫 **Service Interruption Notice**: Thông báo user trạm đóng cửa
- 🗺️ **Map Filter**: Ẩn trạm inactive trên map
- 📊 **Uptime Tracking**: Theo dõi thời gian hoạt động

**Implementation Points:**
```typescript
// In stations.service.ts
async updateStationAvailability(stationId: number) {
  const batteries = await this.batteriesService.findByStation(stationId);
  
  const availability = {
    totalBatteries: batteries.length,
    availableBatteries: batteries.filter(b => b.status === 'available').length,
    chargingBatteries: batteries.filter(b => b.status === 'charging').length,
    fullBatteries: batteries.filter(b => b.status === 'full').length,
    bookedBatteries: batteries.filter(b => b.status === 'booked').length,
    defectiveBatteries: batteries.filter(b => b.status === 'defective').length,
  };
  
  this.stationsGateway.notifyStationAvailabilityChanged({
    stationId,
    stationName: station.name,
    location: station.location,
    ...availability,
    timestamp: new Date().toISOString(),
  });
}
```

---

### 🎫 5. Support Ticket Real-time Updates

**Priority:** 🟢 **LOW-MEDIUM** - Improves customer service

**Mô tả:** Thông báo real-time về yêu cầu hỗ trợ

**Proposed Gateway:** `SupportsGateway` (`/supports` namespace)

**Current Implementation:** ⚠️ **PARTIALLY IMPLEMENTED** (có WebsocketService nhưng chưa có dedicated gateway)

**Events:**

#### Event 5.1: `support.created` ✅ (Đã có trong code)
```typescript
{
  supportId: number;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  stationId?: number;
  stationName?: string;
  category: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: SupportStatus; // 'pending', 'in_progress', 'resolved', 'closed'
  createdAt: string;
}
```

**Hiện tại:** Code đã có `this.websocketService.notifyAdminsNewSupportTicket(support);`

**Nên cải thiện:**
- Tạo dedicated `SupportsGateway` thay vì dùng generic WebsocketService
- Thêm room-based messaging (only admins receive)
- Thêm notification sound/badge

#### Event 5.2: `support.status.updated`
```typescript
{
  supportId: number;
  previousStatus: SupportStatus;
  currentStatus: SupportStatus;
  assignedTo?: {
    userId: number;
    username: string;
  };
  resolution?: string;
  updatedBy: {
    userId: number;
    username: string;
    role: string;
  };
  timestamp: string;
}
```

**Khi nào trigger:**
- Admin assign ticket
- Admin update status
- Admin resolve/close ticket

**Use Cases:**
- 👤 **User Notifications**: User nhận update về ticket của mình
- 👨‍💼 **Admin Queue**: Admin xem ticket mới real-time
- 📊 **Support Analytics**: Theo dõi response time
- 🔔 **Priority Alerts**: Cảnh báo ticket urgent

#### Event 5.3: `support.message.added`
```typescript
{
  supportId: number;
  messageId: number;
  senderId: number;
  senderName: string;
  senderRole: 'user' | 'admin' | 'staff';
  message: string;
  attachments?: string[];
  timestamp: string;
}
```

**Use Cases:**
- 💬 **Live Chat**: User và admin chat real-time
- 📎 **File Sharing**: Upload/download file trong conversation
- 🔔 **New Message Alert**: Thông báo tin nhắn mới

**Implementation Points:**
```typescript
// In supports.service.ts - CẢI THIỆN EXISTING CODE
async create(createSupportDto: CreateSupportDto) {
  const support = await this.prisma.support.create({...});
  
  // THAY ĐỔI: Dùng dedicated gateway thay vì generic service
  this.supportsGateway.notifySupportCreated({
    supportId: support.support_id,
    userId: support.user_id,
    userName: support.user.username,
    userEmail: support.user.email,
    userPhone: support.user.phone,
    stationId: support.station_id,
    stationName: support.station?.name,
    category: support.category,
    subject: support.subject,
    description: support.description,
    priority: support.priority,
    status: support.status,
    createdAt: support.created_at.toISOString(),
  });
  
  // Emit to admin room only
  this.supportsGateway.notifyAdmins('support.created', support);
  
  return support;
}
```

---

### 💳 6. Payment Status Real-time Updates

**Priority:** 🟡 **MEDIUM** - Financial transparency

**Mô tả:** Thông báo real-time về thanh toán

**Proposed Gateway:** `PaymentsGateway` (`/payments` namespace)

**Events:**

#### Event 6.1: `payment.completed`
```typescript
{
  paymentId: number;
  userId: number;
  subscriptionId?: number;
  packageId?: number;
  packageName?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  transactionId: string;
  timestamp: string;
}
```

**Khi nào trigger:**
- User thanh toán subscription
- User mua package
- Thanh toán thành công/thất bại

**Use Cases:**
- 👤 **User Confirmation**: User nhận xác nhận thanh toán ngay lập tức
- 💰 **Revenue Dashboard**: Admin xem doanh thu real-time
- 📊 **Sales Analytics**: Theo dõi giao dịch real-time
- 🔔 **Payment Alerts**: Thông báo khi có thanh toán lớn

#### Event 6.2: `subscription.activated`
```typescript
{
  subscriptionId: number;
  userId: number;
  userName: string;
  packageId: number;
  packageName: string;
  startDate: string;
  endDate: string;
  swapLimit: number;
  timestamp: string;
}
```

**Khi nào trigger:**
- User mua subscription mới
- Admin activate subscription

**Use Cases:**
- 👤 **Instant Access**: User dùng service ngay sau khi trả tiền
- 📊 **Subscription Tracking**: Theo dõi số lượng active subscriptions
- 💼 **Sales Metrics**: Monitor conversion rate

**Implementation Points:**
```typescript
// In payments.service.ts
async processPayment(paymentDto: CreatePaymentDto) {
  const payment = await this.create(paymentDto);
  
  if (payment.status === 'completed') {
    this.paymentsGateway.notifyPaymentCompleted({
      paymentId: payment.payment_id,
      userId: payment.user_id,
      subscriptionId: payment.subscription_id,
      packageId: payment.package_id,
      amount: payment.amount,
      currency: 'VND',
      paymentMethod: payment.payment_method,
      status: payment.status,
      timestamp: new Date().toISOString(),
    });
    
    // Notify user only
    this.paymentsGateway.notifyUser(payment.user_id, 'payment.completed', payment);
  }
  
  return payment;
}
```

---

### 👥 7. User Activity Real-time Tracking

**Priority:** 🟢 **LOW** - Nice to have

**Mô tả:** Theo dõi hoạt động user real-time

**Proposed Gateway:** `UsersGateway` (`/users` namespace)

**Events:**

#### Event 7.1: `user.online`
```typescript
{
  userId: number;
  username: string;
  role: string;
  stationId?: number; // For staff
  timestamp: string;
}
```

#### Event 7.2: `user.offline`
```typescript
{
  userId: number;
  lastSeen: string;
}
```

**Use Cases:**
- 👨‍💼 **Admin Monitor**: Xem staff nào đang online
- 💬 **Live Support**: Xác nhận staff có available không
- 📊 **Activity Analytics**: Peak hours, active users

---

### 🔔 8. System-wide Notifications

**Priority:** 🟡 **MEDIUM** - Important for communication

**Mô tả:** Thông báo hệ thống cho tất cả users

**Proposed Gateway:** `NotificationsGateway` (`/notifications` namespace)

**Events:**

#### Event 8.1: `notification.broadcast`
```typescript
{
  notificationId: number;
  type: 'info' | 'warning' | 'error' | 'success' | 'maintenance';
  title: string;
  message: string;
  targetRole?: 'all' | 'user' | 'staff' | 'admin';
  targetStation?: number;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
  actionUrl?: string;
  timestamp: string;
}
```

**Khi nào trigger:**
- Bảo trì hệ thống
- Khuyến mãi đặc biệt
- Cảnh báo khẩn cấp
- System updates

**Use Cases:**
- 🚨 **Emergency Alerts**: Cảnh báo sự cố
- 📢 **Announcements**: Thông báo chung
- 🎉 **Promotions**: Khuyến mãi real-time
- 🔧 **Maintenance Notice**: Thông báo bảo trì

---

## 📊 Implementation Priority Matrix

| Use Case | Priority | Complexity | Business Impact | User Impact |
|----------|----------|------------|----------------|-------------|
| 1. Reservations ✅ | ✅ Done | Medium | High | High |
| 2. Battery Status | 🔴 High | Medium | Very High | High |
| 3. Swap Transactions | 🔴 High | Medium | Very High | High |
| 4. Station Availability | 🟡 Medium | Medium | High | Very High |
| 5. Support Tickets | 🟡 Medium | Low | Medium | High |
| 6. Payments | 🟡 Medium | Low | High | Medium |
| 7. User Activity | 🟢 Low | Low | Low | Low |
| 8. System Notifications | 🟡 Medium | Low | Medium | Medium |

---

## 🏗️ Implementation Roadmap

### Phase 1: Core Operations (Week 1-2)
- ✅ **Reservations** (Done)
- 🔋 **Battery Status Updates** (High priority)
- 🔄 **Swap Transactions** (High priority)

### Phase 2: User Experience (Week 3-4)
- 🏢 **Station Availability** (Improves UX significantly)
- 🎫 **Support Tickets** (Improve existing implementation)

### Phase 3: Business Intelligence (Week 5-6)
- 💳 **Payments** (Revenue tracking)
- 🔔 **System Notifications** (Communication)

### Phase 4: Advanced Features (Week 7+)
- 👥 **User Activity Tracking** (Optional)
- 📊 **Advanced Analytics** (Optional)

---

## 🛠️ Technical Implementation Guide

### Step 1: Create Gateway

```typescript
// Example: batteries.gateway.ts
import { 
  WebSocketGateway, 
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'batteries',
  cors: { origin: '*', credentials: true }
})
export class BatteriesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;
  
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }
  
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
  
  notifyBatteryStatusChanged(payload: BatteryStatusChangedEvent) {
    this.server.emit('battery.status.changed', payload);
  }
  
  notifyBatteryChargeUpdated(payload: BatteryChargeUpdatedEvent) {
    this.server.emit('battery.charge.updated', payload);
  }
  
  // Room-based notifications (station-specific)
  notifyStation(stationId: number, event: string, payload: any) {
    this.server.to(`station-${stationId}`).emit(event, payload);
  }
}
```

### Step 2: Register in Module

```typescript
// batteries.module.ts
import { Module } from '@nestjs/common';
import { BatteriesService } from './batteries.service';
import { BatteriesController } from './batteries.controller';
import { BatteriesGateway } from './batteries.gateway'; // Add this

@Module({
  controllers: [BatteriesController],
  providers: [
    BatteriesService,
    BatteriesGateway, // Add this
  ],
  exports: [BatteriesService],
})
export class BatteriesModule {}
```

### Step 3: Inject Gateway in Service

```typescript
// batteries.service.ts
import { Injectable } from '@nestjs/common';
import { BatteriesGateway } from './batteries.gateway';

@Injectable()
export class BatteriesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly batteriesGateway: BatteriesGateway, // Inject
  ) {}
  
  async updateBatteryStatus(batteryId: number, newStatus: BatteryStatus) {
    const oldBattery = await this.findOne(batteryId);
    const battery = await this.update(batteryId, { status: newStatus });
    
    // Emit WebSocket event
    this.batteriesGateway.notifyBatteryStatusChanged({
      batteryId: battery.battery_id,
      stationId: battery.station_id,
      stationName: battery.station?.name,
      previousStatus: oldBattery.status,
      currentStatus: newStatus,
      currentCharge: battery.current_charge,
      timestamp: new Date().toISOString(),
    });
    
    return battery;
  }
}
```

### Step 4: Frontend Implementation

```typescript
// React Hook
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useBatterySocket = () => {
  const [batteries, setBatteries] = useState([]);
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    const socketInstance = io('http://localhost:8080/batteries');
    
    socketInstance.on('battery.status.changed', (data) => {
      console.log('Battery status changed:', data);
      // Update UI
      setBatteries(prev => prev.map(b => 
        b.batteryId === data.batteryId 
          ? { ...b, status: data.currentStatus, charge: data.currentCharge }
          : b
      ));
      
      // Show notification
      toast.info(`Battery ${data.batteryId} status: ${data.currentStatus}`);
    });
    
    socketInstance.on('battery.charge.updated', (data) => {
      console.log('Battery charge updated:', data);
      // Update charge progress bar
    });
    
    setSocket(socketInstance);
    
    return () => socketInstance.disconnect();
  }, []);
  
  return { socket, batteries };
};
```

---

## 🎯 Business Value Analysis

### ROI Calculation

| Feature | Development Cost | Operational Savings | User Satisfaction | ROI |
|---------|-----------------|---------------------|-------------------|-----|
| Battery Status | 2-3 days | High (reduce idle time) | High | ⭐⭐⭐⭐⭐ |
| Swap Transactions | 2-3 days | Medium (better tracking) | Medium | ⭐⭐⭐⭐ |
| Station Availability | 2-3 days | High (reduce user frustration) | Very High | ⭐⭐⭐⭐⭐ |
| Support Tickets | 1-2 days | Medium (faster response) | High | ⭐⭐⭐⭐ |
| Payments | 1-2 days | Low | Medium | ⭐⭐⭐ |

### Key Metrics to Track

1. **Battery Status Updates**
   - Average status change frequency
   - Time to full charge
   - Battery utilization rate

2. **Swap Transactions**
   - Transactions per hour
   - Average swap time
   - Failed transaction rate

3. **Station Availability**
   - User bounce rate (arrive but no battery)
   - Reservation conversion rate
   - Peak usage hours

4. **Support Tickets**
   - Average response time
   - Resolution time
   - Customer satisfaction score

5. **Payments**
   - Payment success rate
   - Average transaction value
   - Subscription renewal rate

---

## 🔐 Security Considerations

### Authentication & Authorization

```typescript
// Add JWT authentication to WebSocket
@WebSocketGateway({
  namespace: 'batteries',
  cors: { origin: '*', credentials: true }
})
export class BatteriesGateway {
  
  @UseGuards(WsJwtGuard) // Add this
  handleConnection(client: Socket) {
    const user = client.handshake.auth.user;
    
    // Join role-based rooms
    if (user.role === 'admin') {
      client.join('admins');
    }
    
    if (user.role === 'staff' && user.station_id) {
      client.join(`station-${user.station_id}`);
    }
  }
}
```

### Room-based Access Control

```typescript
// Only emit to authorized users
notifyBatteryStatusChanged(payload: BatteryStatusChangedEvent) {
  // Broadcast to everyone
  this.server.emit('battery.status.changed', payload);
  
  // OR: Station-specific
  this.server
    .to(`station-${payload.stationId}`)
    .emit('battery.status.changed', payload);
  
  // OR: Admin only
  this.server
    .to('admins')
    .emit('battery.status.changed', payload);
}
```

---

## 📈 Performance Optimization

### 1. Event Throttling

```typescript
// Debounce high-frequency events
import { debounce } from 'lodash';

const notifyBatteryChargeUpdated = debounce((payload) => {
  this.server.emit('battery.charge.updated', payload);
}, 5000); // Max once per 5 seconds
```

### 2. Payload Optimization

```typescript
// Only send necessary data
notifyBatteryStatusChanged(payload: BatteryStatusChangedEvent) {
  const optimizedPayload = {
    id: payload.batteryId,
    s: payload.currentStatus, // Shortened key
    c: payload.currentCharge,
    t: payload.timestamp,
  };
  
  this.server.emit('battery.status.changed', optimizedPayload);
}
```

### 3. Connection Pooling

```typescript
// Limit concurrent connections per user
private readonly MAX_CONNECTIONS_PER_USER = 3;
private userConnections = new Map<number, Set<string>>();

handleConnection(client: Socket) {
  const userId = client.handshake.auth.userId;
  const connections = this.userConnections.get(userId) || new Set();
  
  if (connections.size >= this.MAX_CONNECTIONS_PER_USER) {
    client.disconnect();
    return;
  }
  
  connections.add(client.id);
  this.userConnections.set(userId, connections);
}
```

---

## ✅ Testing Strategy

### Unit Tests

```typescript
describe('BatteriesGateway', () => {
  it('should emit battery status changed event', () => {
    const gateway = new BatteriesGateway();
    const spy = jest.spyOn(gateway['server'], 'emit');
    
    gateway.notifyBatteryStatusChanged({
      batteryId: 1,
      previousStatus: 'charging',
      currentStatus: 'full',
      // ...
    });
    
    expect(spy).toHaveBeenCalledWith('battery.status.changed', expect.any(Object));
  });
});
```

### Integration Tests

```typescript
describe('WebSocket Integration', () => {
  it('should receive battery status update', (done) => {
    const socket = io('http://localhost:8080/batteries');
    
    socket.on('battery.status.changed', (data) => {
      expect(data.batteryId).toBe(1);
      expect(data.currentStatus).toBe('full');
      socket.disconnect();
      done();
    });
    
    // Trigger event via API
    request(app)
      .patch('/api/v1/batteries/1/status')
      .send({ status: 'full' })
      .expect(200);
  });
});
```

---

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [NestJS WebSockets Guide](https://docs.nestjs.com/websockets/gateways)
- [Frontend Integration Guide](./FRONTEND_WEBSOCKET_INTEGRATION.md)
- [WebSocket Testing Guide](./WEBSOCKET_TESTING_GUIDE.md)

---

## 🎉 Conclusion

WebSocket technology mang lại **giá trị rất lớn** cho hệ thống EV Battery Swap Station:

### Top Benefits:
1. ⚡ **Real-time Operations** - Staff và users luôn có thông tin mới nhất
2. 📊 **Better Visibility** - Admin có overview toàn bộ hệ thống real-time
3. 😊 **Improved UX** - Users không cần refresh page, nhận notification ngay lập tức
4. 🎯 **Operational Efficiency** - Giảm thời gian chờ đợi, tối ưu quy trình
5. 💰 **Revenue Growth** - Tăng khả năng phục vụ, giảm thời gian chết

### Recommended Implementation Order:
1. ✅ Reservations (Done)
2. 🔋 Battery Status (Highest impact)
3. 🔄 Swap Transactions (Core business)
4. 🏢 Station Availability (User experience)
5. 🎫 Support Tickets (Customer service)

**Start with Battery Status and Swap Transactions to get maximum ROI!** 🚀
