import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';



export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { domain } = req.query as Record<string, string>;
  const where: any = {};
  if (domain) {
    where.domain = domain.toUpperCase();
  }

  const [employees, deliverables] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { assignments: true, tasks: true } },
        assignments: {
          include: {
            event: {
              select: {
                id: true,
                eventName: true,
                startDate: true,
                venue: true,
                customer: { select: { id: true, fullName: true } },
                project: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.deliverable.findMany({
      where: {
        notes: { contains: '[Assigned:' },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            customer: { select: { id: true, fullName: true } },
          },
        },
        event: {
          select: {
            id: true,
            eventName: true,
            startDate: true,
            customer: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    }),
  ]);

  const employeesWithDeliverables = employees.map((emp) => {
    const empNameLower = emp.name.toLowerCase().trim();
    const assignedDeliverables = deliverables
      .filter((d) => {
        if (!d.notes) return false;
        const match = d.notes.match(/\[Assigned:\s*([^|\]]+)(?:\s*\|\s*Role:\s*([^\]]+))?\]/i);
        return match && match[1].toLowerCase().trim() === empNameLower;
      })
      .map((d) => {
        const match = d.notes?.match(/\[Assigned:\s*([^|\]]+)(?:\s*\|\s*Role:\s*([^\]]+))?\]/i);
        const cleanTitle = match ? d.notes!.replace(match[0], '').trim() : (d.notes || d.type);
        return {
          id: d.id,
          name: cleanTitle || d.type,
          role: match ? match[2]?.trim() : 'Editor',
          dueDate: d.dueDate,
          status: d.status,
          type: d.type,
          projectName: d.project?.name || d.project?.customer?.fullName || 'Project',
          projectId: d.projectId,
        };
      });

    return {
      ...emp,
      deliverables: assignedDeliverables,
    };
  });

  res.json({ success: true, data: employeesWithDeliverables });
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await prisma.employee.findUnique({
    where: { id: req.params.id },
    include: {
      assignments: { include: { event: { include: { customer: { select: { fullName: true } } } } }, orderBy: { event: { startDate: 'desc' } } },
      tasks: { orderBy: { dueDate: 'asc' } },
    },
  });
  if (!employee) throw ApiError.notFound('Employee not found');

  const deliverables = await prisma.deliverable.findMany({
    where: { notes: { contains: '[Assigned:' } },
    include: {
      project: { select: { id: true, name: true, customer: { select: { fullName: true } } } },
    },
  });
  const empNameLower = employee.name.toLowerCase().trim();
  const assignedDeliverables = deliverables
    .filter((d) => {
      if (!d.notes) return false;
      const match = d.notes.match(/\[Assigned:\s*([^|\]]+)(?:\s*\|\s*Role:\s*([^\]]+))?\]/i);
      return match && match[1].toLowerCase().trim() === empNameLower;
    })
    .map((d) => {
      const match = d.notes?.match(/\[Assigned:\s*([^|\]]+)(?:\s*\|\s*Role:\s*([^\]]+))?\]/i);
      const cleanTitle = match ? d.notes!.replace(match[0], '').trim() : (d.notes || d.type);
      return {
        id: d.id,
        name: cleanTitle || d.type,
        role: match ? match[2]?.trim() : 'Editor',
        dueDate: d.dueDate,
        status: d.status,
        type: d.type,
        projectName: d.project?.name || d.project?.customer?.fullName || 'Project',
        projectId: d.projectId,
      };
    });

  res.json({ success: true, data: { ...employee, deliverables: assignedDeliverables } });
});

const normalizeRole = (role?: string) => {
  if (!role) return 'PHOTOGRAPHER';
  const clean = role.toUpperCase().trim().replace(/[\s\/-]+/g, '_');
  const valid = [
    'PHOTOGRAPHER', 'VIDEOGRAPHER', 'DRONE_OPERATOR', 'EDITOR', 'ALBUM_DESIGNER',
    'MANAGER', 'SALES_EXECUTIVE', 'ACCOUNTANT', 'STYLIST', 'MAKEUP_ARTIST',
    'PHOTO_EDITOR', 'VIDEO_EDITOR', 'SALES_PERSON', 'ACCOUNTS', 'PRODUCT_MANAGER',
    'STEEM_BOY', 'HELPING_HAND', 'ROTE_BOY', 'SHOOT_MANAGER',
    'TRADITIONAL_PHOTOGRAPHER', 'TRADITIONAL_VIDEOGRAPHER', 'CANDID_PHOTOGRAPHER',
    'CINEMATIC_VIDEOGRAPHER', 'DRONE', 'MOBILE_CONTENT_CREATOR',
    'TRADITIONAL_PHOTO_EDITOR', 'TRADITIONAL_VIDEO_EDITOR', 'CANDID_PHOTO_EDITOR',
    'CINEMATIC_VIDEO_EDITOR', 'DRONE_EDITOR', 'MOBILE_REEL_CONTENT_EDITOR', 'OTHER'
  ];
  return (valid.includes(clean) ? clean : 'OTHER') as any;
};

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (data.phone) data.phone = String(data.phone).replace(/\D/g, '').slice(-10);
  if (data.joiningDate) data.joiningDate = new Date(data.joiningDate);
  if (data.role) data.role = normalizeRole(data.role);
  const employee = await prisma.employee.create({ data });
  res.status(201).json({ success: true, data: employee });
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (data.phone) data.phone = String(data.phone).replace(/\D/g, '').slice(-10);
  if (data.joiningDate) data.joiningDate = new Date(data.joiningDate);
  if (data.role) data.role = normalizeRole(data.role);
  const employee = await prisma.employee.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: employee });
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  await prisma.employee.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true, message: 'Employee deactivated' });
});
