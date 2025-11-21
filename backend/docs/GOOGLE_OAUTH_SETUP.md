# Google OAuth Setup Guide

## 1. Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo một project mới hoặc chọn project có sẵn
3. Enable Google+ API:
   - Vào "APIs & Services" > "Library"
   - Tìm "Google+ API" và enable nó

## 2. Tạo OAuth 2.0 Credentials

1. Vào "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Chọn "Web application"
4. Cấu hình:
   - **Name**: EV Battery Swap Station
   - **Authorized JavaScript origins**:
     ```
     http://localhost:8080
     http://localhost:3000
     http://localhost:5173
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:8080/api/v1/auth/google/callback
     ```
5. Lưu Client ID và Client Secret

## 3. Cấu hình Environment Variables

Thêm vào file `.env`:

```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:8080/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

## 4. API Endpoints

### Đăng nhập bằng Google
```
GET /api/v1/auth/google
```
Redirect user đến Google login page

### Google Callback
```
GET /api/v1/auth/google/callback
```
Xử lý response từ Google và redirect về frontend với access token

## 5. Frontend Integration

### Redirect đến Google Login
```typescript
window.location.href = 'http://localhost:8080/api/v1/auth/google';
```

### Xử lý callback
Sau khi Google redirect về, frontend sẽ nhận được:
```
http://localhost:3000/auth/callback?token=<access_token>
```

Lưu token vào localStorage hoặc state management:
```typescript
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
localStorage.setItem('accessToken', token);
```

## 6. Flow Diagram

```
User clicks "Login with Google"
    ↓
Frontend redirects to: GET /api/v1/auth/google
    ↓
Backend redirects to Google OAuth
    ↓
User logs in with Google
    ↓
Google redirects to: GET /api/v1/auth/google/callback
    ↓
Backend:
  - Validates Google user
  - Finds or creates user in database
  - Generates JWT tokens
  - Sets refresh token in cookie
  - Redirects to frontend with access token
    ↓
Frontend receives token and stores it
    ↓
User is authenticated!
```

## 7. Testing

1. Start backend: `npm run start:dev`
2. Navigate to: `http://localhost:8080/api/v1/auth/google`
3. Login with your Google account
4. Check if you're redirected back with a token

## 8. Security Notes

- ✅ Refresh token stored in httpOnly cookie
- ✅ Access token sent via URL (should be moved to secure storage immediately)
- ✅ CORS configured for allowed origins
- ⚠️  Make sure to use HTTPS in production
- ⚠️  Update callback URLs for production environment
