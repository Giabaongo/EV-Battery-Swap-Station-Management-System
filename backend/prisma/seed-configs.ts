import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedConfigs() {
  try {
    // Delete existing configs
    await prisma.config.deleteMany();

    // Seed default configs
    const configs = await Promise.all([
      prisma.config.create({
        data: {
          type: 'deposit',
          name: 'Battery_Deposit_Default',
          value: 400000,
          description: 'Default battery deposit fee: 400,000 VNĐ',
          is_active: true,
        },
      }),
      prisma.config.create({
        data: {
          type: 'late_fee',
          name: 'Hourly_Late_Fee',
          value: 5000,
          description: 'Late return fee per hour',
          is_active: true,
        },
      }),
      prisma.config.create({
        data: {
          type: 'service_fee',
          name: 'Swap_Service_Fee',
          value: 2000,
          description: 'Fee for each battery swap transaction',
          is_active: true,
        },
      }),
      prisma.config.create({
        data: {
          type: 'penalty',
          name: 'Battery_Damage_Penalty',
          value: 50000,
          description: 'Penalty for battery damage',
          is_active: true,
        },
      }),
      prisma.config.create({
        data: {
          type: 'penalty',
          name: 'Equipment_Loss_Penalty',
          value: 100000,
          description: 'Penalty for losing equipment',
          is_active: true,
        },
      }),
      prisma.config.create({
        data: {
          type: 'swap_fee',
          name: 'Express_Swap_Fee',
          value: 5000,
          description: 'Additional fee for express swap service',
          is_active: true,
        },
      }),
      prisma.config.create({
        data: {
          type: 'damage_fee',
          name: 'Minor_Damage_Fee',
          value: 10000,
          description: 'Fee for minor damage to vehicles',
          is_active: true,
        },
      }),
      // Progressive overcharge fees - like electricity rates
      prisma.config.create({
        data: {
          type: 'penalty',
          name: 'Overcharge_Fee_Tier1',
          value: 216,
          description: 'Tier 1 (2000km over limit): 216 VNĐ',
          is_active: true,
        },
      }),
      prisma.config.create({
        data: {
          type: 'penalty',
          name: 'Overcharge_Fee_Tier2',
          value: 195,
          description: 'Tier 2 (2001 - 4000km over limit): 195 VNĐ',
          is_active: true,
        },
      }),
      prisma.config.create({
        data: {
          type: 'penalty',
          name: 'Overcharge_Fee_Tier3',
          value: 173,
          description: 'Tier 3 (4000km upper over limit): 173 VNĐ',
          is_active: true,
        },
      }),
    ]);

    console.log(`✓ Seeded ${configs.length} configs successfully`);
  } catch (error) {
    console.error('Error seeding configs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedConfigs();
