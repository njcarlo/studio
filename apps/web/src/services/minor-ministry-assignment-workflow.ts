import { prisma } from '@studio/database/prisma';
import type { ScheduleAssignment } from '@prisma/client';
import * as ApprovalEngine from './approval-engine';
import type { WorkflowWithStages } from './approval-engine';

/**
 * Minor Ministry assignment approval (SRD 5.2.5), built on the generic
 * approval engine: a single stage for the Minor Ministry's Head. Triggered
 * when a worker is assigned to a service slot in their `minorMinistryId`
 * (and that ministry isn't also their `majorMinistryId`).
 */
export const MINOR_MINISTRY_ASSIGNMENT_WORKFLOW_TYPE = 'Minor Ministry Assignment';

export async function createMinorMinistryAssignmentWorkflow(
    assignment: ScheduleAssignment,
    requesterId: string,
    minorMinistryId: string,
): Promise<WorkflowWithStages> {
    return ApprovalEngine.createWorkflow({
        type: MINOR_MINISTRY_ASSIGNMENT_WORKFLOW_TYPE,
        subjectId: assignment.id,
        requesterId,
        stages: [
            { approverSpec: { kind: 'ministryRole', ministryId: minorMinistryId, role: 'head' } },
        ],
        metadata: {
            scheduleId: assignment.scheduleId,
            ministryId: assignment.ministryId,
            roleName: assignment.roleName,
            workerId: assignment.workerId,
            workerName: assignment.workerName,
        },
    });
}

/**
 * On rejection (reason mandatory, enforced by the engine), clears the
 * assignment's worker so the scheduler can reassign; the engine's
 * `notifyRequester` already informs the scheduler of the rejection reason.
 * On approval, the assignment is left as-is — it's no longer "pending".
 */
export async function syncAssignmentFromWorkflow(workflow: WorkflowWithStages): Promise<void> {
    if (workflow.type !== MINOR_MINISTRY_ASSIGNMENT_WORKFLOW_TYPE) return;
    if (workflow.status !== 'Rejected') return;

    await prisma.scheduleAssignment.updateMany({
        where: { id: workflow.subjectId },
        data: {
            workerId: null,
            workerName: null,
            attendanceStatus: 'Pending',
            acknowledgedAt: null,
            acknowledgedBy: null,
            approvalWorkflowId: null,
        },
    });
}
