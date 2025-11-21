// import { PrismaClient, ConfigType } from '@prisma/client';

// const prisma = new PrismaClient();

// async function seedPaymentConfigs() {
//   console.log('🌱 Seeding payment system configs...');

//   const configs = [
//     {
//       name: 'Payment_Expiry_Enabled',
//       type: ConfigType.system,
//       string_value: 'true', // Boolean as string
//       description: 'Enable auto-cancel for expired pending payments',
//       is_active: true,
//     },
//     {
//       name: 'Payment_Expiry_Minutes',
//       type: ConfigType.system,
//       string_value: '15', // Number as string
//       description: 'Payment expiry time in minutes (default: 15)',
//       is_active: true,
//     },
//     {
//       name: 'Payment_Expiry_Check_Interval',
//       type: ConfigType.system,
//       string_value: '5', // Number as string
//       description: 'How often to check for expired payments in minutes (default: 5)',
//       is_active: true,
//     },
//   ];

//   for (const config of configs) {
//     await prisma.config.upsert({
//       where: { name: config.name },
//       update: config,
//       create: config,
//     });
//     console.log(`  ✓ ${config.name}: ${config.string_value}`);
//   }

//   console.log('✅ Payment system configs seeded successfully!\n');
// }

// seedPaymentConfigs()
//   .catch((e) => {
//     console.error('❌ Error seeding payment configs:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
