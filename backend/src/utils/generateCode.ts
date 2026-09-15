import { prisma } from "../lib/prisma";

export async function generateCustomerCode(): Promise<string> {
  const customers = await prisma.customer.findMany({
    where: { customerCode: { startsWith: 'CUST-' } },
    select: { customerCode: true },
  });
  let maxNum = 0;
  for (const c of customers) {
    const num = parseInt(c.customerCode.replace('CUST-', ''), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }
  let nextNum = maxNum + 1;
  while (true) {
    const candidate = `CUST-${String(nextNum).padStart(4, '0')}`;
    const exists = await prisma.customer.findUnique({ where: { customerCode: candidate } });
    if (!exists) return candidate;
    nextNum++;
  }
}

export async function generateContractNumber(): Promise<string> {
  const contracts = await prisma.contract.findMany({
    where: { contractNumber: { startsWith: 'CON-' } },
    select: { contractNumber: true },
  });
  let maxNum = 0;
  for (const c of contracts) {
    const num = parseInt(c.contractNumber.replace('CON-', ''), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }
  let nextNum = maxNum + 1;
  while (true) {
    const candidate = `CON-${String(nextNum).padStart(4, '0')}`;
    const exists = await prisma.contract.findUnique({ where: { contractNumber: candidate } });
    if (!exists) return candidate;
    nextNum++;
  }
}

export async function generateInvoiceNumber(): Promise<string> {
  const invoices = await prisma.invoice.findMany({
    where: { invoiceNumber: { startsWith: 'INV-' } },
    select: { invoiceNumber: true },
  });
  let maxNum = 0;
  for (const inv of invoices) {
    const num = parseInt(inv.invoiceNumber.replace('INV-', ''), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }
  let nextNum = maxNum + 1;
  while (true) {
    const candidate = `INV-${String(nextNum).padStart(4, '0')}`;
    const exists = await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } });
    if (!exists) return candidate;
    nextNum++;
  }
}

export async function generateProjectNumber(isFashion: boolean): Promise<string> {
  const prefix = isFashion ? 'FSH' : 'WED';
  const projects = await prisma.project.findMany({
    where: { projectNumber: { startsWith: `${prefix}-` } },
    select: { projectNumber: true },
  });
  let maxNum = 0;
  for (const p of projects) {
    const num = parseInt(p.projectNumber.replace(`${prefix}-`, ''), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }
  let nextNum = maxNum + 1;
  while (true) {
    const candidate = `${prefix}-${String(nextNum).padStart(4, '0')}`;
    const exists = await prisma.project.findUnique({ where: { projectNumber: candidate } });
    if (!exists) return candidate;
    nextNum++;
  }
}
