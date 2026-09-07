import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing Studio CRM database...');

  // Clear existing records
  await prisma.notification.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.task.deleteMany();
  await prisma.eventAssignment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.contractItem.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.eventSubEvent.deleteMany();
  await prisma.event.deleteMany();
  await prisma.packageService.deleteMany();
  await prisma.package.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  // Create clean initial Admin user
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Studio Owner',
      email: 'admin@studio.com',
      passwordHash,
      role: 'OWNER',
      phone: '9876543210',
    },
  });

  console.log(`✅ Clean database initialized successfully!`);
  console.log(`📧 Admin account: ${admin.email} (Password: Admin@123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
