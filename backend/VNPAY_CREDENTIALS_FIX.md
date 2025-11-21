# 🔧 VNPAY Credentials Fix - Lỗi "Sai Chữ Ký" (Code 70)

## ❌ Vấn Đề
Bạn đang dùng credentials KHÔNG HỢP LỆ:
```
VNP_TMN_CODE=IY1VW5JH
VNP_HASH_SECRET=ACDJ12QW9986YOEIXHAK5KKNSH35QDAJ
```

Đây KHÔNG PHẢI credentials chính thức từ VNPAY sandbox!

## ✅ Giải Pháp

### 1. Update File `.env`

Mở file `.env` và thay đổi:

```bash
# VNPAY Configuration (Sandbox)
# Official VNPAY Sandbox PUBLIC test credentials
VNP_TMN_CODE=DEMOJAVA
VNP_HASH_SECRET=IXWLZEXAQCXLNQDZDMGJZZNUPESDBXWX
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:8080/payments/vnpay-return
```

### 2. Restart Server

```bash
# Dừng server hiện tại (Ctrl+C)
# Khởi động lại
npm run start:dev
```

### 3. Test Lại API

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

### 4. Verify Console Logs

Bạn sẽ thấy:
```
Using HASH_SECRET: IXWLZEXAQC...
TMN_CODE: DEMOJAVA
```

### 5. Click Payment URL

URL sẽ load VNPAY sandbox page KHÔNG LỖI!

## 📝 Về Credentials

### Public Test Credentials (VNPAY Official)

**TMN_CODE:** `DEMOJAVA`
**HASH_SECRET:** `IXWLZEXAQCXLNQDZDMGJZZNUPESDBXWX`

Đây là credentials PUBLIC từ VNPAY để test integration. Source:
- https://sandbox.vnpayment.vn/apis/vnpay-demo/
- https://sandbox.vnpayment.vn/apis/docs/

### Test Card

**Card Number:** 9704198526191432198
**Card Holder:** NGUYEN VAN A
**Issue Date:** 07/15
**OTP:** 123456

## 🎯 Expected Result

Sau khi update credentials:

✅ Payment URL không lỗi "Sai chữ ký"
✅ VNPAY page load với form thanh toán
✅ Có thể nhập thẻ test và hoàn tất thanh toán
✅ Callback về return URL thành công
✅ Subscription được tạo tự động

## 🔍 Troubleshooting

### Nếu vẫn lỗi:

1. **Check file `.env` tồn tại**
   ```bash
   ls .env
   ```

2. **Verify credentials trong .env**
   ```bash
   cat .env | grep VNP_
   ```

3. **Restart server HOÀN TOÀN**
   - Stop server (Ctrl+C)
   - Clear terminal
   - Run `npm run start:dev` lại

4. **Check console logs**
   - TMN_CODE phải là `DEMOJAVA`
   - HASH_SECRET phải bắt đầu với `IXWLZEXAQC...`

## 📚 Reference

- VNPAY Sandbox: https://sandbox.vnpayment.vn/
- VNPAY Docs: https://sandbox.vnpayment.vn/apis/docs/
- Demo Code: https://sandbox.vnpayment.vn/apis/vnpay-demo/

---

**Lưu ý**: Credentials này CHỈ dùng cho SANDBOX testing. Khi deploy production, bạn cần đăng ký VNPAY merchant thật và dùng credentials production.
