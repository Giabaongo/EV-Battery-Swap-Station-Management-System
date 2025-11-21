# Swap Transactions API Documentation

## Overview

API quản lý các giao dịch đổi pin tại trạm trong hệ thống EV Battery Swap Station Management System. Cho phép theo dõi và quản lý quá trình đổi pin từ user, vehicle, station, battery taken và battery returned cùng với trạng thái giao dịch.

## Database Schema

### SwapTransaction Model

```prisma
model SwapTransaction {
    transaction_id      Int                   @id @default(autoincrement())
    user_id             Int
    vehicle_id          Int
    station_id          Int
    battery_taken_id    Int
    battery_returned_id Int?
    createAt            DateTime              @default(now())
    updateAt            DateTime              @updatedAt
    status              SwapTransactionStatus

    // Relationships
    user             User     @relation(fields: [user_id], references: [user_id])
    vehicle          Vehicle  @relation(fields: [vehicle_id], references: [vehicle_id])
    station          Station  @relation(fields: [station_id], references: [station_id])
    battery_taken    Battery  @relation("BatteryTaken", fields: [battery_taken_id], references: [battery_id])
    battery_returned Battery? @relation("BatteryReturned", fields: [battery_returned_id], references: [battery_id])

    @@map("swap_transactions")
}
```

### SwapTransactionStatus Enum

```prisma
enum SwapTransactionStatus {
    completed   // Hoàn thành thành công
    failed      // Thất bại (lỗi hệ thống hoặc technical issues)
    cancelled   // Đã hủy
}
```

## API Endpoints

Base URL: `/api/v1/swap-transactions`

### 1. Create Swap Transaction

**POST** `/api/v1/swap-transactions`

- **Auth**: Required - Role: `driver`
- **Body**:

```json
{
  "user_id": 1,
  "vehicle_id": 1,
  "station_id": 1,
  "battery_taken_id": 5,
  "battery_returned_id": 3,  // optional - null for first-time swaps
  "status": "completed"       // optional - from SwapTransactionStatus enum
}
```

- **Response**:

```json
{
  "transaction_id": 1,
  "user_id": 1,
  "vehicle_id": 1,
  "station_id": 1,
  "battery_taken_id": 5,
  "battery_returned_id": 3,
  "createAt": "2025-01-21T10:30:00.000Z",
  "updateAt": "2025-01-21T10:30:00.000Z",
  "status": "completed"
}
```

**Business Logic:**

- ✅ Kiểm tra user tồn tại
- ✅ Kiểm tra vehicle tồn tại và thuộc sở hữu của user (`vehicle.user_id === user_id`)
- ✅ Kiểm tra station tồn tại
- ✅ Kiểm tra battery_taken tồn tại và có status = `full`
- ✅ Kiểm tra battery_returned tồn tại (nếu có)
- ✅ Parallel validation để tối ưu performance
- ✅ Logging chi tiết cho debug

### 2. Get All Swap Transactions

**GET** `/api/v1/swap-transactions`

- **Auth**: Required - Role: `admin`
- **Response**: Array of all swap transactions, sorted by `createAt DESC`

```json
[
  {
    "transaction_id": 1,
    "user_id": 1,
    "vehicle_id": 1,
    "station_id": 1,
    "battery_taken_id": 5,
    "battery_returned_id": 3,
    "createAt": "2025-01-21T10:30:00.000Z",
    "updateAt": "2025-01-21T10:35:00.000Z",
    "status": "completed"
  }
]
```

### 3. Get Swap Transaction by ID

**GET** `/api/v1/swap-transactions/:id`

- **Auth**: Required - Role: `admin`
- **Parameters**: `id` (transaction_id) - validated with `ParseIntPipe`
- **Response**: Swap transaction detail hoặc null nếu không tìm thấy

```json
{
  "transaction_id": 1,
  "user_id": 1,
  "vehicle_id": 1,
  "station_id": 1,
  "battery_taken_id": 5,
  "battery_returned_id": 3,
  "createAt": "2025-01-21T10:30:00.000Z",
  "updateAt": "2025-01-21T10:35:00.000Z",
  "status": "completed"
}
```

### 4. Get User's Swap Transactions

**GET** `/api/v1/swap-transactions/user/:user_id`

- **Auth**: Required - Role: `driver`
- **Parameters**: `user_id` - validated with `ParseIntPipe`
- **Response**: Array of user's swap transactions, sorted by `createAt DESC`

```json
{
  "transaction_id": 1,
  "user_id": 1,
  "vehicle_id": 1,
  "station_id": 1,
  "battery_taken_id": 5,
  "battery_returned_id": 3,
  "createAt": "2025-01-21T10:30:00.000Z",
  "updateAt": "2025-01-21T10:35:00.000Z",
  "status": "completed"
}
```

### 5. Update Swap Transaction Status

**PATCH** `/api/v1/swap-transactions/:id`

- **Auth**: Required - Role: `admin`
- **Parameters**: `id` (transaction_id) - validated with `ParseIntPipe`
- **Body**:

```json
{
  "status": "failed"
}
```

- **Response**: Updated swap transaction

```json
{
  "transaction_id": 1,
  "user_id": 1,
  "vehicle_id": 1,
  "station_id": 1,
  "battery_taken_id": 5,
  "battery_returned_id": 3,
  "createAt": "2025-01-21T10:30:00.000Z",
  "updateAt": "2025-01-21T10:35:00.000Z",
  "status": "completed"
}
```

**Business Logic:**

- ✅ Update status trong database
- ✅ Tự động update `updateAt` timestamp
- ✅ Error handling với `InternalServerErrorException`
- ✅ Logging cho failed updates

### 6. Delete Swap Transaction

**DELETE** `/api/v1/swap-transactions/:id`

- **Auth**: Required - Role: `admin`
- **Parameters**: `id` (transaction_id) - validated with `ParseIntPipe`
- **Response**: Placeholder message

**⚠️ Note**: Hiện tại chỉ trả về placeholder string, chưa implement deletion logic thực tế.

## Module Architecture

### Dependencies

```typescript
@Module({
  imports: [
    DatabaseModule,      // Prisma database access
    UsersModule,         // User validation
    VehiclesModule,      // Vehicle validation
    StationsModule,      // Station validation
    BatteriesModule      // Battery validation
  ],
  controllers: [SwapTransactionsController],
  providers: [SwapTransactionsService],
})
export class SwapTransactionsModule {}
```

### File Structure

```
src/modules/swap-transactions/
├── dto/
│   ├── create-swap-transaction.dto.ts
│   └── update-swap-transaction.dto.ts
├── swap-transactions.controller.ts
├── swap-transactions.service.ts
└── swap-transactions.module.ts

prisma/models/
└── swap_transactions.prisma
```

## Validation Rules

### CreateSwapTransactionDto

```typescript
import { IsNotEmpty, IsInt, IsOptional, IsEnum } from 'class-validator';

export class CreateSwapTransactionDto {
  @IsNotEmpty()
  @IsInt()
  user_id: number;

  @IsNotEmpty()
  @IsInt()
  vehicle_id: number;

  @IsNotEmpty()
  @IsInt()
  station_id: number;

  @IsNotEmpty()
  @IsInt()
  battery_taken_id: number;

  @IsOptional()
  @IsInt()
  battery_returned_id?: number;

  @IsOptional()
  @IsEnum(SwapTransactionStatus)
  status?: SwapTransactionStatus;
}
```

### UpdateSwapTransactionDto

```typescript
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateSwapTransactionDto {
  @IsOptional()
  @IsEnum(SwapTransactionStatus)
  status?: SwapTransactionStatus;
}
```

## Authentication & Authorization

### Guards Used

- **AuthGuard**: Xác thực JWT token
- **RolesGuard**: Kiểm tra quyền truy cập theo role

### Role-based Access

```typescript
// Driver có thể:
@Roles($Enums.Role.driver)
- Tạo swap transaction mới
- Xem transactions của chính mình

// Admin có thể:
@Roles($Enums.Role.admin)
- Xem tất cả transactions
- Xem transaction theo ID
- Update transaction status
- Delete transaction
```

## Error Handling

### Exception Types

- **NotFoundException**:
  - `User with ID {id} not found`
  - `Vehicle with ID {id} not found`
  - `Station with ID {id} not found`
  - `Battery with ID {id} not found`
  - `Vehicle with ID {id} not owned by user with ID {user_id}`
  - `Battery with ID {id} is not full`

- **InternalServerErrorException**:
  - `Failed to update swap transaction status`

### Error Response Format

```json
{
  "statusCode": 404,
  "message": "User with ID 999 not found",
  "error": "Not Found"
}
```

## Business Flow

### Transaction Creation Process

1. **Parallel Validation** (Performance Optimization):

   ```typescript
   const [user, vehicle, station, battery_taken] = await Promise.all([
     this.usersService.findOneById(createDto.user_id),
     this.vehiclesService.findOne(createDto.vehicle_id),
     this.stationsService.findOne(createDto.station_id),
     this.batteriesService.findOne(createDto.battery_taken_id),
   ]);
   ```

2. **Business Logic Validation**:
   - User existence check
   - Vehicle ownership verification
   - Station availability check
   - Battery status validation (must be "full")
   - Optional battery_returned validation

3. **Database Transaction**:
   - Create record với auto-generated timestamps
   - Set status từ DTO hoặc default value

4. **Logging & Monitoring**:

   ```typescript
   this.logger.log(`Creating swap transaction for user ${createDto.user_id} at station ${createDto.station_id}`);
   ```

## Usage Examples

### Example 1: Driver tạo swap transaction

```bash
POST /api/v1/swap-transactions
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "user_id": 1,
  "vehicle_id": 1,
  "station_id": 2,
  "battery_taken_id": 15,
  "battery_returned_id": 8,
  "status": "completed"
}
```

### Example 2: Admin update transaction status

```bash
PATCH /api/v1/swap-transactions/1
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "status": "failed"
}
```

### Example 3: Driver xem lịch sử transactions

```bash
GET /api/v1/swap-transactions/user/1
Authorization: Bearer {jwt_token}
```

### Example 4: Admin xem tất cả transactions

```bash
GET /api/v1/swap-transactions
Authorization: Bearer {jwt_token}
```

## Current Implementation Status

### ✅ Completed Features

- ✅ Full CRUD controller với proper decorators
- ✅ Role-based authentication & authorization
- ✅ Input validation với class-validator
- ✅ Comprehensive business logic validation
- ✅ Error handling và detailed logging
- ✅ Database relationships properly configured
- ✅ Parallel async validation for performance
- ✅ Auto-generated timestamps
- ✅ Status update functionality

### 🔄 Pending Features

```typescript
// TODO items từ service:
// TODO: check if battery in user packages
// TODO: check if user subscribed any package or package existed
// TODO: Update when user package feature is available
```

### ⚠️ Known Issues

1. **DELETE operation**: `remove()` method chỉ trả về placeholder string
2. **User package integration**: Commented out trong code, chờ feature hoàn thiện
3. **Cost calculation**: Chưa có field `cost` trong schema

## Database Optimization

### Recommended Indexes

```sql
-- Performance indexes
CREATE INDEX idx_swap_transactions_user_id ON swap_transactions(user_id);
CREATE INDEX idx_swap_transactions_station_id ON swap_transactions(station_id);
CREATE INDEX idx_swap_transactions_createAt_desc ON swap_transactions(createAt DESC);
CREATE INDEX idx_swap_transactions_status ON swap_transactions(status);

-- Composite indexes for complex queries
CREATE INDEX idx_swap_transactions_user_status ON swap_transactions(user_id, status);
CREATE INDEX idx_swap_transactions_station_date ON swap_transactions(station_id, createAt DESC);
```

## Development Recommendations

### 1. Complete Delete Operation

```typescript
async remove(id: number) {
  try {
    const transaction = await this.databaseService.swapTransaction.findUnique({
      where: { transaction_id: id }
    });
    
    if (!transaction) {
      throw new NotFoundException(`Swap transaction with ID ${id} not found`);
    }

    return await this.databaseService.swapTransaction.delete({
      where: { transaction_id: id }
    });
  } catch (error) {
    this.logger.error(`Failed to delete swap transaction: ${error.message}`);
    throw new InternalServerErrorException('Failed to delete swap transaction');
  }
}
```

### 2. Add Cost Calculation

```prisma
model SwapTransaction {
  // ...existing fields...
  cost         Decimal? @db.Decimal(10, 2)
  currency     String?  @default("VND")
  // ...
}
```

### 3. Add Subscription Integration

```typescript
// When subscription feature is ready
async validateUserSubscription(user_id: number, package_id?: number) {
  const activeSubscriptions = await this.subscriptionsService
    .findActiveByUserId(user_id);
  
  if (activeSubscriptions.length === 0) {
    throw new NotFoundException('User has no active subscription');
  }
  
  return activeSubscriptions[0];
}
```

### 4. Add Status Transition Validation

```typescript
private validateStatusTransition(currentStatus: SwapTransactionStatus, newStatus: SwapTransactionStatus) {
  const validTransitions = {
    [SwapTransactionStatus.completed]: [],
    [SwapTransactionStatus.failed]: [],
    [SwapTransactionStatus.cancelled]: []
  };
  
  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw new BadRequestException(`Cannot transition from ${currentStatus} to ${newStatus}`);
  }
}
```

## Testing Strategy

### Unit Tests

- [ ] Test transaction creation với valid data
- [ ] Test parallel validation logic
- [ ] Test vehicle ownership validation
- [ ] Test battery status validation
- [ ] Test error handling scenarios
- [ ] Test status update functionality
- [ ] Test role-based authorization

### Integration Tests

- [ ] Test complete API flow với real database
- [ ] Test authentication middleware
- [ ] Test concurrent transaction handling
- [ ] Test proper response formats
- [ ] Test error response formats

### Load Testing

- [ ] Test performance với high transaction volume
- [ ] Test database connection pooling
- [ ] Test parallel validation performance

## Related Documentation

- [User Management API](./USER_API.md)
- [Vehicle Management API](./VEHICLE_API.md)
- [Station Management API](./STATION_API.md)
- [Battery Management API](./BATTERY_API.md)
- [Subscription API](./SUBSCRIPTION_API.md)
- [Authentication & Authorization](./AUTH_API.md)

## Monitoring & Analytics

### Key Metrics to Track

1. **Transaction Volume**: Số lượng transactions per day/hour
2. **Success Rate**: Tỷ lệ completed vs failed transactions
3. **Response Time**: Average API response time
4. **Error Rate**: Tỷ lệ lỗi theo từng endpoint
5. **User Activity**: Top users theo transaction count
6. **Station Utilization**: Top stations theo transaction volume

### Logging Events

```typescript
// Success events
this.logger.log(`Swap transaction ${transaction_id} created successfully`);
this.logger.log(`Status updated for transaction ${transaction_id}: ${old_status} -> ${new_status}`);

// Error events
this.logger.error(`Failed to create transaction: ${error.message}`);
this.logger.warn(`Invalid vehicle ownership: vehicle ${vehicle_id} not owned by user ${user_id}`);
```

---

*Last updated: January 2025*
*Version: 1.0*
