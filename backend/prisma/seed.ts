import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Studio CRM database (safe — no data deletion)...');

  // ─── UPSERT Admin user (creates if missing, skips if already exists) ───
  const adminEmail = 'admin@studio.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    const admin = await prisma.user.create({
      data: {
        name: 'Studio Owner',
        email: adminEmail,
        passwordHash,
        role: 'OWNER',
        phone: '9876543210',
      },
    });
    console.log(`✅ Admin account created: ${admin.email} (Password: Admin@123)`);
  } else {
    console.log(`✅ Admin account already exists: ${existingAdmin.email} — skipped.`);
  }

  // ─── UPSERT Manager user ───
  const managerEmail = 'manager@studio.com';
  const existingManager = await prisma.user.findUnique({ where: { email: managerEmail } });

  if (!existingManager) {
    const passwordHash = await bcrypt.hash('Manager@123', 12);
    const manager = await prisma.user.create({
      data: {
        name: 'Studio Manager',
        email: managerEmail,
        passwordHash,
        role: 'MANAGER',
        phone: '9876543211',
      },
    });
    console.log(`✅ Manager account created: ${manager.email} (Password: Manager@123)`);
  } else {
    console.log(`✅ Manager account already exists: ${existingManager.email} — skipped.`);
  }

  // ─── UPSERT Sales user ───
  const salesEmail = 'sales@studio.com';
  const existingSales = await prisma.user.findUnique({ where: { email: salesEmail } });

  if (!existingSales) {
    const passwordHash = await bcrypt.hash('Sales@123', 12);
    const sales = await prisma.user.create({
      data: {
        name: 'Sales Executive',
        email: salesEmail,
        passwordHash,
        role: 'SALES',
        phone: '9876543212',
      },
    });
    console.log(`✅ Sales account created: ${sales.email} (Password: Sales@123)`);
  } else {
    console.log(`✅ Sales account already exists: ${existingSales.email} — skipped.`);
  }

  console.log(`\n🎉 Database seeding complete! No existing data was deleted.`);
  console.log(`\n📋 Available login credentials:`);
  console.log(`   Owner:   admin@studio.com   / Admin@123`);
  console.log(`   Manager: manager@studio.com / Manager@123`);
  console.log(`   Sales:   sales@studio.com   / Sales@123`);
  console.log(`\n💡 Owners & Managers can create more user accounts from the Team page.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
