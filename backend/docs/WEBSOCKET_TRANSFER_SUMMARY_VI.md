# Tổng kết WebSocket cho Transfer Request và Transfer Ticket

## ✅ Đã hoàn thành

Đã thêm WebSocket real-time notifications cho:
1. **Battery Transfer Request** (Yêu cầu chuyển pin)
2. **Battery Transfer Ticket** (Phiếu xuất/nhập pin)

## 📂 File đã tạo/sửa

### File mới tạo:
1. `battery-transfer-request.gateway.ts` - WebSocket gateway cho transfer request
2. `battery-transfer-ticket.gateway.ts` - WebSocket gateway cho export/import ticket
3. `docs/WEBSOCKET_TRANSFER_IMPLEMENTATION.md` - Tài liệu chi tiết
4. `test-transfer-websocket.js` - File test WebSocket

### File đã sửa:
1. `battery-transfer-request.module.ts` - Thêm gateway vào module
2. `battery-transfer-request.service.ts` - Thêm WebSocket notifications
3. `battery-transfer-ticket.module.ts` - Thêm gateway vào module
4. `battery-transfer-ticket.service.ts` - Thêm WebSocket notifications

## 🔔 Các sự kiện WebSocket

### Transfer Request (Namespace: `battery-transfer-request`)

1. **`transfer.request.created`** - Khi tạo transfer request mới
   - Thông tin: Trạm xuất, trạm nhập, loại pin, số lượng, người tạo

2. **`transfer.request.status.updated`** - Khi thay đổi trạng thái
   - Thông tin: Trạng thái cũ → trạng thái mới, người cập nhật

3. **`transfer.request.updated`** - Khi cập nhật thông tin khác
   - Thông tin: Các field đã thay đổi

### Transfer Ticket (Namespace: `battery-transfer-ticket`)

1. **`transfer.ticket.created`** - Khi tạo phiếu xuất/nhập
   - Phân biệt: Export (📤) hoặc Import (📥)
   - Thông tin: ID pin, nhân viên, trạm liên quan

2. **`export.ticket.completed`** - Khi hoàn thành xuất pin
   - Thông tin: Danh sách pin đã xuất, trạm xuất/nhận

3. **`import.ticket.completed`** - Khi hoàn thành nhập pin
   - Thông tin: Danh sách pin đã nhập, vị trí slot

4. **`battery.transit.status`** - Trạng thái pin đang vận chuyển
   - `inTransit: true` - Pin đang vận chuyển (🚚)
   - `inTransit: false` - Pin đã đến (✅)

## 🎯 Kịch bản sử dụng

### 1. Admin Dashboard - Theo dõi toàn bộ
```javascript
// Kết nối đến cả 2 namespace
const requestSocket = io('http://localhost:8080/battery-transfer-request');
const ticketSocket = io('http://localhost:8080/battery-transfer-ticket');

// Nhận thông báo khi có transfer request mới
requestSocket.on('transfer.request.created', (data) => {
  showNotification(`Yêu cầu chuyển mới: ${data.fromStationName} → ${data.toStationName}`);
});

// Nhận thông báo khi xuất pin
ticketSocket.on('export.ticket.completed', (data) => {
  showNotification(`Đã xuất ${data.batteryCount} pin từ ${data.fromStationName}`);
});

// Nhận thông báo khi nhập pin
ticketSocket.on('import.ticket.completed', (data) => {
  showNotification(`Đã nhận ${data.batteryCount} pin tại ${data.toStationName}`);
});
```

### 2. Station Staff - Theo dõi trạm riêng
```javascript
const myStationId = 1; // Lấy từ user context

requestSocket.on('transfer.request.created', (data) => {
  if (data.fromStationId === myStationId) {
    showNotification('⚠️ Có yêu cầu xuất pin mới!');
  } else if (data.toStationId === myStationId) {
    showNotification('📥 Sắp có pin về trạm!');
  }
});
```

### 3. Tracking Pin - Theo dõi vận chuyển
```javascript
ticketSocket.on('battery.transit.status', (data) => {
  if (data.inTransit) {
    updateMap(`Pin đang vận chuyển: ${data.fromStationName} → ${data.toStationName}`);
  } else {
    showAlert('✅ Pin đã đến nơi!');
  }
});
```

## 🧪 Test WebSocket

### Cách 1: Dùng file test
```bash
cd backend
node test-transfer-websocket.js
```

File này sẽ:
- Kết nối đến cả 2 namespace
- Lắng nghe tất cả events
- Hiển thị thông tin chi tiết khi có event

### Cách 2: Dùng API để trigger events

**Tạo Transfer Request:**
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
→ Trigger event: `transfer.request.created`

**Tạo Export Ticket:**
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
→ Trigger events: `export.ticket.completed`, `battery.transit.status` (inTransit=true)

**Tạo Import Ticket:**
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
→ Trigger events: `import.ticket.completed`, `battery.transit.status` (inTransit=false)

**Update Status:**
```bash
PATCH http://localhost:8080/api/v1/battery-transfer-request/1
{
  "status": "completed"
}
```
→ Trigger event: `transfer.request.status.updated`

## 📱 Frontend Integration Example

```javascript
// hooks/useTransferWebSocket.js
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { toast } from 'sonner';

export const useTransferWebSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const requestSocket = io('http://localhost:8080/battery-transfer-request');
    const ticketSocket = io('http://localhost:8080/battery-transfer-ticket');

    // Transfer Request Events
    requestSocket.on('transfer.request.created', (data) => {
      toast.info(`Yêu cầu chuyển mới: ${data.fromStationName} → ${data.toStationName}`);
      // Refresh danh sách transfer requests
    });

    requestSocket.on('transfer.request.status.updated', (data) => {
      toast.success(`Trạng thái đã đổi: ${data.currentStatus}`);
      // Update UI
    });

    // Transfer Ticket Events
    ticketSocket.on('export.ticket.completed', (data) => {
      toast.success(`✅ Đã xuất ${data.batteryCount} pin`);
      // Update battery list
    });

    ticketSocket.on('import.ticket.completed', (data) => {
      toast.success(`✅ Đã nhận ${data.batteryCount} pin`);
      // Update battery list, refresh slots
    });

    ticketSocket.on('battery.transit.status', (data) => {
      if (data.inTransit) {
        toast.info(`🚚 ${data.batteryIds.length} pin đang vận chuyển`);
      } else {
        toast.success(`✅ ${data.batteryIds.length} pin đã đến!`);
      }
    });

    return () => {
      requestSocket.close();
      ticketSocket.close();
    };
  }, []);

  return socket;
};
```

## 🔐 Các tính năng chưa làm (TODO)

1. **Authentication**: Thêm xác thực WebSocket connection
2. **Room management**: Join/leave rooms theo station
3. **Reconnection**: Xử lý reconnect tự động
4. **Offline queue**: Lưu thông báo cho user offline
5. **Event logging**: Log tất cả WebSocket events
6. **Rate limiting**: Giới hạn số lượng events

## ✨ Lợi ích

✅ **Real-time updates** - Không cần refresh page
✅ **Giảm load server** - Không cần polling
✅ **UX tốt hơn** - Thông báo tức thì
✅ **Theo dõi chính xác** - Biết pin đang ở đâu
✅ **Phối hợp giữa trạm** - 2 trạm cùng nhận thông báo
✅ **Notification system** - Có thể tích hợp toast/alert

## 📊 Luồng hoạt động

### Export Flow (Xuất pin):
1. Admin tạo Transfer Request
   → `transfer.request.created` broadcast
2. Staff trạm A tạo Export Ticket
   → `transfer.ticket.created` + `export.ticket.completed`
   → `battery.transit.status` (inTransit=true)
3. Pin chuyển từ trạm A sang trạm B (status = in_transit)

### Import Flow (Nhập pin):
1. Staff trạm B tạo Import Ticket
   → `transfer.ticket.created` + `import.ticket.completed`
   → `battery.transit.status` (inTransit=false)
2. Pin được assign vào slot tại trạm B
3. Admin update Transfer Request status = completed
   → `transfer.request.status.updated`

## 🎓 Tài liệu tham khảo

- Chi tiết đầy đủ: `docs/WEBSOCKET_TRANSFER_IMPLEMENTATION.md`
- Test script: `test-transfer-websocket.js`
- NestJS WebSocket: https://docs.nestjs.com/websockets/gateways
- Socket.IO: https://socket.io/docs/v4/

## 🚀 Ready to use!

Tất cả đã sẵn sàng! Chỉ cần:
1. Start server: `npm run start:dev`
2. Test WebSocket: `node test-transfer-websocket.js`
3. Tạo transfer request/ticket qua API
4. Xem events real-time trong console

**Happy coding! 🎉**
