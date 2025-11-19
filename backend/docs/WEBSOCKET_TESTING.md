# WebSocket Backend Testing Guide

## Overview

This guide explains how to test the WebSocket real-time notification system for support tickets on the backend.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket System                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Driver creates ticket                                       │
│         │                                                     │
│         ▼                                                     │
│  POST /api/v1/support                                        │
│         │                                                     │
│         ▼                                                     │
│  SupportsService.create()                                    │
│         │                                                     │
│         ├─── Create ticket in DB                            │
│         │                                                     │
│         └─── WebsocketService.notifyAdminsNewSupportTicket() │
│                      │                                        │
│                      ▼                                        │
│              WebsocketGateway.sendToAdmins()                 │
│                      │                                        │
│                      ▼                                        │
│              Event: 'support:ticket:created'                 │
│                      │                                        │
│                      ▼                                        │
│              All connected admins receive notification       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## WebSocket Events

| Event | Direction | Trigger | Payload |
|-------|-----------|---------|---------|
| `support:ticket:created` | Server → Admins | Driver creates ticket | New ticket details |
| `support:ticket:updated` | Server → User | Admin updates ticket | Updated ticket details |
| `support:ticket:resolved` | Server → User | Ticket status = closed | Resolved ticket details |
| `support:ticket:deleted` | Server → User | Admin deletes ticket | Ticket ID |

## Prerequisites

### 1. Backend Server Running

```bash
cd backend
npm run start:dev
```

Server should be running on `http://localhost:8080`

### 2. Install Test Dependencies

```bash
npm install socket.io-client node-fetch
```

### 3. Get JWT Tokens

You need valid JWT tokens for both a **driver** and an **admin** user.

#### Method 1: Login via API

**Get Driver Token:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "your-password"
  }'
```

**Get Admin Token:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

Save the `access_token` from each response.

#### Method 2: Use Existing Tokens

If you have a frontend or Postman collection, get tokens from there.

### 4. Update Test Script Configuration

Open `backend/test-websocket.js` and update:

```javascript
const DRIVER_TOKEN = 'eyJhbGc...'; // Your driver JWT token
const ADMIN_TOKEN = 'eyJhbGc...';  // Your admin JWT token

const TEST_USER_ID = 1;      // Valid user_id (driver)
const TEST_STATION_ID = 1;   // Valid station_id
```

## Running the Test

### Method 1: Using the Test Script (Recommended)

```bash
cd backend
node test-websocket.js
```

### Expected Output

```
[2025-01-12T10:30:00.000Z] TEST: 🚀 Starting WebSocket test...
[2025-01-12T10:30:00.100Z] STEP 1: Connecting as driver...
[2025-01-12T10:30:00.200Z] DRIVER: ✅ Connected successfully
{
  "message": "Successfully connected",
  "userId": 1,
  "role": "driver"
}
[2025-01-12T10:30:00.300Z] STEP 2: Connecting as admin...
[2025-01-12T10:30:00.400Z] ADMIN: ✅ Connected successfully
{
  "message": "Successfully connected",
  "userId": 2,
  "role": "admin"
}
[2025-01-12T10:30:00.500Z] STEP 3: Setting up event listeners...
[2025-01-12T10:30:01.500Z] STEP 4: Creating support ticket via API...
[2025-01-12T10:30:01.700Z] API: ✅ Support ticket created
{
  "support_id": 123,
  "user_id": 1,
  "description": "WebSocket test ticket - Battery swap machine not working",
  "status": "open",
  ...
}
[2025-01-12T10:30:01.800Z] ADMIN: ✅ Received new ticket notification
{
  "type": "support_ticket_created",
  "title": "New Support Ticket",
  "message": "User john_driver created a new support ticket",
  "data": {
    "support_id": 123,
    "user_id": 1,
    "username": "john_driver",
    ...
  },
  "priority": "high",
  "timestamp": "2025-01-12T10:30:01.800Z"
}
[2025-01-12T10:30:03.700Z] STEP 5: Updating support ticket via API...
[2025-01-12T10:30:03.900Z] API: ✅ Support ticket updated
[2025-01-12T10:30:04.000Z] DRIVER: ✅ Received ticket update notification
{
  "type": "support_ticket_updated",
  "title": "Support Ticket Updated",
  "message": "Your support ticket has been updated",
  "data": {
    "support_id": 123,
    "status": "in_progress",
    ...
  },
  "priority": "medium",
  "timestamp": "2025-01-12T10:30:04.000Z"
}
[2025-01-12T10:30:05.900Z] STEP 6: Resolving support ticket via API...
[2025-01-12T10:30:06.100Z] API: ✅ Support ticket resolved
[2025-01-12T10:30:06.200Z] DRIVER: ✅ Received ticket resolved notification
{
  "type": "support_ticket_resolved",
  "title": "Support Ticket Resolved",
  "message": "Your support ticket has been resolved",
  ...
}
[2025-01-12T10:30:08.100Z] STEP 7: Deleting support ticket via API...
[2025-01-12T10:30:08.300Z] API: ✅ Support ticket deleted
[2025-01-12T10:30:08.400Z] DRIVER: ✅ Received ticket deleted notification
{
  "type": "support_ticket_deleted",
  "title": "Support Ticket Deleted",
  "message": "Your support ticket #123 has been deleted",
  ...
}
[2025-01-12T10:30:10.400Z] RESULTS: 📊 Test Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Driver Connected:         ✅
Admin Connected:          ✅
Admin Received Create:    ✅
User Received Update:     ✅
User Received Resolved:   ✅
User Received Deleted:    ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2025-01-12T10:30:10.400Z] SUCCESS: 🎉 All tests passed!
```

### Method 2: Manual Testing with Socket.IO Client

If you prefer manual testing, you can use a WebSocket client.

#### Install Socket.IO Client Globally

```bash
npm install -g wscat socket.io-client
```

#### Create a Simple Test Client

Create `test-manual.js`:

```javascript
const { io } = require('socket.io-client');

const WS_URL = 'http://localhost:8080/notifications';
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Driver or admin token

const socket = io(WS_URL, {
  auth: { token: TOKEN }
});

socket.on('connected', (data) => {
  console.log('✅ Connected:', data);
});

socket.on('support:ticket:created', (notification) => {
  console.log('📩 New ticket:', notification);
});

socket.on('support:ticket:updated', (notification) => {
  console.log('📩 Ticket updated:', notification);
});

socket.on('support:ticket:resolved', (notification) => {
  console.log('📩 Ticket resolved:', notification);
});

socket.on('support:ticket:deleted', (notification) => {
  console.log('📩 Ticket deleted:', notification);
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
});

console.log('Listening for notifications... (Press Ctrl+C to exit)');
```

Run it:

```bash
node test-manual.js
```

Then trigger events via API (Postman, curl, etc.)

## Troubleshooting

### Issue: "Authentication required" Error

**Symptom:**
```
DRIVER: ❌ Connection error
{ message: 'Authentication required' }
```

**Solution:**
- Check that your JWT token is valid and not expired
- Verify the token is being sent correctly in `auth.token`
- Try getting a fresh token by logging in again

### Issue: Connection Timeout

**Symptom:**
```
DRIVER: ❌ Connect error: timeout
```

**Solution:**
- Verify backend server is running on port 8080
- Check that WebsocketModule is registered in app.module.ts
- Look at backend console logs for errors

### Issue: No Notifications Received

**Symptom:**
- Connections work, but no notifications arrive

**Solution:**

1. **Check backend logs** - You should see:
   ```
   [WebsocketGateway] New connection: userId=1, role=driver
   [WebsocketGateway] User 1 is now connected with socket xxx
   [WebsocketGateway] Sending event support:ticket:created to all admins
   ```

2. **Verify user role** - Admin notifications only go to users with role='admin'

3. **Check user_id** - User notifications go to specific user_id, make sure it matches

4. **Verify WebsocketService injection** - Check that supports.service.ts has:
   ```typescript
   constructor(
     private prisma: DatabaseService,
     private websocketService: WebsocketService,
   ) {}
   ```

### Issue: "User not found" or "Station not found"

**Symptom:**
```
API: ❌ Failed to create ticket: {"statusCode":404,"message":"User not found"}
```

**Solution:**
- Update `TEST_USER_ID` and `TEST_STATION_ID` in test script
- Verify these IDs exist in your database:
  ```sql
  SELECT user_id FROM users WHERE user_id = 1;
  SELECT station_id FROM stations WHERE station_id = 1;
  ```

## Checking Server Logs

While running tests, monitor backend logs to see WebSocket events:

```bash
cd backend
npm run start:dev
```

You should see logs like:

```
[WebsocketGateway] New connection: userId=1, role=driver, socketId=abc123
[WebsocketGateway] User 1 is now connected with socket abc123
[WebsocketGateway] Admin socket added: abc123
[WebsocketGateway] Sending event support:ticket:created to 2 admin(s)
[WebsocketGateway] Event support:ticket:created sent to socket abc123
[WebsocketGateway] Sending event support:ticket:updated to user 1
[WebsocketGateway] Event sent successfully to user 1
```

## Testing with Multiple Clients

To test with multiple admins or drivers:

1. **Open multiple terminals**
2. **Run test-manual.js in each** with different tokens
3. **Create a ticket** via API
4. **Verify all admins** receive the notification

Example:

```bash
# Terminal 1 - Admin 1
TOKEN=admin1_token node test-manual.js

# Terminal 2 - Admin 2
TOKEN=admin2_token node test-manual.js

# Terminal 3 - Driver
TOKEN=driver_token node test-manual.js

# Terminal 4 - Create ticket via curl
curl -X POST http://localhost:8080/api/v1/support \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d '{
    "user_id": 1,
    "description": "Test notification",
    "station_id": 1
  }'
```

Both admin terminals should show the notification immediately.

## API Endpoints Used

### 1. Create Support Ticket
```http
POST /api/v1/support
Content-Type: application/json
Authorization: Bearer {driver_token}

{
  "user_id": 1,
  "description": "Battery swap machine not working",
  "station_id": 1
}
```

**Triggers:** `support:ticket:created` event to all admins

### 2. Update Support Ticket
```http
PATCH /api/v1/support/{support_id}
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "status": "in_progress"
}
```

**Triggers:** `support:ticket:updated` event to the user who created the ticket

### 3. Resolve Support Ticket
```http
PATCH /api/v1/support/{support_id}
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "status": "closed"
}
```

**Triggers:** `support:ticket:resolved` event to the user

### 4. Delete Support Ticket
```http
DELETE /api/v1/support/{support_id}
Authorization: Bearer {admin_token}
```

**Triggers:** `support:ticket:deleted` event to the user

## WebSocket Connection Details

### Connection URL
```
ws://localhost:8080/notifications
```

### Authentication

**Method 1: Auth object**
```javascript
const socket = io('http://localhost:8080/notifications', {
  auth: {
    token: 'eyJhbGc...'
  }
});
```

**Method 2: Authorization header**
```javascript
const socket = io('http://localhost:8080/notifications', {
  extraHeaders: {
    Authorization: 'Bearer eyJhbGc...'
  }
});
```

### Connection Events

| Event | Description |
|-------|-------------|
| `connected` | Sent when successfully connected and authenticated |
| `error` | Sent when authentication fails or other errors |
| `disconnect` | Sent when connection is lost |

### Notification Payload Structure

```typescript
{
  type: string;              // e.g., "support_ticket_created"
  title: string;             // e.g., "New Support Ticket"
  message: string;           // e.g., "User john created a new ticket"
  data: {                    // Ticket details
    support_id: number;
    user_id: number;
    username: string;
    description: string;
    status: string;
    station_id: number;
    station_name: string;
    created_at: Date;
  };
  priority: string;          // "low" | "medium" | "high" | "urgent"
  timestamp: Date;           // Auto-generated
}
```

## Next Steps

After verifying backend WebSocket works:

1. **Frontend Integration** - Connect React/Vue frontend to WebSocket
2. **Add More Events** - Implement payment, subscription, battery notifications
3. **Add Persistence** - Store notifications in database for offline users
4. **Add Read/Unread** - Track which notifications user has seen
5. **Add Push Notifications** - Use service workers for browser notifications

## Related Documentation

- [WebSocket Module Implementation](../src/modules/websocket/README.md)
- [Support API Documentation](./SUPPORT_API.md)
- [Authentication Guide](./AUTH_GUIDE.md)

## Summary

✅ WebSocket server running on port 8080, namespace `/notifications`  
✅ JWT authentication required for all connections  
✅ Real-time notifications for support ticket lifecycle  
✅ Separate events for admins (create) and users (update, resolve, delete)  
✅ Comprehensive test script with full event coverage  
✅ Backend-only implementation complete  

The WebSocket system is production-ready for real-time support ticket notifications! 🎉
