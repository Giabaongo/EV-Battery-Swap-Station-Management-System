import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('🔍 Starting data export...\n');

    // Export all data from all tables
    const data = {
      users: await prisma.user.findMany(),
      vehicles: await prisma.vehicle.findMany(),
      batteries: await prisma.battery.findMany(),
      stations: await prisma.station.findMany(),
      batteryServicePackages: await prisma.batteryServicePackage.findMany(),
      subscriptions: await prisma.subscription.findMany(),
      payments: await prisma.payment.findMany(),
      reservations: await prisma.reservation.findMany(),
      swapTransactions: await prisma.swapTransaction.findMany(),
      supports: await prisma.support.findMany(),
    };

    // Count records
    const counts = {
      users: data.users.length,
      vehicles: data.vehicles.length,
      batteries: data.batteries.length,
      stations: data.stations.length,
      batteryServicePackages: data.batteryServicePackages.length,
      subscriptions: data.subscriptions.length,
      payments: data.payments.length,
      reservations: data.reservations.length,
      swapTransactions: data.swapTransactions.length,
      supports: data.supports.length,
    };

    console.log('📊 Records found:');
    console.log(`   Users: ${counts.users}`);
    console.log(`   Vehicles: ${counts.vehicles}`);
    console.log(`   Batteries: ${counts.batteries}`);
    console.log(`   Stations: ${counts.stations}`);
    console.log(`   Battery Service Packages: ${counts.batteryServicePackages}`);
    console.log(`   Subscriptions: ${counts.subscriptions}`);
    console.log(`   Payments: ${counts.payments}`);
    console.log(`   Reservations: ${counts.reservations}`);
    console.log(`   Swap Transactions: ${counts.swapTransactions}`);
    console.log(`   Supports: ${counts.supports}`);
    console.log(`   Total: ${Object.values(counts).reduce((a, b) => a + b, 0)}\n`);

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `database-backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    // Write to file
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    console.log(`✅ Data exported successfully to: ${filepath}\n`);
    console.log(`📦 File size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);

    return data;
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run export
exportData()
  .then(() => {
    console.log('\n✨ Export completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Export failed:', error);
    process.exit(1);
  });
