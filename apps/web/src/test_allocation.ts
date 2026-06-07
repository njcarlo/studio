import { prisma } from '@studio/database/prisma';
import { allocateMealstubs } from './services/meal-stub-service';

async function main() {
  console.log('=== STARTING MEALSTUB ALLOCATION INTEGRATION TEST ===');

  // 1. Fetch a test worker
  const worker = await prisma.worker.findFirst({
    where: { status: 'Active' },
  });

  if (!worker) {
    console.error('FAIL: No active worker found in the database to test with.');
    process.exit(1);
  }

  const workerName = `${worker.firstName} ${worker.lastName}`;
  console.log(`Using test worker: ${workerName} (ID: ${worker.id})`);

  // 2. Create a test ServiceSchedule
  const scheduleDate = new Date();
  scheduleDate.setHours(0, 0, 0, 0);

  const testSchedule = await prisma.serviceSchedule.create({
    data: {
      title: 'INTEGRATION TEST Sunday Service',
      date: scheduleDate,
      status: 'Draft',
      createdBy: 'test-admin',
    },
  });
  console.log(`Created test schedule: ${testSchedule.title} (ID: ${testSchedule.id})`);

  try {
    // 3. Create a test ScheduleAssignment for this worker
    const assignment = await prisma.scheduleAssignment.create({
      data: {
        scheduleId: testSchedule.id,
        ministryId: worker.majorMinistryId || 'test-ministry',
        roleName: 'Worship Leader',
        workerId: worker.id,
        workerName: workerName,
      },
    });
    console.log(`Created test assignment (ID: ${assignment.id})`);

    // 4. Run the allocation service
    console.log('Running allocateMealstubs...');
    const createdStubs = await allocateMealstubs(testSchedule.id, 'system');
    console.log(`Stubs created: ${createdStubs.length}`);

    if (createdStubs.length !== 1) {
      throw new Error(`Expected exactly 1 stub created, but got ${createdStubs.length}`);
    }

    const stub = createdStubs[0];
    console.log('Verifying stub properties...');
    console.log(`- ID: ${stub.id}`);
    console.log(`- workerId: ${stub.workerId} (expected: ${worker.id})`);
    console.log(`- workerName: ${stub.workerName} (expected: ${workerName})`);
    console.log(`- scheduleId: ${stub.scheduleId} (expected: ${testSchedule.id})`);
    console.log(`- date: ${stub.date.toISOString()} (expected: ${scheduleDate.toISOString()})`);
    console.log(`- status: ${stub.status} (expected: Issued)`);
    console.log(`- stubType: ${stub.stubType} (expected: Sunday Service)`);
    console.log(`- assignedBy: ${stub.assignedBy} (expected: system)`);
    console.log(`- assignedByName: ${stub.assignedByName} (expected: System)`);

    // Assert assertions
    if (stub.workerId !== worker.id) throw new Error('workerId mismatch');
    if (stub.workerName !== workerName) throw new Error('workerName mismatch');
    if (stub.scheduleId !== testSchedule.id) throw new Error('scheduleId mismatch');
    if (stub.date.getTime() !== scheduleDate.getTime()) throw new Error('date mismatch');
    if (stub.status !== 'Issued') throw new Error('status mismatch');
    if (stub.stubType !== 'Sunday Service') throw new Error('stubType mismatch');
    if (stub.assignedBy !== 'system') throw new Error('assignedBy mismatch');
    if (stub.assignedByName !== 'System') throw new Error('assignedByName mismatch');

    console.log('SUCCESS: First allocation assertions passed!');

    // 5. Run allocation again to test duplicate prevention
    console.log('Running allocateMealstubs again to test duplicate prevention...');
    const secondAllocationStubs = await allocateMealstubs(testSchedule.id, 'system');
    console.log(`Stubs created in second run: ${secondAllocationStubs.length}`);

    if (secondAllocationStubs.length !== 0) {
      throw new Error(`Expected 0 stubs created on duplicate run, but got ${secondAllocationStubs.length}`);
    }
    console.log('SUCCESS: Duplicate prevention verified!');

  } catch (error: any) {
    console.error('TEST FAILED:', error.message || error);
    process.exitCode = 1;
  } finally {
    // 6. Cleanup
    console.log('Cleaning up test database records...');
    
    // Delete created MealStub
    const deletedStubs = await prisma.mealStub.deleteMany({
      where: { scheduleId: testSchedule.id },
    });
    console.log(`Deleted ${deletedStubs.count} test mealstubs.`);

    // Delete created ScheduleAssignment
    const deletedAssignments = await prisma.scheduleAssignment.deleteMany({
      where: { scheduleId: testSchedule.id },
    });
    console.log(`Deleted ${deletedAssignments.count} test assignments.`);

    // Delete created ServiceSchedule
    await prisma.serviceSchedule.delete({
      where: { id: testSchedule.id },
    });
    console.log('Deleted test schedule.');

    console.log('=== INTEGRATION TEST CLEANUP COMPLETE ===');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
