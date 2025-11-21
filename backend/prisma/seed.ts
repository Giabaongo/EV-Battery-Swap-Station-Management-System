// //Constrant in status
// // battery status: in station "full" if current charge at 100, if not "charging", in user vehicle is "in_use", "in_stransit" if being transported, "maintenance" if faulty, "booked" if in reservation 
// // if vehicle has user is active other is inactive
// // if slot has battery is is_ociped is true else false
// // subscription is pending_penalty_payment if distance traveled > base distance
// // only 1 battery model and type, vehicle

// //cabinet slot number only is 15,
// //one station can have 1 or more cabinet
// //one staff only belong to 1 station
// // all user is email verify is true, status is active


// //10 stations, 21 users (1 adcmin, 10 staff, 10 users), 100 battery

// import { PrismaClient, Battery, Slot } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// async function clearDatabase() {
//     console.log('🗑️  Clearing existing data...\n');

//     // Delete in correct order to respect foreign key constraints
//     await prisma.batteriesTransfer.deleteMany();
//     await prisma.batteryTransferTicket.deleteMany();
//     await prisma.batteryTransferRequest.deleteMany();
//     await prisma.support.deleteMany();
//     await prisma.swapTransaction.deleteMany();
//     await prisma.reservation.deleteMany();
//     await prisma.payment.deleteMany();
//     await prisma.subscription.deleteMany();
//     await prisma.vehicle.deleteMany();
//     await prisma.battery.deleteMany();
//     await prisma.slot.deleteMany();
//     await prisma.cabinet.deleteMany();
//     await prisma.batteryServicePackage.deleteMany();
//     await prisma.config.deleteMany();
//     await prisma.station.deleteMany();
//     await prisma.user.deleteMany();

//     console.log('✓ All data cleared\n');
// }

// async function main() {
//     // Clear database first
//     await clearDatabase();

//     console.log('🌱 Starting database seeding...\n');

//     // 1. Seed Users: 1 admin + 10 staff + 10 drivers = 21 users
//     console.log('👥 Seeding users...');
//     const hashedPassword = await bcrypt.hash('password123', 10);

//     const admin = await prisma.user.create({
//         data: {
//             username: 'Admin User',
//             password: hashedPassword,
//             phone: '0901234567',
//             email: 'admin@evswap.com',
//             role: 'admin',
//             email_verified: true,
//             status: 'active',
//         },
//     });

//     // Create 10 drivers
//     const drivers = [];
//     for (let i = 1; i <= 10; i++) {
//         const driver = await prisma.user.create({
//             data: {
//                 username: `Driver ${i}`,
//                 password: hashedPassword,
//                 phone: `09${String(i).padStart(2, '0')}3456789`,
//                 email: `driver${i}@evswap.com`,
//                 role: 'driver',
//                 email_verified: true,
//                 status: 'active',
//             },
//         });
//         drivers.push(driver);
//     }

//     const driver1 = drivers[0]; // For reference in tests
//     const driver2 = drivers[1]; // For reference in tests

//     console.log(`   ✓ Created 21 users (1 admin, 10 drivers)`);

//     // Add reference variables for stations and staff (will be populated later)
//     let station1, station2, station3;
//     let staff1, staff2, staff3;

//     // 2. Seed 10 Stations
//     console.log('🏪 Seeding 10 stations...');
//     const stations = [];
//     const stationNames = [
//         'Station District 1',
//         'Station District 7',
//         'Station Binh Thanh',
//         'Station Go Vap',
//         'Station Tan Binh',
//         'Station Phu Nhuan',
//         'Station District 11',
//         'Station Nha Be',
//         'Station Can Tho',
//         'Station Da Nang',
//     ];

//     const stationAddresses = [
//         '123 Nguyen Hue, District 1, HCMC',
//         '456 Nguyen Van Linh, District 7, HCMC',
//         '789 Xo Viet Nghe Tinh, Binh Thanh, HCMC',
//         '321 Dien Bien Phu, Go Vap, HCMC',
//         '654 Truong Chinh, Tan Binh, HCMC',
//         '987 Cach Mang Thang Tam, Phu Nhuan, HCMC',
//         '159 Ha Noi, District 11, HCMC',
//         '753 Hanoi, Nha Be, HCMC',
//         '456 Tran Hung Dao, Can Tho',
//         '789 Nguyen Hue, Da Nang',
//     ];

//     const coordinates = [
//         { lat: 10.77562, lng: 106.70221 },
//         { lat: 10.73291, lng: 106.71863 },
//         { lat: 10.81273, lng: 106.70441 },
//         { lat: 10.78265, lng: 106.63420 },
//         { lat: 10.80542, lng: 106.65390 },
//         { lat: 10.79186, lng: 106.68935 },
//         { lat: 10.85142, lng: 106.74628 },
//         { lat: 10.67502, lng: 106.77826 },
//         { lat: 10.04957, lng: 105.74660 },
//         { lat: 16.07243, lng: 108.22159 },
//     ];

//     for (let i = 0; i < 10; i++) {
//         const station = await prisma.station.create({
//             data: {
//                 name: stationNames[i],
//                 address: stationAddresses[i],
//                 latitude: coordinates[i].lat,
//                 longitude: coordinates[i].lng,
//                 status: i % 3 === 2 ? 'maintenance' : 'active',
//             },
//         });
//         stations.push(station);
//     }

//     console.log(`   ✓ Created 10 stations`);

//     // Assign reference stations
//     station1 = stations[0];
//     station2 = stations[1];
//     station3 = stations[2];

//     // 3. Create 10 Station Staff (1 staff per station)
//     console.log('👷 Seeding 10 station staff...');
//     const staffUsers = [];
//     for (let i = 0; i < 10; i++) {
//         const staff = await prisma.user.create({
//             data: {
//                 username: `Staff Station ${i + 1}`,
//                 password: hashedPassword,
//                 phone: `09${String(50 + i).padStart(2, '0')}0000${String(i).padStart(2, '0')}`,
//                 email: `staff${i + 1}@evswap.com`,
//                 role: 'station_staff',
//                 station_id: stations[i].station_id,
//                 email_verified: true,
//                 status: 'active',
//             },
//         });
//         staffUsers.push(staff);
//     }

//     console.log(`   ✓ Created 10 station staff`);

//     // Assign reference staff
//     staff1 = staffUsers[0];
//     staff2 = staffUsers[1];
//     staff3 = staffUsers[2];

//     // 4. Seed Cabinets (1-2 cabinets per station, total ~12 cabinets)
//     console.log('🗄️  Seeding cabinets...');
//     const cabinets = [];
//     for (let i = 0; i < 10; i++) {
//         // Each station has 1-2 cabinets
//         const cabinetCount = i % 3 === 0 ? 2 : 1;
//         for (let j = 0; j < cabinetCount; j++) {
//             const cabinet = await prisma.cabinet.create({
//                 data: {
//                     station_id: stations[i].station_id,
//                     cabinet_name: `Cabinet ${String.fromCharCode(65 + j)}`,
//                     total_slots: 15, // Each cabinet has exactly 15 slots
//                     status: (i + j) % 5 === 0 ? 'maintenance' : 'active',
//                 },
//             });
//             cabinets.push(cabinet);
//         }
//     }

//     console.log(`   ✓ Created ${cabinets.length} cabinets`);

//     // 5. Seed Slots (15 slots per cabinet, 50% occupied)
//     console.log('📦 Seeding slots...');
//     const slots: Slot[] = [];
//     for (const cabinet of cabinets) {
//         for (let i = 1; i <= 15; i++) {
//             const slot = await prisma.slot.create({
//                 data: {
//                     cabinet_id: cabinet.cabinet_id,
//                     slot_number: i,
//                     is_occupied: i <= Math.ceil(15 * 0.5), // 50% occupied
//                 },
//             });
//             slots.push(slot);
//         }
//     }
//     console.log(`   ✓ Created ${slots.length} slots (15 per cabinet)`);

//     // 6. Seed 100 Batteries (distributed across slots, all same model/type)
//     console.log('🔋 Seeding 100 batteries...');
//     const batteries: Battery[] = [];
//     const BATTERY_MODEL = 'VinFast Standard';
//     const BATTERY_TYPE = 'Lithium-Ion';

//     let batteryCount = 0;
//     for (let i = 0; i < slots.length && batteryCount < 100; i++) {
//         const slot = slots[i];
//         if (slot.is_occupied && batteryCount < 100) {
//             const battery = await prisma.battery.create({
//                 data: {
//                     serial_number: `BAT-${String(batteryCount + 1).padStart(4, '0')}`,
//                     station_id: cabinets[Math.floor(i / 15)].station_id,
//                     cabinet_id: slot.cabinet_id,
//                     slot_id: slot.slot_id,
//                     model: BATTERY_MODEL,
//                     type: BATTERY_TYPE,
//                     capacity: 75.5,
//                     current_charge: 70 + (batteryCount % 30),
//                     soh: 90 + (batteryCount % 10) * 0.5,
//                     status: batteryCount % 3 === 0 ? 'charging' : 'full',
//                 },
//             });
//             batteries.push(battery);
//             batteryCount++;
//         }
//     }

//     console.log(`   ✓ Created ${batteries.length} batteries (${BATTERY_MODEL})`);

//     // 7. Seed 10 Vehicles (1 vehicle per driver, assigned battery)
//     console.log('🚗 Seeding 10 vehicles...');
//     const vehicles = [];
//     for (let i = 0; i < 10; i++) {
//         const vehicle = await prisma.vehicle.create({
//             data: {
//                 user_id: drivers[i].user_id,
//                 battery_id: batteries[i % batteries.length].battery_id,
//                 vin: `VIN${String(i + 1).padStart(14, '0')}`,
//                 battery_model: BATTERY_MODEL,
//                 battery_type: BATTERY_TYPE,
//                 status: 'active',
//             },
//         });
//         vehicles.push(vehicle);
//     }

//     console.log(`   ✓ Created 10 vehicles`);

//     // 8. Seed Configs
//     console.log('⚙️  Seeding configs...');
//     await prisma.config.createMany({
//         data: [
//             {
//                 type: 'deposit',
//                 name: 'Battery Deposit',
//                 value: 500000,
//                 description: 'Battery deposit fee',
//                 is_active: true,
//             },
//             {
//                 type: 'swap_fee',
//                 name: 'Standard Swap Fee',
//                 value: 50000,
//                 description: 'Standard battery swap fee',
//                 is_active: true,
//             },
//             {
//                 type: 'late_fee',
//                 name: 'Late Return Fee',
//                 value: 10000,
//                 description: 'Fee for late battery return per hour',
//                 is_active: true,
//             },
//             {
//                 type: 'damage_fee',
//                 name: 'Battery Damage Fee',
//                 value: 100000,
//                 description: 'Fee for damaged battery',
//                 is_active: true,
//             },
//         ],
//     });
//     console.log(`   ✓ Created 4 configs`);

//     // 9. Seed Battery Service Packages
//     console.log('📦 Seeding battery service packages...');
//     const basicPackage = await prisma.batteryServicePackage.create({
//         data: {
//             name: 'Basic Package',
//             battery_count: 1,
//             base_distance: 1000,
//             base_price: 500000,
//             swap_count: 10,
//             penalty_fee: 50000,
//             duration_days: 30,
//             description: 'Perfect for light users',
//             active: true,
//         },
//     });

//     const standardPackage = await prisma.batteryServicePackage.create({
//         data: {
//             name: 'Standard Package',
//             battery_count: 1,
//             base_distance: 2000,
//             base_price: 900000,
//             swap_count: 20,
//             penalty_fee: 45000,
//             duration_days: 30,
//             description: 'Most popular package',
//             active: true,
//         },
//     });

//     const premiumPackage = await prisma.batteryServicePackage.create({
//         data: {
//             name: 'Premium Package',
//             battery_count: 2,
//             base_distance: 5000,
//             base_price: 2000000,
//             swap_count: 50,
//             penalty_fee: 40000,
//             duration_days: 30,
//             description: 'Unlimited swaps for heavy users',
//             active: true,
//         },
//     });

//     console.log(`   ✓ Created 3 battery service packages`);

//     // 10. Seed Subscriptions
//     console.log('📋 Seeding subscriptions...');
//     const subscription1 = await prisma.subscription.create({
//         data: {
//             user_id: drivers[0].user_id,
//             package_id: standardPackage.package_id,
//             vehicle_id: vehicles[0].vehicle_id,
//             start_date: new Date(),
//             end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//             status: 'active',
//             swap_used: 5,
//             distance_traveled: 850.5,
//         },
//     });

//     const subscription2 = await prisma.subscription.create({
//         data: {
//             user_id: drivers[1].user_id,
//             package_id: basicPackage.package_id,
//             vehicle_id: vehicles[1].vehicle_id,
//             start_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
//             end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
//             status: 'expired',
//             swap_used: 10,
//             distance_traveled: 1000.0,
//         },
//     });

//     console.log(`   ✓ Created 2 subscriptions`);

//     // 11. Seed Payments
//     console.log('💰 Seeding payments...');
//     await prisma.payment.create({
//         data: {
//             user_id: drivers[0].user_id,
//             amount: 900000,
//             payment_time: new Date(),
//             method: 'vnpay',
//             status: 'success',
//             payment_type: 'subscription',
//             order_info: 'Standard Package Payment',
//             package_id: standardPackage.package_id,
//             subscription_id: subscription1.subscription_id,
//             vehicle_id: vehicles[0].vehicle_id,
//             transaction_id: 'TXN' + Date.now() + '001',
//             vnp_txn_ref: 'VNPAY' + Date.now() + '001',
//             vnp_bank_code: 'NCB',
//             vnp_card_type: 'ATM',
//             vnp_response_code: '00',
//         },
//     });

//     await prisma.payment.create({
//         data: {
//             user_id: drivers[1].user_id,
//             amount: 500000,
//             payment_time: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
//             method: 'credit_card',
//             status: 'success',
//             payment_type: 'subscription',
//             order_info: 'Basic Package Payment',
//             package_id: basicPackage.package_id,
//             subscription_id: subscription2.subscription_id,
//             vehicle_id: vehicles[1].vehicle_id,
//             transaction_id: 'TXN' + Date.now() + '002',
//         },
//     });

//     await prisma.payment.create({
//         data: {
//             user_id: drivers[0].user_id,
//             amount: 2000000,
//             method: 'vnpay',
//             status: 'pending',
//             payment_type: 'subscription',
//             order_info: 'Premium Package Payment',
//             package_id: premiumPackage.package_id,
//             vnp_txn_ref: 'VNPAY' + Date.now() + '003',
//         },
//     });

//     console.log(`   ✓ Created 3 payments`);

//     // 12. Seed Reservations
//     console.log('📅 Seeding reservations...');
//     await prisma.reservation.create({
//         data: {
//             user_id: drivers[0].user_id,
//             vehicle_id: vehicles[0].vehicle_id,
//             battery_id: batteries[2].battery_id,
//             station_id: stations[0].station_id,
//             scheduled_time: new Date(Date.now() + 2 * 60 * 60 * 1000),
//             status: 'scheduled',
//         },
//     });

//     await prisma.reservation.create({
//         data: {
//             user_id: drivers[1].user_id,
//             vehicle_id: vehicles[1].vehicle_id,
//             battery_id: batteries[7].battery_id,
//             station_id: stations[1].station_id,
//             scheduled_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
//             status: 'completed',
//         },
//     });

//     console.log(`   ✓ Created 2 reservations`);

//     // 13. Seed Swap Transactions
//     console.log('🔄 Seeding swap transactions...');
//     await prisma.swapTransaction.create({
//         data: {
//             user_id: drivers[0].user_id,
//             vehicle_id: vehicles[0].vehicle_id,
//             station_id: stations[0].station_id,
//             cabinet_id: cabinets[0].cabinet_id,
//             battery_taken_id: batteries[0].battery_id,
//             battery_returned_id: batteries[1].battery_id,
//             status: 'completed',
//             subscription_id: subscription1.subscription_id,
//         },
//     });

//     await prisma.swapTransaction.create({
//         data: {
//             user_id: drivers[1].user_id,
//             vehicle_id: vehicles[1].vehicle_id,
//             station_id: stations[1].station_id,
//             cabinet_id: cabinets[1].cabinet_id,
//             battery_taken_id: batteries[5].battery_id,
//             battery_returned_id: batteries[6].battery_id,
//             status: 'completed',
//             subscription_id: subscription2.subscription_id,
//         },
//     });

//     await prisma.swapTransaction.create({
//         data: {
//             user_id: drivers[0].user_id,
//             vehicle_id: vehicles[0].vehicle_id,
//             station_id: stations[0].station_id,
//             cabinet_id: cabinets[0].cabinet_id,
//             battery_taken_id: batteries[2].battery_id,
//             status: 'completed',
//             subscription_id: subscription1.subscription_id,
//         },
//     });

//     await prisma.swapTransaction.create({
//         data: {
//             user_id: drivers[0].user_id,
//             vehicle_id: vehicles[0].vehicle_id,
//             station_id: stations[1].station_id,
//             cabinet_id: cabinets[1].cabinet_id,
//             battery_taken_id: batteries[7].battery_id,
//             battery_returned_id: batteries[8].battery_id,
//             status: 'failed',
//             subscription_id: subscription1.subscription_id,
//         },
//     });

//     console.log(`   ✓ Created 4 swap transactions`);

//     // 14. Seed Supports
//     console.log('🆘 Seeding support tickets...');
//     await prisma.support.create({
//         data: {
//             user_id: driver1.user_id,
//             station_id: station1.station_id,
//             type: 'battery_issue',
//             description: 'Battery not charging properly',
//             status: 'in_progress',
//             rating: null,
//         },
//     });

//     await prisma.support.create({
//         data: {
//             user_id: driver2.user_id,
//             station_id: station2.station_id,
//             type: 'station_issue',
//             description: 'Station equipment malfunction',
//             status: 'closed',
//             rating: 4,
//         },
//     });

//     await prisma.support.create({
//         data: {
//             user_id: driver1.user_id,
//             type: 'other',
//             description: 'Question about subscription renewal',
//             status: 'open',
//         },
//     });

//     console.log(`   ✓ Created 3 support tickets`);

//     // 15. Seed Battery Transfer Requests
//     console.log('📦 Seeding battery transfer requests...');
//     const transferRequest1 = await prisma.batteryTransferRequest.create({
//         data: {
//             battery_model: BATTERY_MODEL,
//             battery_type: BATTERY_TYPE,
//             quantity: 3,
//             from_station_id: station1.station_id,
//             to_station_id: station2.station_id,
//             status: 'completed',
//             created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//         },
//     });

//     const transferRequest2 = await prisma.batteryTransferRequest.create({
//         data: {
//             battery_model: BATTERY_MODEL,
//             battery_type: BATTERY_TYPE,
//             quantity: 2,
//             from_station_id: station2.station_id,
//             to_station_id: station3.station_id,
//             status: 'in_progress',
//             created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//         },
//     });

//     const transferRequest3 = await prisma.batteryTransferRequest.create({
//         data: {
//             battery_model: BATTERY_MODEL,
//             battery_type: BATTERY_TYPE,
//             quantity: 4,
//             from_station_id: station3.station_id,
//             to_station_id: station1.station_id,
//             status: 'cancelled',
//             created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//         },
//     });

//     console.log(`   ✓ Created 3 battery transfer requests`);

//     // 16. Seed Battery Transfer Tickets
//     console.log('🎫 Seeding battery transfer tickets...');

//     // Export ticket from Station 1 (completed request)
//     const exportTicket1 = await prisma.batteryTransferTicket.create({
//         data: {
//             transfer_request_id: transferRequest1.transfer_request_id,
//             ticket_type: 'export',
//             station_id: station1.station_id,
//             staff_id: staff1.user_id,
//             created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//         },
//     });

//     // Import ticket to Station 2 (completed request)
//     const importTicket1 = await prisma.batteryTransferTicket.create({
//         data: {
//             transfer_request_id: transferRequest1.transfer_request_id,
//             ticket_type: 'import',
//             station_id: station2.station_id,
//             staff_id: staff2.user_id,
//             created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
//         },
//     });

//     // Export ticket from Station 2 (in progress request)
//     const exportTicket2 = await prisma.batteryTransferTicket.create({
//         data: {
//             transfer_request_id: transferRequest2.transfer_request_id,
//             ticket_type: 'export',
//             station_id: station2.station_id,
//             staff_id: staff2.user_id,
//             created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//         },
//     });

//     console.log(`   ✓ Created 3 battery transfer tickets`);

//     // 17. Seed Batteries Transfer (linking batteries to tickets)
//     console.log('🔗 Seeding batteries transfer records...');

//     // For completed transfer (request 1)
//     await prisma.batteriesTransfer.createMany({
//         data: [
//             {
//                 ticket_id: exportTicket1.ticket_id,
//                 battery_id: batteries[1].battery_id,
//             },
//             {
//                 ticket_id: exportTicket1.ticket_id,
//                 battery_id: batteries[2].battery_id,
//             },
//             {
//                 ticket_id: exportTicket1.ticket_id,
//                 battery_id: batteries[3].battery_id,
//             },
//             {
//                 ticket_id: importTicket1.ticket_id,
//                 battery_id: batteries[1].battery_id,
//             },
//             {
//                 ticket_id: importTicket1.ticket_id,
//                 battery_id: batteries[2].battery_id,
//             },
//             {
//                 ticket_id: importTicket1.ticket_id,
//                 battery_id: batteries[3].battery_id,
//             },
//         ],
//     });

//     // For in-progress transfer (request 2)
//     await prisma.batteriesTransfer.createMany({
//         data: [
//             {
//                 ticket_id: exportTicket2.ticket_id,
//                 battery_id: batteries[6].battery_id,
//             },
//             {
//                 ticket_id: exportTicket2.ticket_id,
//                 battery_id: batteries[7].battery_id,
//             },
//         ],
//     });

//     console.log(`   ✓ Created 8 batteries transfer records`);

//     console.log('\n✅ Database seeding completed successfully!\n');

//     // Summary
//     console.log('📊 Seeding Summary:');
//     console.log('   Users:', await prisma.user.count());
//     console.log('   Stations:', await prisma.station.count());
//     console.log('   Cabinets:', await prisma.cabinet.count());
//     console.log('   Slots:', await prisma.slot.count());
//     console.log('   Batteries:', await prisma.battery.count());
//     console.log('   Vehicles:', await prisma.vehicle.count());
//     console.log('   Configs:', await prisma.config.count());
//     console.log('   Packages:', await prisma.batteryServicePackage.count());
//     console.log('   Subscriptions:', await prisma.subscription.count());
//     console.log('   Payments:', await prisma.payment.count());
//     console.log('   Reservations:', await prisma.reservation.count());
//     console.log('   Swap Transactions:', await prisma.swapTransaction.count());
//     console.log('   Support Tickets:', await prisma.support.count());
//     console.log('   Battery Transfer Requests:', await prisma.batteryTransferRequest.count());
//     console.log('   Battery Transfer Tickets:', await prisma.batteryTransferTicket.count());
//     console.log('   Batteries Transfer Records:', await prisma.batteriesTransfer.count());
// }

// main()
//     .catch((e) => {
//         console.error('❌ Error seeding database:', e);
//         process.exit(1);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });
