// // prisma/clear-db.ts
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function clearDatabase() {
//     console.log('🗑️  Starting database cleanup...');

//     try {
//         // Delete in correct order to respect foreign key constraints
//         // (child tables first, then parent tables)

//         console.log('🔄 Deleting swap transactions...');
//         const deletedSwapTransactions = await prisma.swapTransaction.deleteMany();
//         console.log(`   ✓ Deleted ${deletedSwapTransactions.count} swap transactions`);

//         console.log('📅 Deleting reservations...');
//         const deletedReservations = await prisma.reservation.deleteMany();
//         console.log(`   ✓ Deleted ${deletedReservations.count} reservations`);

//         console.log('💰 Deleting payments...');
//         const deletedPayments = await prisma.payment.deleteMany();
//         console.log(`   ✓ Deleted ${deletedPayments.count} payments`);

//         console.log('🆘 Deleting support tickets...');
//         const deletedSupports = await prisma.support.deleteMany();
//         console.log(`   ✓ Deleted ${deletedSupports.count} support tickets`);

//         console.log('📋 Deleting subscriptions...');
//         const deletedSubscriptions = await prisma.subscription.deleteMany();
//         console.log(`   ✓ Deleted ${deletedSubscriptions.count} subscriptions`);

//         console.log('🔁 Deleting battery transfer requests...');
//         try {
//             const deletedTransferRequests = await prisma.batteryTransferRequest.deleteMany();
//             console.log(`   ✓ Deleted ${deletedTransferRequests.count} battery transfer requests`);
//         } catch (error: any) {
//             if (error.code === 'P2021') {
//                 console.log('   ⚠️  Battery transfer requests table does not exist yet, skipping...');
//             } else {
//                 throw error;
//             }
//         }

//         console.log('🚗 Deleting vehicles...');
//         const deletedVehicles = await prisma.vehicle.deleteMany();
//         console.log(`   ✓ Deleted ${deletedVehicles.count} vehicles`);

//         console.log('🔋 Deleting batteries...');
//         const deletedBatteries = await prisma.battery.deleteMany();
//         console.log(`   ✓ Deleted ${deletedBatteries.count} batteries`);

//         console.log('📦 Deleting battery service packages...');
//         const deletedPackages = await prisma.batteryServicePackage.deleteMany();
//         console.log(`   ✓ Deleted ${deletedPackages.count} battery service packages`);

//         console.log('🏪 Deleting stations...');
//         const deletedStations = await prisma.station.deleteMany();
//         console.log(`   ✓ Deleted ${deletedStations.count} stations`);

//         console.log('👥 Deleting users...');
//         const deletedUsers = await prisma.user.deleteMany();
//         console.log(`   ✓ Deleted ${deletedUsers.count} users`);

//         console.log('\n✅ Database cleared successfully!');

//         // Verify all tables are empty
//         console.log('\n📊 Verifying database is empty...');
//         const finalCounts: Record<string, number> = {
//             users: await prisma.user.count(),
//             stations: await prisma.station.count(),
//             batteries: await prisma.battery.count(),
//             batteryServicePackages: await prisma.batteryServicePackage.count(),
//             vehicles: await prisma.vehicle.count(),
//             reservations: await prisma.reservation.count(),
//             swapTransactions: await prisma.swapTransaction.count(),
//             subscriptions: await prisma.subscription.count(),
//             payments: await prisma.payment.count(),
//             supports: await prisma.support.count(),
//         };

//         // Try to count battery transfer requests if table exists
//         try {
//             finalCounts.batteryTransferRequests = await prisma.batteryTransferRequest.count();
//         } catch (error: any) {
//             if (error.code === 'P2021') {
//                 finalCounts.batteryTransferRequests = 0;
//             }
//         }

//         console.log('Final counts:', finalCounts);

//         // Check if database is truly empty
//         const totalRecords = Object.values(finalCounts).reduce((sum, count) => sum + count, 0);

//         if (totalRecords === 0) {
//             console.log('🎉 Database is completely empty!');
//         } else {
//             console.log(`⚠️  Warning: ${totalRecords} records still remain in database`);
//         }

//     } catch (error) {
//         console.error('❌ Error clearing database:', error);
//         throw error;
//     } finally {
//         await prisma.$disconnect();
//         console.log('📝 Database connection closed');
//     }
// }

// clearDatabase()
//     .then(() => {
//         console.log('🏁 Clear database script completed successfully');
//         process.exit(0);
//     })
//     .catch((error) => {
//         console.error('💥 Clear database script failed:', error);
//         process.exit(1);
//     });