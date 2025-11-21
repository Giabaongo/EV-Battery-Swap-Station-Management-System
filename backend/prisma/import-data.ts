import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importData(filename?: string) {
  try {
    console.log('🔍 Starting data import...\n');

    // Find backup file
    const backupDir = path.join(__dirname, 'backups');
    let filepath: string;

    if (filename) {
      filepath = path.join(backupDir, filename);
    } else {
      // Get latest backup file
      const files = fs.readdirSync(backupDir).filter(f => f.startsWith('database-backup-'));
      if (files.length === 0) {
        throw new Error('No backup files found in backups directory');
      }
      files.sort().reverse();
      filepath = path.join(backupDir, files[0]);
    }

    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filepath}`);
    }

    console.log(`📂 Reading backup from: ${filepath}\n`);

    // Read data from file
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const data = JSON.parse(fileContent);

    console.log('📊 Records to import:');
    console.log(`   Users: ${data.users.length}`);
    console.log(`   Vehicles: ${data.vehicles.length}`);
    console.log(`   Batteries: ${data.batteries.length}`);
    console.log(`   Stations: ${data.stations.length}`);
    console.log(`   Battery Service Packages: ${data.batteryServicePackages.length}`);
    console.log(`   Subscriptions: ${data.subscriptions.length}`);
    console.log(`   Payments: ${data.payments.length}`);
    console.log(`   Reservations: ${data.reservations.length}`);
    console.log(`   Swap Transactions: ${data.swapTransactions.length}`);
    console.log(`   Supports: ${data.supports?.length || 0}\n`);

    console.log('🗑️  Clearing existing data...');

    // Delete data in correct order (respecting foreign key constraints)
    await prisma.swapTransaction.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.batteryServicePackage.deleteMany();
    await prisma.support.deleteMany(); // Delete supports before users and stations
    await prisma.battery.deleteMany();
    await prisma.station.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Existing data cleared\n');

    console.log('📥 Importing data...');

    // Import data in correct order (respecting foreign key constraints)
    // 1. Import stations first (no dependencies)
    if (data.stations.length > 0) {
      await prisma.station.createMany({ data: data.stations, skipDuplicates: true });
      console.log(`   ✓ Stations: ${data.stations.length}`);
    }

    // 2. Import users (depends on stations)
    if (data.users.length > 0) {
      await prisma.user.createMany({ data: data.users, skipDuplicates: true });
      console.log(`   ✓ Users: ${data.users.length}`);
    }

    // 3. Import batteries (depends on stations)
    if (data.batteries.length > 0) {
      await prisma.battery.createMany({ data: data.batteries, skipDuplicates: true });
      console.log(`   ✓ Batteries: ${data.batteries.length}`);
    }

    // 4. Import vehicles (depends on users)
    if (data.vehicles.length > 0) {
      await prisma.vehicle.createMany({ data: data.vehicles, skipDuplicates: true });
      console.log(`   ✓ Vehicles: ${data.vehicles.length}`);
    }

    // 5. Import battery service packages
    if (data.batteryServicePackages.length > 0) {
      await prisma.batteryServicePackage.createMany({ 
        data: data.batteryServicePackages, 
        skipDuplicates: true 
      });
      console.log(`   ✓ Battery Service Packages: ${data.batteryServicePackages.length}`);
    }

    // 6. Import subscriptions (depends on users, packages, vehicles)
    if (data.subscriptions.length > 0) {
      await prisma.subscription.createMany({ 
        data: data.subscriptions, 
        skipDuplicates: true 
      });
      console.log(`   ✓ Subscriptions: ${data.subscriptions.length}`);
    }

    // 7. Import payments (depends on users, packages, vehicles, subscriptions)
    if (data.payments.length > 0) {
      await prisma.payment.createMany({ data: data.payments, skipDuplicates: true });
      console.log(`   ✓ Payments: ${data.payments.length}`);
    }

    // 8. Import reservations (depends on users, stations, batteries)
    if (data.reservations.length > 0) {
      await prisma.reservation.createMany({ 
        data: data.reservations, 
        skipDuplicates: true 
      });
      console.log(`   ✓ Reservations: ${data.reservations.length}`);
    }

    // 9. Import swap transactions (depends on users, stations, vehicles, batteries, subscriptions)
    if (data.swapTransactions.length > 0) {
      await prisma.swapTransaction.createMany({ 
        data: data.swapTransactions, 
        skipDuplicates: true 
      });
      console.log(`   ✓ Swap Transactions: ${data.swapTransactions.length}`);
    }

    // 10. Import supports (depends on users and stations)
    if (data.supports && data.supports.length > 0) {
      await prisma.support.createMany({ 
        data: data.supports, 
        skipDuplicates: true 
      });
      console.log(`   ✓ Supports: ${data.supports.length}`);
    }

    console.log('\n✅ Data imported successfully!');

  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get filename from command line arguments
const filename = process.argv[2];

// Run import
importData(filename)
  .then(() => {
    console.log('\n✨ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  });
