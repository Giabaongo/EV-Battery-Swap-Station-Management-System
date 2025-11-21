# So sánh các MoMo Payment APIs

## 📌 Tổng quan

Backend có **3 loại MoMo payment endpoints** với response format khác nhau:

| Endpoint | Response Format | Use Case |
|----------|-----------------|----------|
| `/calculate-and-create-momo-url` | `paymentUrl` | Subscription đầu tiên (có tính phí) |
| `/momo-subscription-renewal` | `paymentUrl` | Gia hạn subscription (có phí phạt) |
| `/create-momo-url` | `payUrl`, `deeplink`, `qrCodeUrl` | Legacy (backward compatibility) |

---

## 1️⃣ Standard Format (Recommended)

### Endpoints sử dụng format này:
- ✅ `POST /payments/calculate-and-create-momo-url`
- ✅ `POST /payments/momo-subscription-renewal`

### Response Structure:

```json
{
  "payment_id": 123,
  "paymentUrl": "https://test-payment.momo.vn/v2/gateway/pay?t=...",
  "vnp_txn_ref": "MOMO_ORDER_20250121123456",
  "feeBreakdown": {
    "baseAmount": 200000,
    "depositFee": 0,
    "overchargeFee": 0,
    "damageFee": 50000,
    "totalAmount": 250000,
    "breakdown_text": "..."
  },
  "paymentInfo": {
    "user_id": 7,
    "package_id": 1,
    "vehicle_id": 6,
    "payment_type": "subscription",
    "status": "pending",
    "created_at": "2025-01-21T12:34:56.000Z"
  }
}
```

### Cách sử dụng:

```javascript
// Frontend code
const response = await fetch('/api/v1/payments/momo-subscription-renewal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ subscription_id: 1 })
});

const data = await response.json();

// Redirect to payment page
window.location.href = data.paymentUrl; // ← Single URL field
```

### Ưu điểm:
- ✅ Đơn giản, chỉ 1 URL field
- ✅ Consistent với VNPAY format
- ✅ Dễ maintain và test
- ✅ Response size nhỏ hơn

---

## 2️⃣ Legacy Format (Old)

### Endpoints sử dụng format này:
- ⚠️ `POST /payments/create-momo-url` (deprecated, keep for backward compatibility)

### Response Structure:

```json
{
  "payment_id": 123,
  "payUrl": "https://test-payment.momo.vn/v2/gateway/pay?t=...",
  "deeplink": "momo://app.momo.vn/...",
  "qrCodeUrl": "https://test-payment.momo.vn/qr/...",
  "feeBreakdown": { ... },
  "paymentInfo": { ... }
}
```

### Cách sử dụng:

```javascript
const data = await response.json();

// Multiple URL options (unnecessary complexity)
if (isMobileApp) {
  window.location.href = data.deeplink; // Mobile app
} else if (isQRCodeScanner) {
  showQRCode(data.qrCodeUrl); // QR code
} else {
  window.location.href = data.payUrl; // Web browser
}
```

### Nhược điểm:
- ❌ Phức tạp với 3 URL fields
- ❌ Không cần thiết (web và mobile đều dùng được `payUrl`)
- ❌ Response size lớn hơn
- ❌ Khó maintain

---

## 🎯 Migration Guide

### Nếu bạn đang dùng Legacy Format:

**BEFORE:**
```javascript
// Old code (deprecated)
const response = await fetch('/api/v1/payments/create-momo-url', {
  method: 'POST',
  body: JSON.stringify({
    user_id: 1,
    package_id: 1,
    vehicle_id: 1
  })
});

const data = await response.json();
window.location.href = data.payUrl; // ← Old field name
```

**AFTER:**
```javascript
// New code (recommended)
const response = await fetch('/api/v1/payments/calculate-and-create-momo-url', {
  method: 'POST',
  body: JSON.stringify({
    user_id: 1,
    package_id: 1,
    vehicle_id: 1,
    payment_type: 'subscription'
  })
});

const data = await response.json();
window.location.href = data.paymentUrl; // ← New field name (consistent)
```

---

## 📋 Quick Reference

### API Comparison Table

| Aspect | Standard Format | Legacy Format |
|--------|-----------------|---------------|
| **URL field** | `paymentUrl` | `payUrl`, `deeplink`, `qrCodeUrl` |
| **Transaction ID field** | `vnp_txn_ref` | `orderId`, `requestId` |
| **Response size** | Smaller | Larger |
| **Consistency** | Same as VNPAY | Different |
| **Recommended** | ✅ Yes | ❌ No (deprecated) |

### Field Mapping

| Standard Format | Legacy Format | Note |
|-----------------|---------------|------|
| `paymentUrl` | `payUrl` | Use this for web/mobile redirect |
| - | `deeplink` | Not needed (payUrl works for mobile) |
| - | `qrCodeUrl` | Not needed (QR code at payment page) |
| `vnp_txn_ref` | `orderId` | Transaction reference ID |

---

## 💡 Best Practices

1. **Sử dụng Standard Format** cho tất cả code mới:
   ```javascript
   // ✅ Good
   window.location.href = data.paymentUrl;
   
   // ❌ Bad
   window.location.href = data.payUrl;
   ```

2. **Xử lý cả 2 formats** cho backward compatibility:
   ```javascript
   // Support both old and new code
   const paymentUrl = data.paymentUrl || data.payUrl;
   window.location.href = paymentUrl;
   ```

3. **Migrate dần sang Standard Format**:
   - Các tính năng mới: Dùng Standard Format
   - Code cũ: Giữ nguyên hoặc migrate khi có thời gian

---

## 🧪 Testing Examples

### Test Standard Format:

```bash
# Renewal payment (Standard Format)
POST http://localhost:8080/api/v1/payments/momo-subscription-renewal
Content-Type: application/json

{
  "subscription_id": 1
}

# Response
{
  "payment_id": 123,
  "paymentUrl": "https://...",  # ← Single URL
  "vnp_txn_ref": "MOMO_RENEWAL_...",
  "feeBreakdown": { ... }
}
```

### Test Legacy Format:

```bash
# Basic payment (Legacy Format)
POST http://localhost:8080/api/v1/payments/create-momo-url
Content-Type: application/json

{
  "user_id": 1,
  "package_id": 1,
  "vehicle_id": 1
}

# Response
{
  "payment_id": 123,
  "payUrl": "https://...",      # ← Multiple URLs
  "deeplink": "momo://...",
  "qrCodeUrl": "https://..."
}
```

---

## ✅ Summary

**TL;DR:**

- 🎯 **Standard Format** (`paymentUrl`) = Modern, clean, recommended
- ⚠️ **Legacy Format** (`payUrl`) = Old, complex, deprecated
- 🔄 Migrate từ từ sang Standard Format khi có thể
- 📦 Backend support cả 2 formats để backward compatible

**Khi nào dùng gì:**

| Scenario | Endpoint | Response Format |
|----------|----------|-----------------|
| Subscription đầu tiên | `/calculate-and-create-momo-url` | Standard (`paymentUrl`) |
| Gia hạn subscription | `/momo-subscription-renewal` | Standard (`paymentUrl`) |
| Code cũ (đã tồn tại) | `/create-momo-url` | Legacy (`payUrl`) |

---

## 🚀 Next Steps

1. ✅ Đọc hiểu sự khác biệt giữa 2 formats
2. ✅ Dùng Standard Format cho code mới
3. ✅ Test cả 2 formats để ensure backward compatibility
4. ⏳ Migrate code cũ sang Standard Format (optional, không gấp)
