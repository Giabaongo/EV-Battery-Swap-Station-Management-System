/**
 * WebSocket Backend Test Script
 * 
 * This script tests real-time notifications for support tickets
 * 
 * Prerequisites:
 * 1. Backend server running on http://localhost:8080
 * 2. Valid JWT tokens for driver and admin users
 * 
 * Install dependencies:
 * npm install socket.io-client node-fetch
 */

const { io } = require('socket.io-client');
const fetch = require('node-fetch');

// ============================================
// CONFIGURATION - Update these with your tokens
// ============================================

const API_URL = 'http://localhost:8080';
const WS_URL = 'http://localhost:8080/notifications';

// Get these tokens by logging in via API:
// POST http://localhost:8080/api/v1/auth/login
// Body: { "email": "driver@example.com", "password": "your-password" }
const DRIVER_TOKEN = 'YOUR_DRIVER_JWT_TOKEN_HERE';
const ADMIN_TOKEN = 'YOUR_ADMIN_JWT_TOKEN_HERE';

// Test data - these should exist in your database
const TEST_USER_ID = 1; // Driver's user_id
const TEST_STATION_ID = 1; // A valid station_id

// ============================================
// Helper Functions
// ============================================

function log(prefix, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${prefix}: ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// WebSocket Test
// ============================================

async function testWebSocket() {
  log('TEST', '🚀 Starting WebSocket test...');
  
  // Validate configuration
  if (DRIVER_TOKEN === 'YOUR_DRIVER_JWT_TOKEN_HERE' || ADMIN_TOKEN === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
    log('ERROR', '❌ Please update DRIVER_TOKEN and ADMIN_TOKEN in the script');
    process.exit(1);
  }

  let driverSocket, adminSocket;
  let testResults = {
    driverConnected: false,
    adminConnected: false,
    adminReceivedCreate: false,
    userReceivedUpdate: false,
    userReceivedResolved: false,
    userReceivedDeleted: false,
  };

  try {
    // ============================================
    // Step 1: Connect as Driver
    // ============================================
    log('STEP 1', 'Connecting as driver...');
    
    driverSocket = io(WS_URL, {
      auth: { token: DRIVER_TOKEN },
      reconnection: false,
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Driver connection timeout')), 5000);
      
      driverSocket.on('connected', (data) => {
        clearTimeout(timeout);
        log('DRIVER', '✅ Connected successfully', data);
        testResults.driverConnected = true;
        resolve();
      });

      driverSocket.on('error', (error) => {
        clearTimeout(timeout);
        log('DRIVER', '❌ Connection error', error);
        reject(error);
      });

      driverSocket.on('connect_error', (error) => {
        clearTimeout(timeout);
        log('DRIVER', '❌ Connect error', error.message);
        reject(error);
      });
    });

    // ============================================
    // Step 2: Connect as Admin
    // ============================================
    log('STEP 2', 'Connecting as admin...');
    
    adminSocket = io(WS_URL, {
      auth: { token: ADMIN_TOKEN },
      reconnection: false,
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Admin connection timeout')), 5000);
      
      adminSocket.on('connected', (data) => {
        clearTimeout(timeout);
        log('ADMIN', '✅ Connected successfully', data);
        testResults.adminConnected = true;
        resolve();
      });

      adminSocket.on('error', (error) => {
        clearTimeout(timeout);
        log('ADMIN', '❌ Connection error', error);
        reject(error);
      });

      adminSocket.on('connect_error', (error) => {
        clearTimeout(timeout);
        log('ADMIN', '❌ Connect error', error.message);
        reject(error);
      });
    });

    // ============================================
    // Step 3: Set up event listeners
    // ============================================
    log('STEP 3', 'Setting up event listeners...');

    // Admin listens for new support tickets
    adminSocket.on('support:ticket:created', (notification) => {
      log('ADMIN', '✅ Received new ticket notification', notification);
      testResults.adminReceivedCreate = true;
    });

    // Driver listens for ticket updates
    driverSocket.on('support:ticket:updated', (notification) => {
      log('DRIVER', '✅ Received ticket update notification', notification);
      testResults.userReceivedUpdate = true;
    });

    driverSocket.on('support:ticket:resolved', (notification) => {
      log('DRIVER', '✅ Received ticket resolved notification', notification);
      testResults.userReceivedResolved = true;
    });

    driverSocket.on('support:ticket:deleted', (notification) => {
      log('DRIVER', '✅ Received ticket deleted notification', notification);
      testResults.userReceivedDeleted = true;
    });

    await sleep(1000);

    // ============================================
    // Step 4: Create support ticket
    // ============================================
    log('STEP 4', 'Creating support ticket via API...');

    const createResponse = await fetch(`${API_URL}/api/v1/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DRIVER_TOKEN}`,
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        description: 'WebSocket test ticket - Battery swap machine not working',
        station_id: TEST_STATION_ID,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Failed to create ticket: ${JSON.stringify(error)}`);
    }

    const ticket = await createResponse.json();
    log('API', '✅ Support ticket created', ticket);

    // Wait for WebSocket notification
    await sleep(2000);

    // ============================================
    // Step 5: Update support ticket (as admin)
    // ============================================
    log('STEP 5', 'Updating support ticket via API...');

    const updateResponse = await fetch(`${API_URL}/api/v1/support/${ticket.support_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        status: 'in_progress',
      }),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      throw new Error(`Failed to update ticket: ${JSON.stringify(error)}`);
    }

    const updatedTicket = await updateResponse.json();
    log('API', '✅ Support ticket updated', updatedTicket);

    // Wait for WebSocket notification
    await sleep(2000);

    // ============================================
    // Step 6: Resolve support ticket (as admin)
    // ============================================
    log('STEP 6', 'Resolving support ticket via API...');

    const resolveResponse = await fetch(`${API_URL}/api/v1/support/${ticket.support_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        status: 'closed',
      }),
    });

    if (!resolveResponse.ok) {
      const error = await resolveResponse.json();
      throw new Error(`Failed to resolve ticket: ${JSON.stringify(error)}`);
    }

    const resolvedTicket = await resolveResponse.json();
    log('API', '✅ Support ticket resolved', resolvedTicket);

    // Wait for WebSocket notification
    await sleep(2000);

    // ============================================
    // Step 7: Delete support ticket (as admin)
    // ============================================
    log('STEP 7', 'Deleting support ticket via API...');

    const deleteResponse = await fetch(`${API_URL}/api/v1/support/${ticket.support_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      throw new Error(`Failed to delete ticket: ${JSON.stringify(error)}`);
    }

    log('API', '✅ Support ticket deleted');

    // Wait for WebSocket notification
    await sleep(2000);

    // ============================================
    // Step 8: Print test results
    // ============================================
    log('RESULTS', '📊 Test Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Driver Connected:         ${testResults.driverConnected ? '✅' : '❌'}`);
    console.log(`Admin Connected:          ${testResults.adminConnected ? '✅' : '❌'}`);
    console.log(`Admin Received Create:    ${testResults.adminReceivedCreate ? '✅' : '❌'}`);
    console.log(`User Received Update:     ${testResults.userReceivedUpdate ? '✅' : '❌'}`);
    console.log(`User Received Resolved:   ${testResults.userReceivedResolved ? '✅' : '❌'}`);
    console.log(`User Received Deleted:    ${testResults.userReceivedDeleted ? '✅' : '❌'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const allPassed = Object.values(testResults).every(result => result === true);
    
    if (allPassed) {
      log('SUCCESS', '🎉 All tests passed!');
    } else {
      log('WARNING', '⚠️ Some tests failed. Check the results above.');
    }

  } catch (error) {
    log('ERROR', '❌ Test failed', { message: error.message, stack: error.stack });
  } finally {
    // Cleanup
    if (driverSocket) {
      driverSocket.disconnect();
      log('CLEANUP', 'Driver socket disconnected');
    }
    if (adminSocket) {
      adminSocket.disconnect();
      log('CLEANUP', 'Admin socket disconnected');
    }
    
    await sleep(1000);
    process.exit(0);
  }
}

// ============================================
// Run the test
// ============================================

testWebSocket().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
