# Subscription API Documentation

## Overview

API cho phép người dùng đăng ký gói dịch vụ thay pin (Battery Service Package). Hệ thống sẽ track subscription status, thời gian, và số lượt swap đã sử dụng.

## Database Schema

### Subscription Model

```prisma
model Subscription {
  subscription_id Int                @id @default(autoincrement())
  user_id         Int
  package_id      Int
  vehicle_id      Int?
  start_date      DateTime           @default(now())
  end_date        DateTime
  status          SubscriptionStatus
  swap_used       Int                @default(0)
  created_at      DateTime           @default(now())
  updated_at      DateTime           @updatedAt

  // Relationships
  user    User                   @relation(fields: [user_id], references: [user_id])
  package BatteryServicePackage @relation(fields: [package_id], references: [package_id])
  vehicle Vehicle?               @relation(fields: [vehicle_id], references: [vehicle_id])
}
```

### SubscriptionStatus Enum

- `active`: Đang hoạt động
- `expired`: Đã hết hạn
- `cancelled`: Đã hủy

## API Endpoints

### 1. Register Subscription (Đăng ký gói)

**POST** `/subscriptions`

- **Auth**: Required (driver, admin)
- **Body**:

```json
{
  "user_id": 1,
  "package_id": 1,
  "vehicle_id": 1  // optional
}
```

- **Response**:

```json
{
  "subscription_id": 1,
  "user_id": 1,
  "package_id": 1,
  "vehicle_id": 1,
  "start_date": "2025-01-21T10:00:00.000Z",
  "end_date": "2025-02-20T10:00:00.000Z",  // start_date + duration_days
  "status": "active",
  "swap_used": 0,
  "package": {
    "package_id": 1,
    "name": "Basic Package",
    "swap_count": 10,
    "duration_days": 30,
    // ...other fields
  },
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "0123456789"
  },
  "vehicle": { /* vehicle details */ }
}
```

**Business Logic:**

- ✅ Kiểm tra package có tồn tại và active
- ✅ Kiểm tra user chưa có subscription active cho package này
- ✅ Tự động tính end_date dựa trên duration_days
- ✅ Set status = active, swap_used = 0

### 2. Get All Subscriptions

**GET** `/subscriptions`

- **Auth**: Required (admin, station_staff)
- **Response**: Array of all subscriptions với relationships

### 3. Get Subscription by ID

**GET** `/subscriptions/:id`

- **Auth**: Required
- **Response**: Subscription detail với package, user, vehicle info

### 4. Get User's Subscriptions

**GET** `/subscriptions/user/:userId`

- **Auth**: Required
- **Response**: Array of user's subscriptions (all status)

### 5. Get User's Active Subscriptions

**GET** `/subscriptions/user/:userId/active`

- **Auth**: Required
- **Response**: Array of user's active subscriptions

### 6. Update Subscription

**PATCH** `/subscriptions/:id`

- **Auth**: Required (admin)
- **Body**:

```json
{
  "status": "cancelled",  // optional
  "swap_used": 5          // optional
}
```

### 7. Cancel Subscription

**PATCH** `/subscriptions/:id/cancel`

- **Auth**: Required (driver, admin)
- **Response**: Updated subscription với status = cancelled

**Business Logic:**

- ✅ Kiểm tra subscription đang active
- ✅ Set status = cancelled

### 8. Increment Swap Used

**PATCH** `/subscriptions/:id/increment-swap`

- **Auth**: Required (station_staff, admin)
- **Response**: Updated subscription với swap_used tăng lên 1

**Business Logic:**

- ✅ Kiểm tra subscription đang active
- ✅ Kiểm tra chưa vượt quá swap_count limit
- ✅ Tăng swap_used lên 1

**Use Case**: Station staff call API này mỗi khi user swap battery thành công.

### 9. Check Expired Subscriptions

**POST** `/subscriptions/check-expired`

- **Auth**: Required (admin)
- **Response**:

```json
{
  "message": "Updated 5 expired subscriptions",
  "count": 5
}
```

**Business Logic:**

- Tìm tất cả subscriptions có status = active và end_date < now
- Update status = expired

**Use Case**: Chạy định kỳ (cron job) để update expired subscriptions.

### 10. Delete Subscription

**DELETE** `/subscriptions/:id`

- **Auth**: Required (admin)
- **Response**: Deleted subscription

## Validation Rules

### CreateSubscriptionDto

- `user_id`: Required, integer
- `package_id`: Required, integer
- `vehicle_id`: Optional, integer

### UpdateSubscriptionDto

- `status`: Optional, enum (active, expired, cancelled)
- `swap_used`: Optional, integer

## Error Handling

### Common Errors

- `404 Not Found`: Package/Subscription không tồn tại
- `400 Bad Request`:
  - Package không active
  - Subscription không active (khi cancel/increment)
  - Đã vượt quá swap limit
- `409 Conflict`: User đã có active subscription cho package này

## Usage Examples

### Example 1: User đăng ký gói mới

```bash
POST /subscriptions
{
  "user_id": 1,
  "package_id": 2,
  "vehicle_id": 1
}
```

### Example 2: Check user's active subscriptions

```bash
GET /subscriptions/user/1/active
```

### Example 3: Station staff record battery swap

```bash
PATCH /subscriptions/5/increment-swap
```

### Example 4: User cancel subscription

```bash
PATCH /subscriptions/5/cancel
```

## Integration Points

### Related Modules

- **Users Module**: User relationship
- **Battery Service Packages Module**: Package relationship
- **Vehicles Module**: Vehicle relationship (optional)
- **Auth Module**: Authentication & authorization

### Future Enhancements

- Payment integration khi tạo subscription
- Notification khi subscription sắp hết hạn
- Auto-renewal functionality
- Usage analytics & reporting
- Penalty fee calculation khi vượt quá limit

## Testing Checklist

- [ ] Test đăng ký subscription với package active
- [ ] Test đăng ký subscription với package inactive (should fail)
- [ ] Test duplicate subscription (should fail)
- [ ] Test cancel subscription
- [ ] Test increment swap under limit
- [ ] Test increment swap over limit (should fail)
- [ ] Test check expired subscriptions
- [ ] Test các endpoints với different roles
- [ ] Test với vehicle_id optional

## Migration

Migration đã được tạo và apply:

```bash
npx prisma migrate dev --name add_subscription_model
```

Prisma client đã được generate:

```bash
npx prisma generate
```
