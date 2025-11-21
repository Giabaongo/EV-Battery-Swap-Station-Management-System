# Payment API Testing Guide (Backend Only)

## 🧪 Hướng Dẫn Test Payment API Hoàn Toàn Trên Backend

Guide này giúp bạn test toàn bộ payment flow mà không cần VNPAY redirect hoặc frontend.

---

## 📋 Prerequisites

### 1. Đảm bảo server đang chạy
```bash
cd backend
npm run start:dev
```

### 2. Có sẵn test data
- User với role `driver` (user_id: 1)
- Active battery service package (package_id: 1)
- Optional: Vehicle (vehicle_id: 1)

### 3. JWT Token
Lấy token từ login endpoint:
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

---

## 🔧 Testing Tools

Bạn có thể dùng:
- **Thunder Client** (VS Code extension) - Recommended
- **Postman**
- **REST Client** (VS Code extension)
- **curl** (command line)

---

## 🎯 Test Scenarios

### Scenario 1: Mock Payment Success (Full Flow)

**Test Case:** User thanh toán thành công → Subscription được tạo tự động

**Endpoint:** `POST /payments/mock-payment`

**Request:**
```http
POST http://localhost:3000/payments/mock-payment
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "user_id": 1,
  "package_id": 1,
  "vehicle_id": 1,
  "vnp_response_code": "00",
  "vnp_bank_code": "NCB",
  "vnp_card_type": "ATM"
}
```

**Expected Response:**
```json
{
  "success": true,
  "payment": {
    "payment_id": 1,
    "user_id": 1,
    "package_id": 1,
    "subscription_id": 1,
    "amount": "100000.00",
    "method": "vnpay",
    "status": "success",
    "transaction_id": "1234567890",
    "vnp_txn_ref": "04141530",
    "vnp_response_code": "00",
    "vnp_bank_code": "NCB",
    "vnp_card_type": "ATM",
    "payment_time": "2025-01-21T14:15:30.000Z",
    "package": {
      "package_id": 1,
      "name": "Basic Package",
      "base_price": "100000.00",
      "duration_days": 30
    },
    "user": {
      "user_id": 1,
      "username": "john_doe",
      "email": "john@example.com"
    }
  },
  "subscription": {
    "subscription_id": 1,
    "user_id": 1,
    "package_id": 1,
    "vehicle_id": 1,
    "start_date": "2025-01-21T14:15:30.000Z",
    "end_date": "2025-02-20T14:15:30.000Z",
    "status": "active",
    "swap_used": 0,
    "package": {
      "package_id": 1,
      "name": "Basic Package",
      "swap_count": 10
    },
    "vehicle": {
      "vehicle_id": 1,
      "vin": "ABC123"
    }
  },
  "mock_response": {
    "vnp_Amount": "10000000",
    "vnp_BankCode": "NCB",
    "vnp_CardType": "ATM",
    "vnp_ResponseCode": "00",
    "vnp_TransactionStatus": "00"
  },
  "message": "Payment successful, subscription created"
}
```

**Validation Steps:**
1. ✅ Payment record được tạo với status = "success"
2. ✅ Subscription được tạo tự động với status = "active"
3. ✅ end_date = start_date + duration_days
4. ✅ swap_used = 0
5. ✅ subscription_id được link vào payment

---

### Scenario 2: Mock Payment Cancelled

**Test Case:** User hủy thanh toán → Subscription không được tạo

**Request:**
```http
POST http://localhost:3000/payments/mock-payment
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "user_id": 1,
  "package_id": 1,
  "vnp_response_code": "24"
}
```

**Expected Response:**
```json
{
  "success": false,
  "payment": {
    "payment_id": 2,
    "status": "cancelled",
    "vnp_response_code": "24"
  },
  "subscription": null,
  "message": "Payment cancelled by user"
}
```

**Validation:**
- ✅ Payment status = "cancelled"
- ✅ subscription = null
- ✅ No subscription created in DB

---

### Scenario 3: Mock Payment Failed

**Test Case:** Thanh toán thất bại (wrong OTP, insufficient balance, etc.)

**Request:**
```http
POST http://localhost:3000/payments/mock-payment
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "user_id": 1,
  "package_id": 1,
  "vnp_response_code": "13",
  "vnp_bank_code": "NCB"
}
```

**VNPAY Response Codes to Test:**
- `07`: Suspicious transaction
- `09`: Card not registered
- `10`: Incorrect card info
- `11`: Card expired
- `12`: Card locked
- `13`: Wrong OTP
- `51`: Insufficient balance
- `65`: Daily limit exceeded

**Expected Response:**
```json
{
  "success": false,
  "payment": {
    "status": "failed",
    "vnp_response_code": "13"
  },
  "subscription": null,
  "message": "Payment failed"
}
```

---

### Scenario 4: Get Payment by ID

**Request:**
```http
GET http://localhost:3000/payments/1
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "payment_id": 1,
  "user_id": 1,
  "package_id": 1,
  "subscription_id": 1,
  "amount": "100000.00",
  "status": "success",
  "user": { /* user info */ },
  "package": { /* package info */ },
  "subscription": { /* subscription info */ }
}
```

---

### Scenario 5: Get Payment by Transaction Reference

**Request:**
```http
GET http://localhost:3000/payments/txn/04141530
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### Scenario 6: Get User's Payment History

**Request:**
```http
GET http://localhost:3000/payments/user/1
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
[
  {
    "payment_id": 1,
    "amount": "100000.00",
    "status": "success",
    "payment_time": "2025-01-21T14:15:30.000Z",
    "package": { /* package info */ },
    "subscription": { /* subscription info */ }
  },
  {
    "payment_id": 2,
    "amount": "100000.00",
    "status": "cancelled",
    "payment_time": "2025-01-21T14:20:30.000Z"
  }
]
```

---

### Scenario 7: Get All Payments (Admin Only)

**Request:**
```http
GET http://localhost:3000/payments
Authorization: Bearer ADMIN_JWT_TOKEN
```

---

## 🔍 Verification Queries

### Check Payment in Database
```bash
# Using Prisma Studio
npx prisma studio

# Navigate to Payment table and verify:
- payment_id
- status (success/failed/cancelled)
- vnp_txn_ref (unique)
- subscription_id (if success)
```

### Check Subscription Created
```http
GET http://localhost:3000/subscriptions/user/1/active
Authorization: Bearer YOUR_JWT_TOKEN
```

**Should return:**
```json
[
  {
    "subscription_id": 1,
    "user_id": 1,
    "package_id": 1,
    "status": "active",
    "start_date": "2025-01-21T14:15:30.000Z",
    "end_date": "2025-02-20T14:15:30.000Z",
    "swap_used": 0
  }
]
```

---

## 📊 Test Flow Chart

```
1. Login để lấy JWT token
   ↓
2. Mock Payment Success (response_code: "00")
   ↓
3. Verify Payment created (status: success)
   ↓
4. Verify Subscription created (status: active)
   ↓
5. Mock Payment Cancelled (response_code: "24")
   ↓
6. Verify Payment cancelled (no subscription)
   ↓
7. Mock Payment Failed (response_code: "13")
   ↓
8. Verify Payment failed (no subscription)
   ↓
9. Get Payment History
   ↓
10. Verify all payments listed
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Unauthorized"
**Solution:** Check JWT token valid và role correct (driver/admin)
```bash
# Verify token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/auth/me
```

### Issue 2: "Package not found"
**Solution:** Verify package exists và active = true
```http
GET http://localhost:3000/battery-service-packages/1
```

### Issue 3: "User not found"
**Solution:** Check user_id exists
```http
GET http://localhost:3000/users/1
```

### Issue 4: Duplicate vnp_txn_ref
**Solution:** Wait 1 second giữa các test calls (vnp_txn_ref based on timestamp)

---

## 📝 Test Checklist

### Basic Functionality
- [ ] Mock payment success creates subscription
- [ ] Mock payment cancelled does not create subscription
- [ ] Mock payment failed does not create subscription
- [ ] Payment amount matches package price
- [ ] Subscription end_date calculated correctly

### Edge Cases
- [ ] Payment with inactive package (should fail)
- [ ] Payment with non-existent package (should fail)
- [ ] Payment with non-existent user (should fail)
- [ ] Payment without vehicle_id (should work)
- [ ] Multiple payments for same user

### Data Integrity
- [ ] vnp_txn_ref is unique
- [ ] Payment linked to subscription
- [ ] Transaction_id generated
- [ ] payment_time recorded
- [ ] All VNPAY fields saved

### Authorization
- [ ] Driver can create payment
- [ ] Admin can create payment
- [ ] Station staff cannot create payment
- [ ] Admin can view all payments
- [ ] Driver can only view own payments

### History & Queries
- [ ] Get payment by ID works
- [ ] Get payment by txn_ref works
- [ ] Get user payment history works
- [ ] Payment history sorted by created_at desc

---

## 🎨 Thunder Client Collection

Create a Thunder Client collection với test cases sau:

### Collection: Payment API Tests

#### 1. Login
```
POST {{baseUrl}}/auth/login
Body: {"email": "john@example.com", "password": "password123"}
Save: token = response.access_token
```

#### 2. Mock Payment Success
```
POST {{baseUrl}}/payments/mock-payment
Headers: Authorization: Bearer {{token}}
Body: {
  "user_id": 1,
  "package_id": 1,
  "vehicle_id": 1,
  "vnp_response_code": "00"
}
Tests:
- status === 200
- body.success === true
- body.subscription !== null
```

#### 3. Mock Payment Cancelled
```
POST {{baseUrl}}/payments/mock-payment
Headers: Authorization: Bearer {{token}}
Body: {
  "user_id": 1,
  "package_id": 1,
  "vnp_response_code": "24"
}
Tests:
- status === 200
- body.success === false
- body.subscription === null
```

#### 4. Get Payment History
```
GET {{baseUrl}}/payments/user/1
Headers: Authorization: Bearer {{token}}
Tests:
- status === 200
- body.length > 0
```

---

## 🚀 Quick Test Script

Tạo file `test-payments.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

# 1. Login
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. Test Success Payment
echo "\n--- Test 1: Payment Success ---"
curl -X POST $BASE_URL/payments/mock-payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "package_id": 1,
    "vehicle_id": 1,
    "vnp_response_code": "00"
  }' | jq

sleep 2

# 3. Test Cancelled Payment
echo "\n--- Test 2: Payment Cancelled ---"
curl -X POST $BASE_URL/payments/mock-payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "package_id": 1,
    "vnp_response_code": "24"
  }' | jq

sleep 2

# 4. Test Failed Payment
echo "\n--- Test 3: Payment Failed ---"
curl -X POST $BASE_URL/payments/mock-payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "package_id": 1,
    "vnp_response_code": "13"
  }' | jq

# 5. Get Payment History
echo "\n--- Test 4: Payment History ---"
curl -X GET $BASE_URL/payments/user/1 \
  -H "Authorization: Bearer $TOKEN" | jq
```

Chạy script:
```bash
chmod +x test-payments.sh
./test-payments.sh
```

---

## 📈 Expected Test Results

Sau khi chạy tất cả test cases, bạn sẽ có:

**Payments Table:**
```
| ID | User | Package | Status    | Amount | vnp_txn_ref | subscription_id |
|----|------|---------|-----------|--------|-------------|-----------------|
| 1  | 1    | 1       | success   | 100000 | 04141530    | 1               |
| 2  | 1    | 1       | cancelled | 100000 | 04141532    | null            |
| 3  | 1    | 1       | failed    | 100000 | 04141534    | null            |
```

**Subscriptions Table:**
```
| ID | User | Package | Status | Start Date | End Date   | swap_used |
|----|------|---------|--------|------------|------------|-----------|
| 1  | 1    | 1       | active | 2025-01-21 | 2025-02-20 | 0         |
```

---

## ✅ Success Criteria

Test được coi là pass khi:

1. ✅ Mock payment với response_code "00" tạo subscription
2. ✅ Mock payment với response_code "24" không tạo subscription
3. ✅ Mock payment với các code khác không tạo subscription
4. ✅ Payment history trả về đúng payments
5. ✅ Subscription end_date = start_date + duration_days
6. ✅ All VNPAY fields được save vào database
7. ✅ Authorization works correctly (driver/admin only)

---

## 🔄 Sau Khi Test Xong

Khi backend test pass, bạn có thể:

1. **Test Real VNPAY Flow:**
   - Get VNPAY sandbox credentials
   - Test `POST /payments/create-vnpay-url`
   - Open payment URL in browser
   - Use test card to pay

2. **Frontend Integration:**
   - Integrate with React/Vue/Angular
   - Create payment UI
   - Handle success/failed pages

3. **Production Deployment:**
   - Get production VNPAY credentials
   - Update environment variables
   - Enable HTTPS
   - Configure IPN URL

---

**Happy Testing! 🚀**
