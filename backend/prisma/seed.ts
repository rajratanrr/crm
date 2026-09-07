import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const indianNames = [
  'Rajesh Sharma', 'Priya Verma', 'Amandeep Singh', 'Neha Gupta', 'Vikram Mehta',
  'Simran Kaur', 'Rohit Patel', 'Anita Rao', 'Deepak Kumar', 'Pooja Malhotra',
  'Suresh Joshi', 'Kavita Reddy', 'Manish Agarwal', 'Ritu Chopra', 'Arjun Nair',
  'Sunita Mishra', 'Karan Bhatia', 'Meera Iyer', 'Gaurav Saxena', 'Divya Pillai',
  'Amit Tiwari', 'Shweta Kapoor', 'Nitin Soni', 'Pallavi Das', 'Sanjay Dhawan',
  'Aditi Bansal', 'Varun Thakur', 'Nisha Pandey', 'Rahul Chauhan', 'Swati Jain',
  'Harpreet Gill', 'Komal Sethi', 'Pankaj Arora', 'Anjali Basu', 'Tarun Grover',
  'Bhavna Bhatt', 'Mohit Khanna', 'Sneha Kulkarni', 'Vivek Tandon', 'Isha Menon',
];

const cities = ['Chandigarh', 'Mohali', 'Panchkula', 'Delhi', 'Ludhiana', 'Amritsar', 'Patiala'];
const sources = ['Instagram', 'Facebook', 'Google', 'Referral', 'JustDial', 'Wedding Wire', 'Walk-in'];
const venues = ['Taj Hotel', 'Radisson', 'Hyatt Regency', 'Hotel Mountview', 'Lake Club', 'Sukhna Farmhouse', 'Royal Banquet', 'Green Valley Resort', 'Imperial Palace', 'The Lalit'];

function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function pad(n: number) { return String(n).padStart(4, '0'); }

async function main() {
  console.log('🌱 Seeding Studio CRM database...');

  // Clean existing data
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

  // 1. Users
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Studio Owner', email: 'admin@studio.com', passwordHash, role: 'OWNER', phone: '9876543210' } }),
    prisma.user.create({ data: { name: 'Studio Manager', email: 'manager@studio.com', passwordHash: await bcrypt.hash('Manager@123', 12), role: 'MANAGER', phone: '9876543211' } }),
    prisma.user.create({ data: { name: 'Sales Executive', email: 'sales@studio.com', passwordHash: await bcrypt.hash('Sales@123', 12), role: 'SALES', phone: '9876543212' } }),
    prisma.user.create({ data: { name: 'Accountant', email: 'accounts@studio.com', passwordHash: await bcrypt.hash('Accounts@123', 12), role: 'ACCOUNTANT', phone: '9876543213' } }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  // 2. Customers (40)
  const customers = [];
  for (let i = 0; i < 40; i++) {
    const c = await prisma.customer.create({
      data: {
        customerCode: `CUST-${pad(i + 1)}`,
        fullName: indianNames[i],
        phone: `98${randomInt(10000000, 99999999)}`,
        alternatePhone: Math.random() > 0.5 ? `97${randomInt(10000000, 99999999)}` : null,
        email: `${indianNames[i].toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        city: randomItem(cities),
        state: 'Punjab',
        pincode: `${randomInt(140001, 160099)}`,
        source: randomItem(sources),
        address: `${randomInt(1, 500)}, Sector ${randomInt(1, 63)}, ${randomItem(cities)}`,
      },
    });
    customers.push(c);
  }
  console.log(`✅ Created ${customers.length} customers`);

  // 3. Employees (15)
  const empNames = ['Gurpreet Singh', 'Harinder Kaur', 'Jaspal Sidhu', 'Manpreet Dhillon', 'Navjot Sandhu', 'Ramandeep Brar', 'Sukhvir Grewal', 'Tejinder Bajwa', 'Harjit Atwal', 'Jaswinder Mann', 'Kuldeep Johal', 'Lakhwinder Gill', 'Balwinder Randhawa', 'Daljit Sahota', 'Paramjit Virk'];
  const empRoles: any[] = ['PHOTOGRAPHER', 'PHOTOGRAPHER', 'PHOTOGRAPHER', 'VIDEOGRAPHER', 'VIDEOGRAPHER', 'VIDEOGRAPHER', 'DRONE_OPERATOR', 'EDITOR', 'EDITOR', 'EDITOR', 'ALBUM_DESIGNER', 'ALBUM_DESIGNER', 'MANAGER', 'SALES_EXECUTIVE', 'ACCOUNTANT'];
  const employees = [];
  for (let i = 0; i < 15; i++) {
    const e = await prisma.employee.create({
      data: {
        name: empNames[i], phone: `98${randomInt(10000000, 99999999)}`,
        email: `${empNames[i].toLowerCase().replace(/\s+/g, '.')}@studio.com`,
        role: empRoles[i],
        specialization: empRoles[i] === 'PHOTOGRAPHER' ? randomItem(['Wedding', 'Portrait', 'Candid']) : empRoles[i] === 'VIDEOGRAPHER' ? randomItem(['Cinematic', 'Traditional', 'Drone']) : null,
        availability: 'Full Time',
        joiningDate: randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31)),
      },
    });
    employees.push(e);
  }
  console.log(`✅ Created ${employees.length} employees`);

  // 4. Packages (6)
  const packageData = [
    { name: 'Classic Wedding', basePrice: 150000, duration: '2 Days', services: ['1 Photographer', '1 Videographer', 'Photo Editing', '200 Edited Photos', '1 Highlight Video'] },
    { name: 'Premium Wedding', basePrice: 250000, duration: '3 Days', services: ['2 Photographers', '1 Videographer', '1 Drone Operator', 'Photo Editing', '400 Edited Photos', '1 Cinematic Film', '1 Teaser', 'Wedding Album'] },
    { name: 'Luxury Wedding', basePrice: 400000, duration: '5 Days', services: ['3 Photographers', '2 Videographers', '1 Drone Operator', 'Photo Editing', '600+ Edited Photos', '1 Cinematic Film', '1 Highlight Video', '2 Teasers', '3 Reels', '2 Premium Albums'] },
    { name: 'Pre-Wedding Shoot', basePrice: 50000, duration: '1 Day', services: ['1 Photographer', '1 Videographer', '50 Edited Photos', '1 Pre-Wedding Video'] },
    { name: 'Birthday Party', basePrice: 30000, duration: '1 Day', services: ['1 Photographer', '100 Edited Photos', '1 Highlight Video'] },
    { name: 'Corporate Event', basePrice: 75000, duration: '1 Day', services: ['2 Photographers', '1 Videographer', '200 Edited Photos', '1 Event Video'] },
  ];
  const packages = [];
  for (const pd of packageData) {
    const pkg = await prisma.package.create({
      data: {
        name: pd.name, basePrice: pd.basePrice, duration: pd.duration,
        description: `Complete ${pd.name} package for your special day`,
        services: { create: pd.services.map((s) => ({ serviceName: s, quantity: 1 })) },
      },
    });
    packages.push(pkg);
  }
  console.log(`✅ Created ${packages.length} packages`);

  // 5. Leads (30)
  const leadStatuses: any[] = ['NEW', 'CONTACTED', 'MEETING_SCHEDULED', 'QUOTATION_SENT', 'NEGOTIATION', 'WON', 'LOST'];
  const eventTypes: any[] = ['WEDDING', 'PRE_WEDDING', 'ENGAGEMENT', 'RECEPTION', 'HALDI', 'MEHENDI', 'SANGEET', 'BIRTHDAY', 'CORPORATE'];
  for (let i = 0; i < 30; i++) {
    await prisma.lead.create({
      data: {
        customerId: customers[randomInt(0, 39)].id,
        eventType: randomItem(eventTypes),
        eventDate: randomDate(new Date(2025, 0, 1), new Date(2026, 11, 31)),
        estimatedBudget: randomItem([100000, 150000, 200000, 250000, 300000, 400000]),
        source: randomItem(sources),
        status: randomItem(leadStatuses),
        assignedTo: randomItem(users).id,
        notes: randomItem(['Interested in premium package', 'Budget conscious', 'Looking for destination wedding', 'Referred by existing client', 'Needs drone coverage', '']),
      },
    });
  }
  console.log('✅ Created 30 leads');

  // 6. Events (30) with sub-events
  const subEventNames = ['Haldi Ceremony', 'Mehendi', 'Sangeet Night', 'Wedding Ceremony', 'Reception', 'Ring Ceremony', 'Cocktail Party'];
  const events = [];
  for (let i = 0; i < 30; i++) {
    const startDate = randomDate(new Date(2024, 6, 1), new Date(2026, 11, 31));
    const endDate = new Date(startDate); endDate.setDate(endDate.getDate() + randomInt(1, 4));
    const eventType = randomItem(eventTypes) as any;
    const event = await prisma.event.create({
      data: {
        customerId: customers[i % 40].id,
        eventName: `${customers[i % 40].fullName.split(' ')[0]}'s ${eventType.charAt(0) + eventType.slice(1).toLowerCase().replace('_', ' ')}`,
        eventType,
        startDate, endDate,
        venue: `${randomItem(venues)}, ${randomItem(cities)}`,
        city: randomItem(cities),
        guestCount: randomInt(100, 1000),
        status: startDate < new Date() ? randomItem(['COMPLETED', 'IN_PROGRESS']) as any : 'UPCOMING',
        subEvents: eventType === 'WEDDING' ? {
          create: subEventNames.slice(0, randomInt(3, 6)).map((name, idx) => ({
            name,
            date: new Date(startDate.getTime() + idx * 86400000),
            venue: `${randomItem(venues)}, ${randomItem(cities)}`,
          })),
        } : undefined,
      },
    });
    events.push(event);
  }
  console.log(`✅ Created ${events.length} events with sub-events`);

  // 7. Contracts (25)
  const contractValues = [100000, 150000, 180000, 220000, 250000, 300000, 400000];
  const contracts = [];
  for (let i = 0; i < 25; i++) {
    const subtotal = randomItem(contractValues);
    const discount = randomItem([0, 5000, 10000, 15000, 20000]);
    const tax = 0;
    const finalAmount = subtotal - discount + tax;
    const pkg = packages[randomInt(0, 5)];
    const contract = await prisma.contract.create({
      data: {
        contractNumber: `CON-${pad(i + 1)}`,
        customerId: customers[i % 40].id,
        eventId: events[i % 30].id,
        packageId: pkg.id,
        contractDate: randomDate(new Date(2024, 0, 1), new Date(2026, 6, 1)),
        subtotal, discount, tax, finalAmount,
        status: randomItem(['DRAFT', 'SIGNED', 'ACTIVE', 'COMPLETED']) as any,
        termsAndConditions: 'Standard terms and conditions apply. 50% advance required at booking. Remaining amount due before event. Cancellation charges apply.',
        items: {
          create: [
            { serviceName: 'Photography', quantity: 1, unitPrice: subtotal * 0.4, totalPrice: subtotal * 0.4 },
            { serviceName: 'Videography', quantity: 1, unitPrice: subtotal * 0.35, totalPrice: subtotal * 0.35 },
            { serviceName: 'Editing & Post-production', quantity: 1, unitPrice: subtotal * 0.25, totalPrice: subtotal * 0.25 },
          ],
        },
      },
    });
    contracts.push(contract);
  }
  console.log(`✅ Created ${contracts.length} contracts with items`);

  // 8. Payments (50)
  const paymentMethods: any[] = ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE'];
  const paymentTypes: any[] = ['ADVANCE', 'INSTALLMENT', 'FINAL_PAYMENT'];
  for (let i = 0; i < 50; i++) {
    const contract = contracts[randomInt(0, 24)];
    const customer = customers.find((c) => c.id === contract.customerId) || customers[0];
    await prisma.payment.create({
      data: {
        contractId: contract.id,
        customerId: customer.id,
        amount: randomItem([25000, 50000, 75000, 100000, 30000, 40000]),
        paymentMethod: randomItem(paymentMethods),
        paymentType: randomItem(paymentTypes),
        paymentDate: randomDate(new Date(2024, 0, 1), new Date()),
        transactionId: Math.random() > 0.3 ? `TXN${randomInt(100000, 999999)}` : null,
      },
    });
  }
  console.log('✅ Created 50 payments');

  // 9. Invoices (25)
  for (let i = 0; i < 25; i++) {
    const contract = contracts[i];
    const customer = customers.find((c) => c.id === contract.customerId) || customers[0];
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${pad(i + 1)}`,
        contractId: contract.id,
        customerId: customer.id,
        issueDate: new Date(contract.contractDate),
        dueDate: new Date(new Date(contract.contractDate).getTime() + 30 * 86400000),
        subtotal: Number(contract.subtotal),
        discount: Number(contract.discount),
        tax: Number(contract.tax),
        total: Number(contract.finalAmount),
        status: randomItem(['DRAFT', 'SENT', 'PAID', 'OVERDUE']) as any,
      },
    });
  }
  console.log('✅ Created 25 invoices');

  // 10. Event Assignments (40)
  const assignedPairs = new Set<string>();
  let assignmentCount = 0;
  for (let i = 0; i < 60 && assignmentCount < 40; i++) {
    const event = events[randomInt(0, 29)];
    const employee = employees[randomInt(0, 14)];
    const key = `${event.id}-${employee.id}`;
    if (assignedPairs.has(key)) continue;
    assignedPairs.add(key);
    await prisma.eventAssignment.create({
      data: {
        eventId: event.id, employeeId: employee.id,
        role: employee.role === 'PHOTOGRAPHER' ? 'Lead Photographer' : employee.role === 'VIDEOGRAPHER' ? 'Lead Videographer' : employee.role.replace('_', ' '),
        status: event.status === 'COMPLETED' ? 'COMPLETED' : 'ASSIGNED',
      },
    });
    assignmentCount++;
  }
  console.log(`✅ Created ${assignmentCount} assignments`);

  // 11. Interactions (60)
  const interactionTypes: any[] = ['CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'NOTE'];
  for (let i = 0; i < 60; i++) {
    await prisma.interaction.create({
      data: {
        customerId: customers[randomInt(0, 39)].id,
        userId: randomItem(users).id,
        type: randomItem(interactionTypes),
        subject: randomItem(['Follow up call', 'Package discussion', 'Date confirmation', 'Payment reminder', 'Delivery update', 'Meeting scheduled', 'Requirements discussed']),
        notes: randomItem(['Customer confirmed booking', 'Discussed premium package options', 'Sent quotation via WhatsApp', 'Customer will confirm by next week', 'Advance payment received', 'Rescheduled meeting']),
        interactionDate: randomDate(new Date(2024, 6, 1), new Date()),
      },
    });
  }
  console.log('✅ Created 60 interactions');

  // 12. Tasks (40)
  const taskTitles = ['Edit wedding photos', 'Create highlight reel', 'Design album layout', 'Deliver raw photos', 'Follow up on payment', 'Schedule pre-wedding shoot', 'Upload photos to cloud', 'Review edited video', 'Send proofs to client', 'Prepare equipment for event'];
  const taskStatuses: any[] = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'];
  const taskPriorities: any[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  for (let i = 0; i < 40; i++) {
    await prisma.task.create({
      data: {
        title: randomItem(taskTitles),
        description: `Task details for ${randomItem(taskTitles).toLowerCase()}`,
        assignedTo: employees[randomInt(0, 14)].id,
        customerId: Math.random() > 0.3 ? customers[randomInt(0, 39)].id : null,
        eventId: Math.random() > 0.3 ? events[randomInt(0, 29)].id : null,
        priority: randomItem(taskPriorities),
        status: randomItem(taskStatuses),
        dueDate: randomDate(new Date(2025, 0, 1), new Date(2026, 11, 31)),
      },
    });
  }
  console.log('✅ Created 40 tasks');

  // 13. Deliverables (40)
  const deliverableTypes: any[] = ['RAW_PHOTOS', 'EDITED_PHOTOS', 'HIGHLIGHT_VIDEO', 'FULL_WEDDING_VIDEO', 'CINEMATIC_FILM', 'TEASER', 'REEL', 'ALBUM'];
  const deliverableStatuses: any[] = ['PENDING', 'IN_PRODUCTION', 'READY', 'DELIVERED'];
  for (let i = 0; i < 40; i++) {
    const status = randomItem(deliverableStatuses);
    await prisma.deliverable.create({
      data: {
        eventId: events[randomInt(0, 29)].id,
        contractId: i < 25 ? contracts[i % 25].id : null,
        type: randomItem(deliverableTypes),
        quantity: randomInt(1, 3),
        dueDate: randomDate(new Date(2025, 0, 1), new Date(2026, 11, 31)),
        status,
        deliveryDate: status === 'DELIVERED' ? randomDate(new Date(2025, 0, 1), new Date()) : null,
        deliveryLink: status === 'DELIVERED' ? `https://drive.google.com/folder/${randomInt(100000, 999999)}` : null,
      },
    });
  }
  console.log('✅ Created 40 deliverables');

  // 14. Notifications (20)
  for (let i = 0; i < 20; i++) {
    await prisma.notification.create({
      data: {
        userId: users[randomInt(0, 3)].id,
        title: randomItem(['Upcoming Event', 'Payment Received', 'Task Overdue', 'New Lead', 'Deliverable Due', 'Payment Reminder']),
        message: randomItem(['Event in 3 days - prepare equipment', 'Payment of ₹50,000 received', 'Task editing photos is overdue', 'New lead assigned to you', 'Album delivery due tomorrow', 'Payment pending for contract CON-0012']),
        type: randomItem(['info', 'warning', 'success', 'error']),
        isRead: Math.random() > 0.5,
      },
    });
  }
  console.log('✅ Created 20 notifications');

  console.log('\n🎉 Seed completed successfully!');
  console.log('📧 Login: admin@studio.com / Admin@123');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
