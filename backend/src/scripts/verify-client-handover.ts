import { PrismaClient, BusinessDomain, PaymentMethod, PaymentType, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

function isReceived(status: PaymentStatus | null | undefined): boolean {
  if (!status) return true;
  return status === 'ADVANCE' || status === 'DONE';
}

async function main() {
  console.log('====================================================');
  console.log('1. VERIFYING DATABASE CONNECTION (NEON POSTGRES)');
  console.log('====================================================');
  
  const startTime = Date.now();
  const [userCount, customerCount, projectCount, paymentCount, employeeCount, modelCount] = await Promise.all([
    prisma.user.count(),
    prisma.customer.count(),
    prisma.project.count(),
    prisma.payment.count(),
    prisma.employee.count(),
    prisma.model.count(),
  ]);
  const latency = Date.now() - startTime;

  console.log(`✅ DB Connection OK! (${latency}ms)`);
  console.log(`Live Counts in Neon PostgreSQL:`);
  console.log(`- Users: ${userCount}`);
  console.log(`- Customers: ${customerCount}`);
  console.log(`- Projects: ${projectCount}`);
  console.log(`- Payments: ${paymentCount}`);
  console.log(`- Employees: ${employeeCount}`);
  console.log(`- Models: ${modelCount}`);

  console.log('\n====================================================');
  console.log('2. TESTING PAYMENT AGGREGATION & LIFECYCLE (ONE CLIENT = ONE ROW)');
  console.log('====================================================');

  const testCustomerCode = 'CUST-T-' + Date.now();
  const testProjectNumber = 'PRJ-T-' + Date.now();

  // Create test customer
  const customer = await prisma.customer.create({
    data: {
      customerCode: testCustomerCode,
      fullName: 'Handover Test Couple (Ashish & Garima)',
      email: `couple_${Date.now()}@example.com`,
      phone: '9876543210',
      clientType: 'WEDDING',
    }
  });
  console.log(`Created test customer: ${customer.fullName} (${customer.id})`);

  // Create test wedding project with total budget ₹100,000
  const project = await prisma.project.create({
    data: {
      projectNumber: testProjectNumber,
      name: 'Ashish & Garima Grand Wedding',
      projectType: 'WEDDING',
      status: 'CONFIRMED',
      customerId: customer.id,
      budget: 100000,
    }
  });
  console.log(`Created test wedding project: ${project.name} | Budget: ₹${project.budget}`);

  // This replicates the EXACT controller logic in getPaymentsByClient
  async function fetchClientRows(domain: BusinessDomain = 'WEDDING') {
    const paymentWhere: any = { domain };
    const projectWhere: any = { projectType: domain };

    const [allPayments, allProjects] = await Promise.all([
      prisma.payment.findMany({
        where: paymentWhere,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: { select: { id: true, fullName: true, phone: true, email: true } },
          project: { select: { id: true, name: true, projectNumber: true, projectType: true, budget: true } },
        },
      }),
      prisma.project.findMany({
        where: projectWhere,
        select: {
          id: true,
          name: true,
          projectNumber: true,
          projectType: true,
          budget: true,
          customerId: true,
          customer: { select: { id: true, fullName: true, phone: true, email: true } },
        },
      }),
    ]);

    const customerMap = new Map<string, {
      customer: any;
      projects: Map<string, any>;
      payments: any[];
    }>();

    for (const prj of allProjects) {
      const custId = prj.customerId || 'unassigned';
      if (!customerMap.has(custId)) {
        customerMap.set(custId, {
          customer: prj.customer || { id: custId, fullName: 'Direct Client', phone: '' },
          projects: new Map(),
          payments: [],
        });
      }
      customerMap.get(custId)!.projects.set(prj.id, prj);
    }

    for (const p of allPayments) {
      const custId = p.customerId || 'unassigned';
      if (!customerMap.has(custId)) {
        customerMap.set(custId, {
          customer: p.customer || { id: custId, fullName: 'Direct Client', phone: '' },
          projects: new Map(),
          payments: [],
        });
      }
      const entry = customerMap.get(custId)!;
      entry.payments.push(p);
      if (p.project) {
        entry.projects.set(p.project.id, p.project);
      }
    }

    return Array.from(customerMap.values())
      .filter(entry => entry.customer.id === customer.id)
      .map(entry => {
        const projectList = Array.from(entry.projects.values());
        const projectTotalBudget = projectList.reduce((sum, prj) => sum + (Number(prj.budget) || 0), 0);
        const receivedPayments = entry.payments.filter(p => isReceived(p.paymentStatus));
        const totalPaid = receivedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const pendingPaymentRecords = entry.payments.filter(p => !isReceived(p.paymentStatus));
        const pendingRecordAmount = pendingPaymentRecords.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const totalAmount = projectTotalBudget > 0 ? projectTotalBudget : (totalPaid + pendingRecordAmount);
        const pendingAmount = Math.max(0, totalAmount - totalPaid);

        return {
          customerId: entry.customer.id,
          clientName: entry.customer.fullName,
          totalAmount,
          totalPaid,
          pendingAmount,
          paymentsCount: entry.payments.length,
        };
      });
  }

  // STEP A: No payments yet
  let rows = await fetchClientRows('WEDDING');
  console.log(`\nStep A (0 payments): Found ${rows.length} row(s) for client. Total: ₹${rows[0]?.totalAmount}, Paid: ₹${rows[0]?.totalPaid}, Pending: ₹${rows[0]?.pendingAmount}`);
  if (rows.length !== 1 || rows[0].totalPaid !== 0 || rows[0].pendingAmount !== 100000) {
    throw new Error('Step A failed: initial aggregation mismatch');
  }
  console.log('✅ PASS Step A: Client exists as 1 row, Budget ₹100,000, Paid ₹0, Pending ₹100,000');

  // STEP B: Add Payment 1 (₹40,000 Advance)
  const pay1 = await prisma.payment.create({
    data: {
      customerId: customer.id,
      projectId: project.id,
      domain: 'WEDDING',
      amount: 40000,
      paymentMethod: 'BANK_TRANSFER',
      paymentType: 'ADVANCE',
      paymentStatus: 'ADVANCE',
      notes: 'Initial Advance for Wedding Shoot',
      paymentDate: new Date(),
    }
  });
  console.log(`\nStep B: Added Payment 1 (₹40,000, ID: ${pay1.id})`);

  rows = await fetchClientRows('WEDDING');
  console.log(`Result: Found ${rows.length} row(s). Client: ${rows[0].clientName} | Total: ₹${rows[0].totalAmount}, Paid: ₹${rows[0].totalPaid}, Pending: ₹${rows[0].pendingAmount}`);
  if (rows.length !== 1) throw new Error('Failed: More than 1 row formed!');
  if (rows[0].totalPaid !== 40000 || rows[0].pendingAmount !== 60000) throw new Error('Calculation mismatch!');
  console.log('✅ PASS Step B: Exactly 1 row! Total Paid: ₹40,000, Pending: ₹60,000');

  // STEP C: Add Payment 2 (₹25,000) for the SAME client/project
  const pay2 = await prisma.payment.create({
    data: {
      customerId: customer.id,
      projectId: project.id,
      domain: 'WEDDING',
      amount: 25000,
      paymentMethod: 'UPI',
      paymentType: 'INSTALLMENT',
      paymentStatus: 'DONE',
      notes: 'Second installment for Wedding Shoot',
      paymentDate: new Date(),
    }
  });
  console.log(`\nStep C: Added Payment 2 (₹25,000, ID: ${pay2.id}) for the same client`);

  rows = await fetchClientRows('WEDDING');
  console.log(`Result: Found ${rows.length} row(s). Client: ${rows[0].clientName} | Total: ₹${rows[0].totalAmount}, Paid: ₹${rows[0].totalPaid}, Pending: ₹${rows[0].pendingAmount}, Payments: ${rows[0].paymentsCount}`);
  if (rows.length !== 1) throw new Error('FAILED: Duplicate row formed when adding 2nd payment for the same client!');
  if (rows[0].totalPaid !== 65000 || rows[0].pendingAmount !== 35000) throw new Error('Calculation mismatch!');
  console.log('✅ PASS Step C: STILL EXACTLY 1 ROW (Row was updated!). Paid: ₹65,000, Pending: ₹35,000, Total Payments: 2');

  // STEP D: Update Payment 2 (Change ₹25,000 -> ₹35,000)
  await prisma.payment.update({
    where: { id: pay2.id },
    data: { amount: 35000, notes: 'Updated second installment to 35k' }
  });
  console.log(`\nStep D: Updated Payment 2 from ₹25,000 to ₹35,000`);

  rows = await fetchClientRows('WEDDING');
  console.log(`Result: Found ${rows.length} row(s). Total: ₹${rows[0].totalAmount}, Paid: ₹${rows[0].totalPaid}, Pending: ₹${rows[0].pendingAmount}`);
  if (rows.length !== 1) throw new Error('FAILED: Duplicate row formed after update!');
  if (rows[0].totalPaid !== 75000 || rows[0].pendingAmount !== 25000) throw new Error('Calculation mismatch!');
  console.log('✅ PASS Step D: Exactly 1 row updated! Paid: ₹75,000, Pending: ₹25,000');

  // STEP E: Delete Payment 2
  await prisma.payment.delete({
    where: { id: pay2.id }
  });
  console.log(`\nStep E: Deleted Payment 2`);

  rows = await fetchClientRows('WEDDING');
  console.log(`Result: Found ${rows.length} row(s). Total: ₹${rows[0].totalAmount}, Paid: ₹${rows[0].totalPaid}, Pending: ₹${rows[0].pendingAmount}`);
  if (rows.length !== 1) throw new Error('FAILED: Duplicate row formed after delete!');
  if (rows[0].totalPaid !== 40000 || rows[0].pendingAmount !== 60000) throw new Error('Calculation mismatch!');
  console.log('✅ PASS Step E: Exactly 1 row maintained! Paid: ₹40,000, Pending: ₹60,000');

  // STEP F: Simulate site reload (cold query directly from Neon PostgreSQL)
  console.log(`\nStep F: Simulating site reload (re-querying database directly)...`);
  const reloadClient = await prisma.customer.findUnique({
    where: { id: customer.id },
    include: {
      projects: {
        include: { payments: true }
      }
    }
  });
  console.log(`Persisted Client in DB: "${reloadClient?.fullName}"`);
  console.log(`Projects persisted: ${reloadClient?.projects.length}`);
  console.log(`Payments persisted: ${reloadClient?.projects[0]?.payments.length} payment of ₹${reloadClient?.projects[0]?.payments[0]?.amount}`);
  if (!reloadClient || reloadClient.projects.length === 0 || reloadClient.projects[0].payments.length === 0) {
    throw new Error('Data was NOT persisted to DB on reload!');
  }
  console.log('✅ PASS Step F: Full data persistence verified in PostgreSQL! Data does NOT vanish on reload!');

  // Cleanup test data
  console.log('\nCleaning up verification records...');
  await prisma.payment.deleteMany({ where: { projectId: project.id } });
  await prisma.project.delete({ where: { id: project.id } });
  await prisma.customer.delete({ where: { id: customer.id } });
  console.log('Cleaned up test records successfully.');

  console.log('\n====================================================');
  console.log('🎉 ALL TESTS PASSED! READY FOR CLIENT HANDOVER.');
  console.log('====================================================');
}

main()
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
