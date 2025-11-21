import { PrismaClient } from '@prisma/client';
import { hashSync, genSaltSync } from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  const password = 'password123';
  const saltRounds = 10;
  const salt = genSaltSync(saltRounds);
  const hashed = hashSync(password, salt);

  console.log('Hashing password:', password);
  console.log('New hash:', hashed);

  const updatedUser = await prisma.user.update({
    where: { phone: '1234567890' },
    data: { password: hashed }
  });

  console.log('User updated:', {
    user_id: updatedUser.user_id,
    username: updatedUser.username,
    phone: updatedUser.phone,
    password_hash: updatedUser.password
  });

  await prisma.$disconnect();
}

resetPassword().catch(console.error);
