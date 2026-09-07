import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateCustomerCode(): Promise<string> {
  const lastCustomer = await prisma.customer.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { customerCode: true },
  });
  const lastNum = lastCustomer
    ? parseInt(lastCustomer.customerCode.replace('CUST-', ''), 10)
    : 0;
  return `CUST-${String(lastNum + 1).padStart(4, '0')}`;
}

export async function generateContractNumber(): Promise<string> {
  const lastContract = await prisma.contract.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { contractNumber: true },
  });
  const lastNum = lastContract
    ? parseInt(lastContract.contractNumber.replace('CON-', ''), 10)
    : 0;
  return `CON-${String(lastNum + 1).padStart(4, '0')}`;
}

export async function generateInvoiceNumber(): Promise<string> {
  const lastInvoice = await prisma.invoice.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { invoiceNumber: true },
  });
  const lastNum = lastInvoice
    ? parseInt(lastInvoice.invoiceNumber.replace('INV-', ''), 10)
    : 0;
  return `INV-${String(lastNum + 1).padStart(4, '0')}`;
}
