import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Port of the old Spring DataInitializer: create the first admin only when the DB is empty.
async function main() {
  if ((await prisma.user.count()) > 0) {
    console.log('Database already initialized.');
    return;
  }
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD to seed the first administrator.');
  }
  await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 10),
      fullName: process.env.ADMIN_NAME || 'Administrator',
      phone: process.env.ADMIN_PHONE || null,
      department: 'Administration',
      role: 'ROLE_ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`Admin created: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
