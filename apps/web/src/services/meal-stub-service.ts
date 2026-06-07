import { prisma } from '@studio/database/prisma';

export async function createMealstub(data: {
  workerId: string;
  workerName: string;
  scheduleId?: string;
  date: Date;
  status?: string;
  stubType?: string;
  assignedBy?: string;
  assignedByName?: string;
}) {
  return await prisma.mealStub.create({
    data: {
      workerId: data.workerId,
      workerName: data.workerName,
      scheduleId: data.scheduleId,
      date: data.date,
      status: data.status || 'Issued',
      stubType: data.stubType || 'Sunday Service',
      assignedBy: data.assignedBy || 'system',
      assignedByName: data.assignedByName || 'System',
    },
  });
}

export async function allocateMealstubs(scheduleId: string, assignedByUserId: string = 'system') {
  // 1. Fetch schedule and its assignments
  const schedule = await prisma.serviceSchedule.findUnique({
    where: { id: scheduleId },
    include: { assignments: true },
  });

  if (!schedule) {
    throw new Error(`Schedule not found with ID: ${scheduleId}`);
  }

  // 2. Fetch assignedBy details if possible
  let assignedByName = 'System';
  if (assignedByUserId !== 'system') {
    const creator = await prisma.worker.findUnique({
      where: { id: assignedByUserId },
    });
    if (creator) {
      assignedByName = `${creator.firstName} ${creator.lastName}`;
    }
  }

  // 3. For each assignment that has a workerId, create a mealstub
  const assignmentsWithWorkers = schedule.assignments.filter(
    (a) => a.workerId && a.workerName
  );

  // Eliminate duplicates within the same schedule page (e.g. if worker is scheduled for multiple roles)
  const uniqueWorkerIds = new Map<string, string>();
  for (const assignment of assignmentsWithWorkers) {
    uniqueWorkerIds.set(assignment.workerId!, assignment.workerName!);
  }

  const createdStubs = [];
  for (const [workerId, workerName] of uniqueWorkerIds.entries()) {
    // Check if a mealstub already exists for this worker on this schedule
    const existingStub = await prisma.mealStub.findFirst({
      where: {
        workerId,
        scheduleId,
      },
    });

    if (!existingStub) {
      const stub = await createMealstub({
        workerId,
        workerName,
        scheduleId,
        date: schedule.date,
        status: 'Issued',
        stubType: 'Sunday Service',
        assignedBy: assignedByUserId,
        assignedByName: assignedByName,
      });
      createdStubs.push(stub);
    }
  }

  return createdStubs;
}
