import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { date, employeeId, month } = req.query as Record<string, string>;
  const where: any = {};
  if (date) where.date = new Date(date);
  if (employeeId) where.employeeId = employeeId;
  if (month) {
    const [year, m] = month.split('-');
    const startDate = new Date(Number(year), Number(m) - 1, 1);
    const endDate = new Date(Number(year), Number(m), 0);
    where.date = { gte: startDate, lte: endDate };
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: { employee: { select: { id: true, name: true, role: true, phone: true } } },
    orderBy: [{ date: 'desc' }, { employee: { name: 'asc' } }],
  });
  res.json({ success: true, data: attendances });
});

export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { employeeId, date, status = 'PRESENT', checkIn, checkOut, notes } = req.body;
  if (!employeeId || !date) throw new ApiError(400, 'Employee and date are required');

  const recordDate = new Date(date);
  const attendance = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date: recordDate } },
    update: { status, checkIn, checkOut, notes },
    create: { employeeId, date: recordDate, status, checkIn, checkOut, notes },
    include: { employee: true },
  });
  res.json({ success: true, data: attendance });
});

export const deleteAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.attendance.delete({ where: { id } });
  res.json({ success: true, message: 'Attendance record deleted' });
});
