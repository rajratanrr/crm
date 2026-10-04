import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllTables() {
  console.log('===============================================================');
  console.log('CHECKING ALL TABLES AND RELATIONS IN DATABASE (NEON POSTGRES)');
  console.log('===============================================================\n');

  const models: { name: string; query: () => Promise<number> }[] = [
    { name: 'Users', query: () => prisma.user.count() },
    { name: 'Customers (Clients)', query: () => prisma.customer.count() },
    { name: 'Leads', query: () => prisma.lead.count() },
    { name: 'Projects', query: () => prisma.project.count() },
    { name: 'Events', query: () => prisma.event.count() },
    { name: 'Event Sub-Events', query: () => prisma.eventSubEvent.count() },
    { name: 'Packages', query: () => prisma.package.count() },
    { name: 'Package Services', query: () => prisma.packageService.count() },
    { name: 'Shared Packages', query: () => prisma.sharedPackage.count() },
    { name: 'Contracts', query: () => prisma.contract.count() },
    { name: 'Contract Items', query: () => prisma.contractItem.count() },
    { name: 'Payments', query: () => prisma.payment.count() },
    { name: 'Invoices', query: () => prisma.invoice.count() },
    { name: 'Employees', query: () => prisma.employee.count() },
    { name: 'Event Assignments', query: () => prisma.eventAssignment.count() },
    { name: 'Interactions', query: () => prisma.interaction.count() },
    { name: 'Tasks', query: () => prisma.task.count() },
    { name: 'Deliverables', query: () => prisma.deliverable.count() },
    { name: 'Notifications', query: () => prisma.notification.count() },
    { name: 'Fashion Models', query: () => prisma.model.count() },
    { name: 'Garment Requirements', query: () => prisma.fashionGarmentRequirement.count() },
    { name: 'Project Model Assignments', query: () => prisma.fashionProjectModel.count() },
    { name: 'Client Model Rates', query: () => prisma.fashionClientModel.count() },
    { name: 'Model Payments', query: () => prisma.modelPayment.count() },
    { name: 'Garments', query: () => prisma.garment.count() },
    { name: 'Studio Bookings', query: () => prisma.studioBooking.count() },
    { name: 'Attendance Records', query: () => prisma.attendance.count() },
    { name: 'Expense Records', query: () => prisma.expense.count() },
  ];

  let successCount = 0;
  for (const m of models) {
    try {
      const count = await m.query();
      console.log(`✅ ${m.name.padEnd(30)} : CONNECTED (${count} records)`);
      successCount++;
    } catch (err: any) {
      console.error(`❌ ${m.name.padEnd(30)} : FAILED (${err.message})`);
    }
  }

  console.log('\n===============================================================');
  console.log(`RESULT: ${successCount} OF ${models.length} DATABASE TABLES ARE FULLY CONNECTED!`);
  console.log('===============================================================');
}

checkAllTables()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
