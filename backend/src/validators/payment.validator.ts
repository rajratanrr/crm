import { z } from 'zod';

export const createPaymentSchema = z.object({
  contractId: z.string().uuid(),
  customerId: z.string().uuid(),
  amount: z.number().positive('Amount must be greater than zero'),
  paymentMethod: z.enum(['CASH','UPI','BANK_TRANSFER','CARD','CHEQUE']),
  paymentType: z.enum(['ADVANCE','INSTALLMENT','FINAL_PAYMENT','ADDITIONAL_SERVICE']),
  paymentDate: z.string().min(1, 'Payment date is required'),
  transactionId: z.string().max(150).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
