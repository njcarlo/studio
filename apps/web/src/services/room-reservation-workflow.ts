import { prisma } from '@studio/database/prisma';
import type { Booking } from '@prisma/client';
import { WORKER_FLAGS } from '@/lib/permissions/registry';
import * as ApprovalEngine from './approval-engine';
import type { ApproverSpec, WorkflowWithStages } from './approval-engine';

/**
 * Room Reservation 3-stage approval (SRD 5.8.2), built on the generic
 * approval engine: Ministry Head -> Department Head -> Room Reservation
 * Manager (flag). Replaces the old 2-stage ApprovalRequest-based flow.
 */
export const ROOM_BOOKING_WORKFLOW_TYPE = 'Room Booking';

export async function createRoomReservationWorkflow(booking: Booking): Promise<WorkflowWithStages> {
    const [ministry, room] = await Promise.all([
        prisma.ministry.findUnique({ where: { id: booking.ministryId } }),
        prisma.room.findUnique({ where: { id: booking.roomId } }),
    ]);
    const deptSetting = ministry
        ? await prisma.departmentSetting.findUnique({ where: { id: ministry.departmentCode } })
        : null;

    // Department Head is an optional per-department override; falls back to
    // anyone holding the venues:approve_l2 permission.
    const departmentHeadSpec: ApproverSpec = deptSetting?.headId
        ? { kind: 'worker', workerId: deptSetting.headId }
        : { kind: 'permission', module: 'venues', action: 'approve_l2' };

    return ApprovalEngine.createWorkflow({
        type: ROOM_BOOKING_WORKFLOW_TYPE,
        subjectId: booking.id,
        requesterId: booking.workerProfileId,
        stages: [
            { approverSpec: { kind: 'ministryRole', ministryId: booking.ministryId, role: 'head' } },
            { approverSpec: departmentHeadSpec },
            { approverSpec: { kind: 'flag', flag: WORKER_FLAGS.ROOM_RESERVATION_MANAGER } },
        ],
        metadata: {
            title: booking.title,
            purpose: booking.purpose,
            roomId: booking.roomId,
            roomName: room?.name ?? 'Unknown Room',
        },
    });
}

/**
 * Maps a Room Booking workflow's progress onto the legacy Booking.status
 * values ('Pending Ministry Approval' / 'Pending Admin Approval' / 'Approved'
 * / 'Rejected') that the reservations calendar, masterview, and room display
 * pages already key off.
 */
export function bookingStatusForWorkflow(workflow: WorkflowWithStages): string {
    if (workflow.status === 'Approved') return 'Approved';
    if (workflow.status === 'Rejected') return 'Rejected';

    const active = ApprovalEngine.getActiveStages(workflow.stages);
    const minActiveOrder = Math.min(...active.map((s) => s.stageOrder));
    return minActiveOrder <= 1 ? 'Pending Ministry Approval' : 'Pending Admin Approval';
}

export async function syncBookingStatusFromWorkflow(workflow: WorkflowWithStages): Promise<void> {
    if (workflow.type !== ROOM_BOOKING_WORKFLOW_TYPE) return;
    await prisma.booking.update({
        where: { id: workflow.subjectId },
        data: { status: bookingStatusForWorkflow(workflow) },
    });
}
