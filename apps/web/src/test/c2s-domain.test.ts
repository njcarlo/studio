import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApprovalStage, ApprovalWorkflow } from '@prisma/client';

const { findUnique, updateJoin, findGroup, createMentee } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateJoin: vi.fn(),
  findGroup: vi.fn(),
  createMentee: vi.fn(),
}));

vi.mock('@studio/database/prisma', () => ({
  prisma: {
    c2SJoinRequest: {
      findUnique,
      update: updateJoin,
    },
    c2SGroup: {
      findUniqueOrThrow: findGroup,
    },
    c2SMentee: {
      create: createMentee,
    },
  },
}));

vi.mock('@studio/core-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@studio/core-engine')>();
  return {
    ...actual,
    createWorkflow: vi.fn(),
    getActionableWorkflows: vi.fn(async () => []),
  };
});

import {
  C2S_JOIN_REQUEST_WORKFLOW_TYPE,
  toC2SKanbanApprovalRow,
  syncC2SJoinRequestFromWorkflow,
} from '@studio/c2s';

function makeStage(overrides: Partial<ApprovalStage> = {}): ApprovalStage {
  return {
    id: 'stage-1',
    workflowId: 'wf-1',
    stageOrder: 1,
    parallelGroup: null,
    approverSpec: { kind: 'worker', workerId: 'mentor-1' } as any,
    status: 'Pending',
    decidedBy: null,
    decidedAt: null,
    reason: null,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeWorkflow(
  overrides: Partial<ApprovalWorkflow> & { stages?: ApprovalStage[] } = {},
): ApprovalWorkflow & { stages: ApprovalStage[] } {
  const { stages, ...rest } = overrides;
  return {
    id: 'wf-1',
    type: C2S_JOIN_REQUEST_WORKFLOW_TYPE,
    subjectId: 'join-1',
    requesterId: 'c2s-join:join-1',
    status: 'Pending',
    metadata: {
      requesterName: 'Ada Lovelace',
      requesterEmail: 'ada@example.com',
      groupName: 'Young Adults',
      message: 'Looking forward to joining',
    },
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
    stages: stages ?? [makeStage()],
    ...rest,
  };
}

describe('toC2SKanbanApprovalRow', () => {
  it('maps workflow metadata into the legacy ApprovalRequest shape', () => {
    const row = toC2SKanbanApprovalRow(makeWorkflow(), new Set(['wf-1']));
    expect(row).toMatchObject({
      id: 'wf-1',
      requester: 'Ada Lovelace',
      type: C2S_JOIN_REQUEST_WORKFLOW_TYPE,
      requestId: 'join-1',
      _workflowId: 'wf-1',
      _stageId: 'stage-1',
      _actionable: true,
      workerId: null,
      worker: null,
    });
    expect(row.details).toContain('Young Adults');
    expect(row.details).toContain('ada@example.com');
    expect(row.details).toContain('Looking forward to joining');
  });

  it('marks non-actionable workflows', () => {
    const row = toC2SKanbanApprovalRow(makeWorkflow(), new Set());
    expect(row._actionable).toBe(false);
  });
});

describe('syncC2SJoinRequestFromWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no-ops for non-C2S workflow types', async () => {
    await syncC2SJoinRequestFromWorkflow(makeWorkflow({ type: 'Room Booking' }));
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('creates a mentee and marks the join request Approved', async () => {
    findUnique.mockResolvedValue({
      id: 'join-1',
      groupId: 'group-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '555',
      status: 'Pending',
    });
    findGroup.mockResolvedValue({
      id: 'group-1',
      mentorId: 'mentor-1',
    });

    await syncC2SJoinRequestFromWorkflow(makeWorkflow({ status: 'Approved' }));

    expect(createMentee).toHaveBeenCalledWith({
      data: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '555',
        status: 'In Progress',
        groupId: 'group-1',
        mentorId: 'mentor-1',
      },
    });
    expect(updateJoin).toHaveBeenCalledWith({
      where: { id: 'join-1' },
      data: { status: 'Approved' },
    });
  });

  it('updates status only on Rejected (no mentee)', async () => {
    findUnique.mockResolvedValue({
      id: 'join-1',
      groupId: 'group-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: null,
      status: 'Pending',
    });

    await syncC2SJoinRequestFromWorkflow(makeWorkflow({ status: 'Rejected' }));

    expect(createMentee).not.toHaveBeenCalled();
    expect(updateJoin).toHaveBeenCalledWith({
      where: { id: 'join-1' },
      data: { status: 'Rejected' },
    });
  });
});
