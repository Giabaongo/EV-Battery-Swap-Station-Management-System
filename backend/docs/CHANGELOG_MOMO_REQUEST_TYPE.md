# ✅ Thay đổi: MoMo Renewal từ captureWallet sang payWithMethod

## 🎯 Vấn đề

**Trước đây:**
- API `/momo-subscription-renewal` dùng `requestType: 'captureWallet'`
- User vào **trực tiếp trang thanh toán QR code**
- Không có tùy chọn phương thức thanh toán

**Bây giờ:**
- API `/momo-subscription-renewal` dùng `requestType: 'payWithMethod'`  
- User vào **trang chọn phương thức thanh toán**
- Có thể chọn: Thẻ ATM, Visa/Mastercard, Ví MoMo, hoặc QR code

## 🔧 Thay đổi code

### File: `payments.service.ts`

**BEFORE (captureWallet - QR code direct):**
```typescript
// Line 1424
const rawSignature = `...&requestType=captureWallet`;

// Line 1441
const requestBody = {
  // ...
  requestType: 'captureWallet', // ← Direct to QR payment
  // ...
};
```

**AFTER (payWithMethod - Payment method selection):**
```typescript
// Line 1423
const requestType = momoConfig.requestType || 'payWithMethod';
const rawSignature = `...&requestType=${requestType}`;

// Line 1442
const requestBody = {
  // ...
  requestType: requestType, // ← Payment method selection page
  // ...
};
```

## 🎨 UX Flow

### Trước đây (captureWallet):
```
User click "Gia hạn" 
  → API tạo payment 
  → MoMo redirect 
  → QR Code payment screen ❌ (không có lựa chọn)
```

### Bây giờ (payWithMethod):
```
User click "Gia hạn" 
  → API tạo payment 
  → MoMo redirect 
  → Payment method selection screen ✅
     ├─ Thanh toán bằng thẻ ATM
     ├─ Thanh toán bằng Visa/Mastercard
     ├─ Thanh toán bằng Ví MoMo
     └─ Thanh toán bằng QR code
  → User chọn phương thức
  → Thanh toán
```

## 📊 So sánh MoMo Request Types

| Request Type | Behavior | Use Case |
|--------------|----------|----------|
| `captureWallet` | Direct to QR/Wallet payment | Fast checkout, mobile app |
| `payWithMethod` | Show payment method selection | More payment options, flexible UX |
| `payWithATM` | Direct to ATM card payment | ATM-only checkout |
| `payWithCC` | Direct to credit card payment | Credit card only |

## 🧪 Test

### Request (Same):
```bash
POST http://localhost:8080/api/v1/payments/momo-subscription-renewal
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "subscription_id": 1
}
```

### Response (Same):
```json
{
  "payment_id": 123,
  "paymentUrl": "https://test-payment.momo.vn/...",
  "vnp_txn_ref": "MOMO_RENEWAL_...",
  "feeBreakdown": { ... }
}
```

### Difference (User Experience):
```
Before: paymentUrl → QR Code Screen
After:  paymentUrl → Payment Method Selection → Choose → Pay
```

## 🎁 Lợi ích

1. ✅ **Nhiều tùy chọn thanh toán** - User chọn phương thức phù hợp
2. ✅ **UX tốt hơn** - Linh hoạt hơn captureWallet
3. ✅ **Giống calculate-and-create-momo-url** - Consistent UX
4. ✅ **Hỗ trợ thẻ quốc tế** - Visa/Mastercard
5. ✅ **Tương thích mobile** - Ví MoMo app integration

## 📝 Files đã sửa

1. ✅ `payments.service.ts` - Changed requestType logic
2. ✅ `MOMO_SUBSCRIPTION_RENEWAL_API.md` - Updated docs

## ⚙️ Configuration

Có thể override bằng env variable:

```env
# .env file
MOMO_REQUEST_TYPE=payWithMethod  # Default (recommended)
# hoặc
MOMO_REQUEST_TYPE=captureWallet  # QR direct
# hoặc
MOMO_REQUEST_TYPE=payWithATM     # ATM only
```

Code sẽ tự động đọc:
```typescript
const requestType = momoConfig.requestType || 'payWithMethod';
```

## 🔄 Rollback

Nếu cần quay về captureWallet:

**Option 1: Code change**
```typescript
const requestType = 'captureWallet'; // Force captureWallet
```

**Option 2: Env variable**
```env
MOMO_REQUEST_TYPE=captureWallet
```

## ✅ Done!

API renewal giờ mở **trang chọn phương thức thanh toán** thay vì QR code trực tiếp! 🎉
