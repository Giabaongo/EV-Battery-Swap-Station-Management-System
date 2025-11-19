// Test WebSocket Reservations
// Run: node test-ws-client.js
// Make sure to install: npm install socket.io-client

const io = require('socket.io-client');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${COLORS.cyan}[${timestamp}]${COLORS.reset} ${color}${prefix}${COLORS.reset} ${message}`);
}

function logSuccess(message) {
  log(COLORS.green, '✅', message);
}

function logError(message) {
  log(COLORS.red, '❌', message);
}

function logInfo(message) {
  log(COLORS.blue, 'ℹ️ ', message);
}

function logWarning(message) {
  log(COLORS.yellow, '⚠️ ', message);
}

function logEvent(message) {
  log(COLORS.bright + COLORS.green, '🔔', message);
}

// Configuration
const SERVER_URL = process.env.WS_SERVER_URL || 'http://localhost:8080';
const NAMESPACE = '/reservations';
const FULL_URL = SERVER_URL + NAMESPACE;

console.clear();
console.log(`
${COLORS.bright}${COLORS.cyan}╔═══════════════════════════════════════════════════════════╗
║  WebSocket Reservation Test Client (Node.js)              ║
╚═══════════════════════════════════════════════════════════╝${COLORS.reset}
`);

logInfo(`Connecting to: ${FULL_URL}`);
logInfo('Waiting for events... (Press Ctrl+C to exit)\n');

// Create socket connection
const socket = io(FULL_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Connection event handlers
socket.on('connect', () => {
  logSuccess('Connected to WebSocket server');
  logInfo(`Socket ID: ${socket.id}`);
  console.log('');
});

socket.on('disconnect', (reason) => {
  logWarning(`Disconnected from server: ${reason}`);
  
  if (reason === 'io server disconnect') {
    logInfo('Server disconnected the client. Attempting to reconnect...');
    socket.connect();
  }
});

socket.on('connect_error', (error) => {
  logError(`Connection error: ${error.message}`);
  
  if (error.message.includes('ECONNREFUSED')) {
    logWarning('Server is not running. Make sure to start the backend server.');
  }
});

socket.on('reconnect', (attemptNumber) => {
  logSuccess(`Reconnected after ${attemptNumber} attempt(s)`);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  logInfo(`Reconnection attempt ${attemptNumber}...`);
});

socket.on('reconnect_error', (error) => {
  logError(`Reconnection error: ${error.message}`);
});

socket.on('reconnect_failed', () => {
  logError('Failed to reconnect after maximum attempts');
  process.exit(1);
});

// Business event handlers
socket.on('reservation.created', (data) => {
  console.log('\n' + '='.repeat(60));
  logEvent('NEW RESERVATION CREATED!');
  console.log('='.repeat(60));
  
  console.log(`
${COLORS.bright}Reservation Details:${COLORS.reset}
  ${COLORS.cyan}Reservation ID:${COLORS.reset}  ${data.reservationId}
  ${COLORS.cyan}Station:${COLORS.reset}         ${data.stationName} (ID: ${data.stationId})
  ${COLORS.cyan}Scheduled Time:${COLORS.reset}  ${new Date(data.scheduledTime).toLocaleString()}
  ${COLORS.cyan}Battery ID:${COLORS.reset}      ${data.batteryId}

${COLORS.bright}User Information:${COLORS.reset}
  ${COLORS.cyan}User ID:${COLORS.reset}         ${data.user.id}
  ${COLORS.cyan}Username:${COLORS.reset}        ${data.user.username}
  ${COLORS.cyan}Email:${COLORS.reset}           ${data.user.email}
  ${COLORS.cyan}Phone:${COLORS.reset}           ${data.user.phone}

${COLORS.bright}Vehicle Information:${COLORS.reset}
  ${COLORS.cyan}Vehicle ID:${COLORS.reset}      ${data.vehicle.id}
  ${COLORS.cyan}VIN:${COLORS.reset}             ${data.vehicle.vin}
  ${COLORS.cyan}Battery Model:${COLORS.reset}   ${data.vehicle.batteryModel}
  ${COLORS.cyan}Battery Type:${COLORS.reset}    ${data.vehicle.batteryType}
  `);
  
  console.log('='.repeat(60) + '\n');
  
  // Play sound (cross-platform)
  if (process.platform === 'darwin' || process.platform === 'linux') {
    require('child_process').exec('printf "\\a"');
  }
});

// Generic error handler
socket.on('error', (error) => {
  logError(`Socket error: ${error.message || error}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n');
  logWarning('Shutting down...');
  socket.disconnect();
  logInfo('Disconnected from server');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  console.error(error);
  process.exit(1);
});

// Keep the process alive
setInterval(() => {
  // Heartbeat - do nothing, just keep process running
}, 60000);
