# VNPAY Payment Troubleshooting Guide

## 🔴 Lỗi: "Dữ liệu gửi sang không đúng định dạng"

### Nguyên Nhân Thường Gặp

#### 1. **vnp_Amount không đúng format**
```javascript
// ❌ SAI - Số thập phân
vnp_Amount: 10000000.50

// ❌ SAI - String có dấu phẩy
vnp_Amount: "10,000,000"

// ✅ ĐÚNG - String số nguyên (VND cents)
vnp_Amount: "1000000000" // = 10,000,000 VND * 100
```

**Fix trong code:**
```typescript
const amount = Math.floor(servicePackage.base_price.toNumber() * 100);
vnp_Amount: amount.toString() // Convert to string integer
```

#### 2. **vnp_TmnCode hoặc vnp_HashSecret sai**
```bash
# Check .env file
VNP_TMN_CODE=IY1VW5JH  # Must match VNPAY sandbox
VNP_HASH_SECRET=VZ2HBQQGJUK8KBZBS7Q0XQYZF9GWYYM9  # Must match
```

**Kiểm tra:**
```bash
# In terminal logs, bạn sẽ thấy:
========== Payment URL Params ==========
Sorted parameters:
  vnp_TmnCode: IY1VW5JH
  ...
```

#### 3. **Thiếu required parameters**
VNPAY yêu cầu các field sau:
- `vnp_Version` = "2.1.0"
- `vnp_Command` = "pay"
- `vnp_TmnCode`
- `vnp_Amount` (string integer)
- `vnp_CreateDate` (YYYYMMDDHHmmss format)
- `vnp_CurrCode` = "VND"
- `vnp_IpAddr`
- `vnp_Locale` ("vn" or "en")
- `vnp_OrderInfo`
- `vnp_ReturnUrl`
- `vnp_TxnRef`
- `vnp_SecureHash`

#### 4. **vnp_OrderInfo có ký tự đặc biệt**
```javascript
// ❌ SAI - Có ký tự đặc biệt
vnp_OrderInfo: "Thanh toán #123 @user"

// ✅ ĐÚNG - Chỉ chữ, số, space
vnp_OrderInfo: "Thanh toan goi Basic Package"
```

#### 5. **Signature (vnp_SecureHash) không đúng**
- Params phải sort theo alphabet trước khi hash
- Dùng HMAC SHA512
- Secret key phải đúng

### 🔧 Cách Debug

#### Step 1: Check Console Logs
Khi call API, check terminal logs:
```
========== Payment URL Params ==========
Sorted parameters:
  vnp_Amount: 10000000
  vnp_Command: pay
  vnp_CreateDate: 20250121143045
  vnp_CurrCode: VND
  vnp_IpAddr: 127.0.0.1
  vnp_Locale: vn
  vnp_OrderInfo: Thanh toan goi Basic Package
  vnp_OrderType: other
  vnp_ReturnUrl: http://localhost:8080/payments/vnpay-return
  vnp_TmnCode: IY1VW5JH
  vnp_TxnRef: 21143045
  vnp_Version: 2.1.0
Query string: vnp_Amount=10000000&vnp_Command=pay&...
========================================
```

#### Step 2: Check API Response
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=...",
  "payment_id": 1,
  "vnp_txn_ref": "21143045",
  "debug_params": {
    "vnp_Amount": "10000000",
    "vnp_TmnCode": "IY1VW5JH",
    ...
  }
}
```

#### Step 3: Copy & Inspect Payment URL
```bash
# Copy paymentUrl từ response
# Paste vào browser và check URL có đúng format không

# Example correct URL:
https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000000&vnp_Command=pay&...&vnp_SecureHash=abc123...
```

#### Step 4: Validate Each Parameter
```typescript
// Sử dụng validateVNPayParams utility
const validation = validateVNPayParams(vnpParams);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### ✅ Checklist Trước Khi Test

- [ ] `.env` file có đầy đủ VNPAY credentials
- [ ] `VNP_TMN_CODE` đúng với sandbox account
- [ ] `VNP_HASH_SECRET` đúng với sandbox account
- [ ] `VNP_RETURN_URL` accessible (localhost OK for testing)
- [ ] Package exists và active trong database
- [ ] User exists trong database
- [ ] Server running (`npm run start:dev`)

### 🧪 Test Request Example

**Correct Request:**
```bash
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

**Expected Response:**
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "payment_id": 1,
  "vnp_txn_ref": "21143045",
  "debug_params": {
    "vnp_Amount": "10000000",
    "vnp_Command": "pay",
    "vnp_CreateDate": "20250121143045",
    "vnp_CurrCode": "VND",
    "vnp_IpAddr": "::1",
    "vnp_Locale": "vn",
    "vnp_OrderInfo": "Thanh toan goi Basic Package",
    "vnp_OrderType": "other",
    "vnp_ReturnUrl": "http://localhost:8080/payments/vnpay-return",
    "vnp_SecureHash": "abc123...",
    "vnp_TmnCode": "IY1VW5JH",
    "vnp_TxnRef": "21143045",
    "vnp_Version": "2.1.0"
  }
}
```

### 🔍 Common Mistakes

#### Mistake 1: Amount calculation sai
```typescript
// ❌ SAI
const amount = servicePackage.base_price.toNumber() * 100;
vnp_Amount: amount // Có thể là 10000000.50

// ✅ ĐÚNG
const amount = Math.floor(servicePackage.base_price.toNumber() * 100);
vnp_Amount: amount.toString() // "10000000"
```

#### Mistake 2: Không sort params trước khi sign
```typescript
// ❌ SAI
const signData = qs.stringify(vnpParams, { encode: false });

// ✅ ĐÚNG
const sortedParams = sortObject(vnpParams);
const signData = qs.stringify(sortedParams, { encode: false });
```

#### Mistake 3: Dùng wrong secret key
```typescript
// ❌ SAI
const hmac = crypto.createHmac('sha512', 'WRONG_SECRET');

// ✅ ĐÚNG
const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
```

#### Mistake 4: OrderInfo có ký tự đặc biệt
```typescript
// ❌ SAI
orderDescription: "Thanh toán #1234 @user!"

// ✅ ĐÚNG
orderDescription: "Thanh toan don hang 1234"
```

### 🆘 Nếu Vẫn Lỗi

#### 1. Check VNPAY Sandbox Status
- Login https://sandbox.vnpayment.vn/
- Verify TMN_CODE và HASH_SECRET
- Check account active

#### 2. Test với VNPAY Sample Code
```bash
# Download VNPAY sample từ sandbox portal
# Run sample code với credentials của bạn
# Nếu sample work mà code của bạn không work -> compare parameters
```

#### 3. Compare Parameters
```typescript
// Log tất cả params
console.log('=== VNPAY Params ===');
console.log(JSON.stringify(vnpParams, null, 2));

// Compare với VNPAY docs
// https://sandbox.vnpayment.vn/apis/docs/
```

#### 4. Contact Support
Nếu tất cả đều đúng nhưng vẫn lỗi:
- Email: support@vnpay.vn
- Cung cấp: TMN_CODE, timestamp, error message
- KHÔNG gửi HASH_SECRET!

### 📚 Reference

**VNPAY Sandbox:**
- URL: https://sandbox.vnpayment.vn/
- Docs: https://sandbox.vnpayment.vn/apis/docs/
- Test cards: In docs section

**Parameter Format:**
- `vnp_Amount`: String integer (VND * 100)
- `vnp_CreateDate`: YYYYMMDDHHmmss (e.g., "20250121143045")
- `vnp_TxnRef`: Max 100 chars, alphanumeric only
- `vnp_OrderInfo`: Max 255 chars, no special chars
- `vnp_SecureHash`: HMAC SHA512 lowercase hex

**Common Error Codes:**
- "Dữ liệu gửi sang không đúng định dạng": Invalid parameters
- "Signature không hợp lệ": Wrong secret key or signature
- "Merchant không tồn tại": Wrong TMN_CODE
- "URL Return không hợp lệ": ReturnUrl format issue

---

## ✅ Fixed in Latest Version

Các fix đã được implement:

1. ✅ `vnp_Amount` converted to string integer
2. ✅ `Math.floor()` to ensure integer
3. ✅ Parameter validation before sending
4. ✅ Logging for debugging
5. ✅ Utils functions for consistent formatting
6. ✅ Sorted params before signing

**Bây giờ test lại và check console logs!** 🚀
