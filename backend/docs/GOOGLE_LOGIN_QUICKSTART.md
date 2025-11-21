# Google Login Implementation

## Quick Start

### 1. Install Dependencies
```bash
npm install @nestjs/passport passport passport-google-oauth20 @types/passport-google-oauth20
```

### 2. Setup Google OAuth
Follow [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) to get credentials

### 3. Configure Environment
Add to `.env`:
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8080/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

### 4. API Endpoints

#### Login with Google
```
GET /api/v1/auth/google
```

#### Google Callback (handled automatically)
```
GET /api/v1/auth/google/callback
```

### 5. Frontend Example

```typescript
// Redirect to Google login
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:8080/api/v1/auth/google';
};

// Handle callback (in your /auth/callback route)
const handleCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    localStorage.setItem('accessToken', token);
    // Redirect to dashboard or home
    navigate('/dashboard');
  }
};
```

### 6. User Data

When user logs in with Google:
- Email is used as identifier
- Username is set to "FirstName LastName"
- Phone is set to `GOOGLE_<timestamp>` (user can update later)
- Password is empty (Google OAuth only)
- Default role: `driver`

### 7. Response Format

After successful login, user is redirected to:
```
http://localhost:3000/auth/callback?token=<jwt_access_token>
```

The response includes:
- `accessToken`: JWT token for API requests
- `refreshToken`: Stored in httpOnly cookie
- User info embedded in token payload

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend    │────▶│   Google    │
└─────────────┘     └──────────────┘     └─────────────┘
      ▲                    │                     │
      │                    │                     │
      └────────────────────┴─────────────────────┘
           Redirects with token
```

## Files Structure

```
src/modules/auth/
├── strategies/
│   └── google.strategy.ts       # Google OAuth strategy
├── guards/
│   ├── auth.guard.ts            # JWT auth guard
│   └── google-auth.guard.ts     # Google auth guard
├── auth.controller.ts           # Auth endpoints
├── auth.service.ts              # Auth business logic
└── auth.module.ts               # Auth module config

src/modules/users/
└── users.service.ts             # User management + Google user creation
```

## Testing

```bash
# Start server
npm run start:dev

# Open browser and navigate to:
http://localhost:8080/api/v1/auth/google
```

## Notes

- Users created via Google login have empty password (cannot login with email/password)
- Google users can later set password if needed (implement password reset)
- Phone number is auto-generated and should be updated by user
- Refresh token is stored in httpOnly cookie for security
