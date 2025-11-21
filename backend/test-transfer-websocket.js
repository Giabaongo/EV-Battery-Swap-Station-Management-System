/**
 * WebSocket Test Script for Battery Transfer System
 * 
 * Prerequisites:
 * npm install socket.io-client
 * 
 * Usage:
 * node test-transfer-websocket.js
 */

const io = require('socket.io-client');

const BACKEND_URL = 'http://localhost:8080';

console.log('🚀 Starting WebSocket connection tests...\n');

// Connect to Battery Transfer Request namespace
const requestSocket = io(`${BACKEND_URL}/battery-transfer-request`, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connect to Battery Transfer Ticket namespace
const ticketSocket = io(`${BACKEND_URL}/battery-transfer-ticket`, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Battery Transfer Request Events
requestSocket.on('connect', () => {
  console.log('✅ Connected to battery-transfer-request namespace');
  console.log(`   Socket ID: ${requestSocket.id}\n`);
});

requestSocket.on('disconnect', () => {
  console.log('❌ Disconnected from battery-transfer-request namespace\n');
});

requestSocket.on('connect_error', (error) => {
  console.error('❌ Connection error (transfer-request):', error.message);
});

requestSocket.on('transfer.request.created', (data) => {
  console.log('📦 NEW TRANSFER REQUEST CREATED:');
  console.log(`   Request ID: ${data.transferRequestId}`);
  console.log(`   Route: ${data.fromStationName} → ${data.toStationName}`);
  console.log(`   Battery: ${data.batteryModel} (${data.batteryType})`);
  console.log(`   Quantity: ${data.quantity}`);
  console.log(`   Status: ${data.status}`);
  console.log(`   Created by: ${data.createdBy.username} (${data.createdBy.role})`);
  console.log(`   Timestamp: ${data.timestamp}\n`);
});

requestSocket.on('transfer.request.status.updated', (data) => {
  console.log('🔄 TRANSFER REQUEST STATUS UPDATED:');
  console.log(`   Request ID: ${data.transferRequestId}`);
  console.log(`   Route: ${data.fromStationName} → ${data.toStationName}`);
  console.log(`   Status Change: ${data.previousStatus} → ${data.currentStatus}`);
  console.log(`   Battery: ${data.batteryModel} (${data.batteryType})`);
  console.log(`   Quantity: ${data.quantity}`);
  if (data.updatedBy) {
    console.log(`   Updated by: ${data.updatedBy.username} (${data.updatedBy.role})`);
  }
  console.log(`   Timestamp: ${data.timestamp}\n`);
});

requestSocket.on('transfer.request.updated', (data) => {
  console.log('📝 TRANSFER REQUEST UPDATED:');
  console.log(`   Request ID: ${data.transferRequestId}`);
  console.log(`   Route: ${data.fromStationName} → ${data.toStationName}`);
  console.log(`   Updated Fields: ${data.updatedFields.join(', ')}`);
  console.log(`   Timestamp: ${data.timestamp}\n`);
});

// Battery Transfer Ticket Events
ticketSocket.on('connect', () => {
  console.log('✅ Connected to battery-transfer-ticket namespace');
  console.log(`   Socket ID: ${ticketSocket.id}\n`);
});

ticketSocket.on('disconnect', () => {
  console.log('❌ Disconnected from battery-transfer-ticket namespace\n');
});

ticketSocket.on('connect_error', (error) => {
  console.error('❌ Connection error (transfer-ticket):', error.message);
});

ticketSocket.on('transfer.ticket.created', (data) => {
  const ticketTypeIcon = data.ticketType === 'export' ? '📤' : '📥';
  const ticketTypeLabel = data.ticketType === 'export' ? 'EXPORT' : 'IMPORT';
  
  console.log(`${ticketTypeIcon} NEW ${ticketTypeLabel} TICKET CREATED:`);
  console.log(`   Ticket ID: ${data.ticketId}`);
  console.log(`   Transfer Request ID: ${data.transferRequestId}`);
  console.log(`   Station: ${data.stationName} (ID: ${data.stationId})`);
  console.log(`   Related Station: ${data.relatedStation.stationName} (ID: ${data.relatedStation.stationId})`);
  console.log(`   Battery Count: ${data.batteryCount}`);
  console.log(`   Battery IDs: [${data.batteryIds.join(', ')}]`);
  console.log(`   Battery Model: ${data.batteryModel}`);
  console.log(`   Battery Type: ${data.batteryType}`);
  console.log(`   Staff: ${data.staff.username} (ID: ${data.staff.staffId})`);
  console.log(`   Timestamp: ${data.timestamp}\n`);
});

ticketSocket.on('export.ticket.completed', (data) => {
  console.log('📤 EXPORT TICKET COMPLETED:');
  console.log(`   Ticket ID: ${data.ticketId}`);
  console.log(`   Transfer Request ID: ${data.transferRequestId}`);
  console.log(`   From: ${data.fromStationName} (ID: ${data.fromStationId})`);
  console.log(`   To: ${data.toStationName} (ID: ${data.toStationId})`);
  console.log(`   Battery Count: ${data.batteryCount}`);
  console.log(`   Battery IDs: [${data.batteryIds.join(', ')}]`);
  console.log(`   Battery Model: ${data.batteryModel}`);
  console.log(`   Battery Type: ${data.batteryType}`);
  console.log(`   Exported by: ${data.exportedBy.username} (ID: ${data.exportedBy.staffId})`);
  console.log(`   Timestamp: ${data.timestamp}\n`);
});

ticketSocket.on('import.ticket.completed', (data) => {
  console.log('📥 IMPORT TICKET COMPLETED:');
  console.log(`   Ticket ID: ${data.ticketId}`);
  console.log(`   Transfer Request ID: ${data.transferRequestId}`);
  console.log(`   From: ${data.fromStationName} (ID: ${data.fromStationId})`);
  console.log(`   To: ${data.toStationName} (ID: ${data.toStationId})`);
  console.log(`   Battery Count: ${data.batteryCount}`);
  console.log(`   Battery IDs: [${data.batteryIds.join(', ')}]`);
  console.log(`   Battery Model: ${data.batteryModel}`);
  console.log(`   Battery Type: ${data.batteryType}`);
  console.log(`   Imported by: ${data.importedBy.username} (ID: ${data.importedBy.staffId})`);
  if (data.slotAssignments) {
    console.log(`   Slot Assignments: ${data.slotAssignments.length} batteries assigned`);
  }
  console.log(`   Timestamp: ${data.timestamp}\n`);
});

ticketSocket.on('battery.transit.status', (data) => {
  const statusIcon = data.inTransit ? '🚚' : '✅';
  const statusLabel = data.inTransit ? 'IN TRANSIT' : 'ARRIVED';
  
  console.log(`${statusIcon} BATTERY TRANSIT STATUS - ${statusLabel}:`);
  console.log(`   Transfer Request ID: ${data.transferRequestId}`);
  console.log(`   Ticket ID: ${data.ticketId}`);
  console.log(`   From: ${data.fromStationName} (ID: ${data.fromStationId})`);
  console.log(`   To: ${data.toStationName} (ID: ${data.toStationId})`);
  console.log(`   Battery Count: ${data.batteryIds.length}`);
  console.log(`   Battery IDs: [${data.batteryIds.join(', ')}]`);
  console.log(`   Timestamp: ${data.timestamp}\n`);
});

ticketSocket.on('transfer.ticket.updated', (data) => {
  console.log('📝 TRANSFER TICKET UPDATED:');
  console.log(`   Ticket ID: ${data.ticketId}`);
  console.log(`   Transfer Request ID: ${data.transferRequestId}`);
  console.log(`   Ticket Type: ${data.ticketType}`);
  console.log(`   Station: ${data.stationName} (ID: ${data.stationId})`);
  console.log(`   Updated Fields: ${data.updatedFields.join(', ')}`);
  if (data.updatedBy) {
    console.log(`   Updated by: ${data.updatedBy.username} (${data.updatedBy.role})`);
  }
  console.log(`   Timestamp: ${data.timestamp}\n`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Closing WebSocket connections...');
  requestSocket.close();
  ticketSocket.close();
  process.exit(0);
});

console.log('📡 Listening for events...');
console.log('Press Ctrl+C to exit\n');
console.log('═══════════════════════════════════════════════════\n');
