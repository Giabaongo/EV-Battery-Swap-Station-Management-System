// import { PrismaClient, Prisma } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// async function seedTestData() {
//   const prisma = new PrismaClient();
  
//   try {
//     console.log('🌱 Starting to seed test data...\n');

//     // Fix sequence if needed
//     console.log('🔧 Checking/fixing autoincrement sequences...');
//     try {
//       const result = await prisma.$queryRaw<Array<{ max: number | null }>>`
//         SELECT MAX(user_id) as max FROM users;
//       `;
//       const maxId = result[0]?.max || 0;
//       await prisma.$executeRawUnsafe(
//         `ALTER SEQUENCE users_user_id_seq RESTART WITH ${maxId + 1};`
//       );
//       console.log(`✅ Sequence fixed\n`);
//     } catch (err) {
//       console.log(`  (Sequence check skipped: ${(err as Error).message})\n`);
//     }

//     // Clean up existing test users and related data
//     console.log('🗑️  Cleaning up existing test data...');

//     // Delete by email (works with Prisma)
//     const testEmails = ['admin@test.com', 'driver1@test.com', 'driver2@test.com', 'staff@test.com'];
//     let deletedCount = 0;
//     for (const email of testEmails) {
//       try {
//         const user = await prisma.user.findUnique({ where: { email } });
//         if (user) {
//           // Delete related data in reverse order of constraints
//           await prisma.payment.deleteMany({ where: { user_id: user.user_id } });
//           await prisma.swapTransaction.deleteMany({ where: { user_id: user.user_id } });
//           await prisma.subscription.deleteMany({ where: { user_id: user.user_id } });
//           await prisma.vehicle.deleteMany({ where: { user_id: user.user_id } });
//           await prisma.reservation.deleteMany({ where: { user_id: user.user_id } });
//           await prisma.support.deleteMany({ where: { user_id: user.user_id } });
//           await prisma.user.delete({ where: { email } });
//           deletedCount++;
//         }
//       } catch (err) {
//         console.log(`  - Could not delete user ${email}: ${(err as Error).message}`);
//       }
//     }
//     console.log(`✅ Cleaned up ${deletedCount} old test users\n`);

//     // 1. Seed Users
//     console.log('📝 Seeding Users...');
//     const userEmails = ['admin@test.com', 'driver1@test.com', 'driver2@test.com', 'staff@test.com'];
//     const userRoles: Array<'admin' | 'driver' | 'station_staff'> = ['admin', 'driver', 'driver', 'station_staff'];
//     const users: Array<any> = [];
    
//     for (let i = 0; i < userEmails.length; i++) {
//       const user = await prisma.user.create({
//         data: {
//           username: ['Admin User', 'Driver 1', 'Driver 2', 'Staff'][i],
//           email: userEmails[i],
//           phone: `090000000${i + 1}`,
//           password: await bcrypt.hash('password123', 10),
//           role: userRoles[i],
//         },
//       });
//       users.push(user);
//     }
//     console.log(`✅ Created ${users.length} users\n`);

//     // 2. Seed Stations
//     console.log('📝 Seeding Stations...');
    
//     // Create stations one by one to avoid duplicates
//     const stations: Array<any> = [];
//     const stationData = [
//       { name: 'Trạm HN-01', address: 'Hà Nội - Quận Cầu Giấy', lat: '21.0285', lon: '105.7845' },
//       { name: 'Trạm HN-02', address: 'Hà Nội - Quận Ba Đình', lat: '21.0505', lon: '105.8085' },
//       { name: 'Trạm SG-01', address: 'TP Hồ Chí Minh - Quận 1', lat: '10.7769', lon: '106.7009' },
//     ];
    
//     for (const stationInfo of stationData) {
//       try {
//         const station = await prisma.station.create({
//           data: {
//             name: stationInfo.name,
//             address: stationInfo.address,
//             latitude: new Prisma.Decimal(stationInfo.lat),
//             longitude: new Prisma.Decimal(stationInfo.lon),
//             status: 'active',
//           },
//         });
//         stations.push(station);
//       } catch (err) {
//         // Try to find existing
//         const existing = await prisma.station.findFirst({
//           where: { name: stationInfo.name },
//         });
//         if (existing) stations.push(existing);
//       }
//     }
//     console.log(`✅ Created/found ${stations.length} stations\n`);
//     const allStations = stations;

//     // 3. Seed Batteries
//     console.log('📝 Seeding Batteries...');
//     await prisma.battery.createMany({
//       data: [
//         {
//           model: 'Tesla Model 3',
//           type: 'Lithium-ion',
//           capacity: new Prisma.Decimal('75.0'),
//           current_charge: new Prisma.Decimal('75.0'),
//           soh: new Prisma.Decimal('100'),
//           status: 'full',
//           station_id: allStations[0].station_id,
//         },
//         {
//           model: 'Tesla Model 3',
//           type: 'Lithium-ion',
//           capacity: new Prisma.Decimal('75.0'),
//           current_charge: new Prisma.Decimal('70.0'),
//           soh: new Prisma.Decimal('95'),
//           status: 'full',
//           station_id: allStations[0].station_id,
//         },
//         {
//           model: 'Nissan Leaf',
//           type: 'Lithium-ion',
//           capacity: new Prisma.Decimal('62.0'),
//           current_charge: new Prisma.Decimal('62.0'),
//           soh: new Prisma.Decimal('90'),
//           status: 'full',
//           station_id: allStations[1].station_id,
//         },
//         {
//           model: 'Tesla Model 3',
//           type: 'Lithium-ion',
//           capacity: new Prisma.Decimal('75.0'),
//           current_charge: new Prisma.Decimal('50.0'),
//           soh: new Prisma.Decimal('80'),
//           status: 'in_use',
//           station_id: allStations[0].station_id,
//         },
//         {
//           model: 'Nissan Leaf',
//           type: 'Lithium-ion',
//           capacity: new Prisma.Decimal('62.0'),
//           current_charge: new Prisma.Decimal('30.0'),
//           soh: new Prisma.Decimal('60'),
//           status: 'charging',
//           station_id: allStations[2].station_id,
//         },
//         {
//           model: 'BMW i3',
//           type: 'Lithium-ion',
//           capacity: new Prisma.Decimal('42.0'),
//           current_charge: new Prisma.Decimal('42.0'),
//           soh: new Prisma.Decimal('100'),
//           status: 'full',
//           station_id: allStations[2].station_id,
//         },
//       ],
//       skipDuplicates: true,
//     });
//     console.log(`✅ Created batteries\n`);

//     // 4. Seed Vehicles
//     console.log('📝 Seeding Vehicles...');
//     const vehicles = [
//       await prisma.vehicle.create({
//         data: {
//           user_id: users[1].user_id,
//           vin: 'VIN001',
//           battery_model: 'Tesla Model 3',
//           battery_type: 'Lithium-ion',
//           status: 'active',
//         },
//       }),
//       await prisma.vehicle.create({
//         data: {
//           user_id: users[1].user_id,
//           vin: 'VIN002',
//           battery_model: 'Nissan Leaf',
//           battery_type: 'Lithium-ion',
//           status: 'active',
//         },
//       }),
//       await prisma.vehicle.create({
//         data: {
//           user_id: users[2].user_id,
//           vin: 'VIN003',
//           battery_model: 'BMW i3',
//           battery_type: 'Lithium-ion',
//           status: 'active',
//         },
//       }),
//     ];
//     console.log(`✅ Created ${vehicles.length} vehicles\n`);

//     // 5. Seed Battery Service Packages (already created by seed-configs.ts, but we can verify)
//     console.log('📝 Checking Battery Service Packages...');
//     const packages = await prisma.batteryServicePackage.findMany();
//     console.log(`✅ Found ${packages.length} packages:\n`);
//     packages.forEach((pkg) => {
//       console.log(`   - ID: ${pkg.package_id}, Name: ${pkg.name}, Price: ${pkg.base_price} VNĐ`);
//     });
//     console.log();

//     // 6. Seed Subscriptions
//     console.log('📝 Seeding Subscriptions...');
//     const subscriptions = [
//       await prisma.subscription.create({
//         data: {
//           user_id: users[1].user_id,
//           package_id: packages[0]?.package_id || 1,
//           vehicle_id: vehicles[0].vehicle_id,
//           status: 'active',
//           start_date: new Date(),
//           end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
//           distance_traveled: 1200,
//         },
//       }),
//       await prisma.subscription.create({
//         data: {
//           user_id: users[2].user_id,
//           package_id: packages[1]?.package_id || 2,
//           vehicle_id: vehicles[2].vehicle_id,
//           status: 'active',
//           start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
//           end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
//           distance_traveled: 3500,
//         },
//       }),
//     ];
//     console.log(`✅ Created ${subscriptions.length} subscriptions\n`);

//     // 7. Seed Payments
//     console.log('📝 Seeding Payments...');
//     const payments = [
//       await prisma.payment.create({
//         data: {
//           user_id: users[1].user_id,
//           subscription_id: subscriptions[0].subscription_id,
//           vehicle_id: vehicles[0].vehicle_id,
//           amount: new Prisma.Decimal('450000'),
//           payment_type: 'subscription',
//           method: 'vnpay',
//           status: 'success',
//           order_info: 'Subscription fee',
//           created_at: new Date(),
//         },
//       }),
//       await prisma.payment.create({
//         data: {
//           user_id: users[2].user_id,
//           subscription_id: subscriptions[1].subscription_id,
//           vehicle_id: vehicles[2].vehicle_id,
//           amount: new Prisma.Decimal('750000'),
//           payment_type: 'subscription_with_deposit',
//           method: 'vnpay',
//           status: 'success',
//           order_info: 'Subscription with deposit',
//           created_at: new Date(),
//         },
//       }),
//       await prisma.payment.create({
//         data: {
//           user_id: users[1].user_id,
//           amount: new Prisma.Decimal('86500'),
//           payment_type: 'battery_replacement',
//           method: 'vnpay',
//           status: 'success',
//           order_info: 'Battery replacement fee',
//           created_at: new Date(),
//         },
//       }),
//       await prisma.payment.create({
//         data: {
//           user_id: users[2].user_id,
//           amount: new Prisma.Decimal('50000'),
//           payment_type: 'damage_fee',
//           method: 'vnpay',
//           status: 'success',
//           order_info: 'Damage fee',
//           created_at: new Date(),
//         },
//       }),
//     ];
//     console.log(`✅ Created ${payments.length} payments\n`);

//     // 8. Get all batteries for swap transactions
//     const allBatteries = await prisma.battery.findMany();
//     console.log(`📝 Found ${allBatteries.length} batteries for swap transactions\n`);

//     // 9. Seed Swap Transactions
//     console.log('📝 Seeding Swap Transactions...');
//     const swapTransactions = [
//       await prisma.swapTransaction.create({
//         data: {
//           user_id: users[1].user_id,
//           vehicle_id: vehicles[0].vehicle_id,
//           subscription_id: subscriptions[0].subscription_id,
//           station_id: allStations[0].station_id,
//           battery_taken_id: allBatteries[0]?.battery_id || 1,
//           battery_returned_id: allBatteries[1]?.battery_id || 2,
//           status: 'completed',
//           createAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
//         },
//       }),
//       await prisma.swapTransaction.create({
//         data: {
//           user_id: users[1].user_id,
//           vehicle_id: vehicles[0].vehicle_id,
//           subscription_id: subscriptions[0].subscription_id,
//           station_id: allStations[1].station_id,
//           battery_taken_id: allBatteries[1]?.battery_id || 2,
//           battery_returned_id: allBatteries[2]?.battery_id || 3,
//           status: 'completed',
//           createAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
//         },
//       }),
//       await prisma.swapTransaction.create({
//         data: {
//           user_id: users[2].user_id,
//           vehicle_id: vehicles[2].vehicle_id,
//           subscription_id: subscriptions[1].subscription_id,
//           station_id: allStations[2].station_id,
//           battery_taken_id: allBatteries[2]?.battery_id || 3,
//           battery_returned_id: allBatteries[3]?.battery_id || 4,
//           status: 'completed',
//           createAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
//         },
//       }),
//     ];
//     console.log(`✅ Created ${swapTransactions.length} swap transactions\n`);

//     console.log('✨ All test data seeded successfully!\n');
//     console.log('📊 Summary:');
//     console.log(`   - Users: ${users.length}`);
//     console.log(`   - Stations: ${allStations.length}`);
//     console.log(`   - Vehicles: ${vehicles.length}`);
//     console.log(`   - Subscriptions: ${subscriptions.length}`);
//     console.log(`   - Payments: ${payments.length}`);
//     console.log(`   - Swap Transactions: ${swapTransactions.length}`);
//     console.log('\n🔐 Test Credentials:');
//     console.log(`   - Admin: admin@test.com / password123`);
//     console.log(`   - Driver 1: driver1@test.com / password123`);
//     console.log(`   - Driver 2: driver2@test.com / password123`);
//     console.log(`   - Staff: staff@test.com / password123`);
//   } catch (error) {
//     console.error('❌ Error seeding data:', error);
//     process.exit(1);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// seedTestData();
