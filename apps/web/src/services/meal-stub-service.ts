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

/** Number of `MealStub` rows issued to `workerId` per `scheduleId`, for badge display on /my-schedule. */
export async function getMealStubCountsByScheduleForWorker(workerId: string, scheduleIds: string[]): Promise<Record<string, number>> {
  if (scheduleIds.length === 0) return {};

  const stubs = await prisma.mealStub.findMany({
    where: { workerId, scheduleId: { in: scheduleIds } },
    select: { scheduleId: true },
  });

  const counts: Record<string, number> = {};
  for (const stub of stubs) {
    if (!stub.scheduleId) continue;
    counts[stub.scheduleId] = (counts[stub.scheduleId] ?? 0) + 1;
  }
  return counts;
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
