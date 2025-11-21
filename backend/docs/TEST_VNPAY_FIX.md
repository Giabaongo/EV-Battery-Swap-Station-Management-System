# Test VNPAY Payment Fix

## 🎯 Mục Đích
Test fix lỗi "Dữ liệu gửi sang không đúng định dạng" sau khi update code.

## 📋 Changes Made

### 1. Fixed `vnp_Amount` Type Issue
**Problem:** VNPAY expects string integer, code was sending number
**Fix:**
```typescript
// Before
const amount = servicePackage.base_price.toNumber() * 100;
vnp_Amount: amount // number type

// After  
const amount = Math.floor(servicePackage.base_price.toNumber() * 100);
vnp_Amount: amount.toString() // string integer
```

### 2. Added Validation Before Sending
**Created:** `src/payments/utils/vnpay.utils.ts`
**Functions:**
- `validateVNPayParams()` - Validates all 11 required fields
- `generateSecureHash()` - HMAC SHA512 signature
- `verifySecureHash()` - Verify callback signatures
- `sortObject()` - Sort params alphabetically
- `logVNPayParams()` - Debug logging

### 3. Updated Payment Service
**File:** `src/payments/payments.service.ts`
**Changes:**
- Import validation utilities
- Validate params before sending
- Add debug logging
- Return `debug_params` in response

## 🧪 Test Steps

### Step 1: Verify Server Running
Server should be running on port 8080:
```bash
# Check terminal for:
[Nest] INFO [NestApplication] Nest application successfully started
```

### Step 2: Test Create Payment URL

**Endpoint:** `POST http://localhost:8080/payments/create-vnpay-url`

**Request:**
```json
{
  "user_id": 4,
  "package_id": 1,
  "vehicle_id": 3,
  "orderDescription": "Thanh toan goi Basic Package",
  "language": "vn"
}
```

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Step 3: Check Console Logs

Terminal should show:
```
========== Payment URL Params ==========
Sorted parameters:
  vnp_Amount: 10000000         <-- ✅ STRING INTEGER
  vnp_Command: pay
  vnp_CreateDate: 20250121143045
  vnp_CurrCode: VND
  vnp_IpAddr: ::1
  vnp_Locale: vn
  vnp_OrderInfo: Thanh toan goi Basic Package
  vnp_OrderType: other
  vnp_ReturnUrl: http://localhost:8080/payments/vnpay-return
  vnp_TmnCode: IY1VW5JH       <-- ✅ CHECK THIS MATCHES .env
  vnp_TxnRef: 21143045
  vnp_Version: 2.1.0
Query string: vnp_Amount=10000000&vnp_Command=pay&...
========================================
```

**What to Check:**
- ✅ `vnp_Amount` is string (no quotes in URL, but should be "10000000" type)
- ✅ `vnp_TmnCode` matches your .env (IY1VW5JH for sandbox)
- ✅ All 11 required params present
- ✅ No validation errors

### Step 4: Check API Response

**Expected Response:**
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000000&...",
  "payment_id": 1,
  "vnp_txn_ref": "21143045",
  "debug_params": {
    "vnp_Amount": "10000000",           <-- ✅ STRING
    "vnp_Command": "pay",
    "vnp_CreateDate": "20250121143045",
    "vnp_CurrCode": "VND",
    "vnp_IpAddr": "::1",
    "vnp_Locale": "vn",
    "vnp_OrderInfo": "Thanh toan goi Basic Package",
    "vnp_OrderType": "other",
    "vnp_ReturnUrl": "http://localhost:8080/payments/vnpay-return",
    "vnp_SecureHash": "abc123...",      <-- ✅ HMAC SHA512
    "vnp_TmnCode": "IY1VW5JH",
    "vnp_TxnRef": "21143045",
    "vnp_Version": "2.1.0"
  }
}
```

**What to Check:**
- ✅ `debug_params.vnp_Amount` is string (type: "10000000")
- ✅ All params present in debug_params
- ✅ `vnp_SecureHash` is 128 chars (SHA512 hex)
- ✅ `paymentUrl` is valid URL

### Step 5: Click Payment URL

Copy `paymentUrl` from response and paste to browser.

**If Success:**
- VNPAY payment page loads
- Shows package info: "Thanh toan goi Basic Package"
- Shows amount: 100,000 VND (or your package price)
- Card input form visible

**If Still Error:**
1. Check console logs for validation errors
2. Compare `debug_params` với VNPAY docs
3. Verify .env credentials
4. Check VNPAY sandbox account status

### Step 6: Test Payment (Optional)

If VNPAY page loads, test with sandbox card:

**Test Card:**
```
Card Number: 9704198526191432198
Card Holder: NGUYEN VAN A
Issue Date: 07/15
OTP: 123456
```

**Expected Flow:**
1. Enter card info
2. Click "Thanh toán"
3. Enter OTP: 123456
4. Redirected to: `http://localhost:8080/payments/vnpay-return?vnp_Amount=...`
5. Check payment status: `GET /payments/:payment_id`
6. Check subscription created: `GET /subscriptions/user/4/active`

## ✅ Success Criteria

- [ ] Server starts without errors
- [ ] Console logs show all params correctly formatted
- [ ] `vnp_Amount` is string integer in logs
- [ ] API returns `debug_params` with correct types
- [ ] Clicking payment URL loads VNPAY page (no format error)
- [ ] Can complete test payment with sandbox card
- [ ] Subscription auto-created on payment success
- [ ] Payment record updated with VNPAY response

## ❌ If Still Error

### Error: "Dữ liệu gửi sang không đúng định dạng"

**Check:**
1. Console logs - any validation errors?
2. `debug_params.vnp_Amount` - is it string type?
3. `.env` file - TMN_CODE and HASH_SECRET correct?
4. VNPAY sandbox account - is it active?

**Debug Steps:**
```bash
# 1. Check .env
cat .env | grep VNP_

# 2. Check console logs
# Look for "VNPAY params validation failed"

# 3. Inspect debug_params
# Copy from API response
# Check each field type and format
```

### Error: "Chữ ký không hợp lệ"

**Means:** `vnp_SecureHash` wrong

**Check:**
1. `VNP_HASH_SECRET` in .env matches sandbox
2. Params sorted alphabetically before hashing
3. Using HMAC SHA512 (not SHA256)
4. Query string format: `key1=value1&key2=value2` (no encode)

### Error: "Merchant không tồn tại"

**Means:** `vnp_TmnCode` wrong

**Check:**
1. `VNP_TMN_CODE` in .env matches sandbox (IY1VW5JH)
2. VNPAY sandbox account active
3. No extra spaces in .env value

## 📊 Debug Checklist

**Environment:**
- [ ] `.env` file exists
- [ ] `VNP_TMN_CODE=IY1VW5JH`
- [ ] `VNP_HASH_SECRET=VZ2HBQQGJUK8KBZBS7Q0XQYZF9GWYYM9`
- [ ] `VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- [ ] `VNP_RETURN_URL=http://localhost:8080/payments/vnpay-return`

**Database:**
- [ ] Package id=1 exists and active
- [ ] User id=4 exists
- [ ] Vehicle id=3 exists and belongs to user

**Code:**
- [ ] `vnpay.utils.ts` created
- [ ] `payments.service.ts` updated with validation
- [ ] Server restarted after changes
- [ ] No TypeScript compilation errors

**Request:**
- [ ] JWT token valid
- [ ] user_id, package_id, vehicle_id correct
- [ ] orderDescription no special characters
- [ ] language is "vn" or "en"

## 📞 Support

If all checks pass but still error, collect:

**Console Logs:**
```
Copy full console output from:
========== Payment URL Params ==========
to
========================================
```

**API Response:**
```json
Copy full debug_params object
```

**Error Screenshot:**
Take screenshot of VNPAY error page

Then check `VNPAY_TROUBLESHOOTING.md` for more help.

---

## 🚀 Quick Test Command

**Thunder Client / Postman:**
```http
POST http://localhost:8080/payments/create-vnpay-url
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "user_id": 4,
  "package_id": 1,
  "vehicle_id": 3,
  "orderDescription": "Thanh toan goi Basic Package",
  "language": "vn"
}
```

**cURL:**
```bash
curl -X POST http://localhost:8080/payments/create-vnpay-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 4,
    "package_id": 1,
    "vehicle_id": 3,
    "orderDescription": "Thanh toan goi Basic Package",
    "language": "vn"
  }'
```

**Expected Result:** Payment URL that opens VNPAY sandbox page without error! 🎉
