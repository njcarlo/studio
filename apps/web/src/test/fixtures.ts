import type { ApprovalRequest, Worker, Ministry } from "@studio/types";

export const makeWorker = (overrides: Partial<Worker> = {}): Worker => ({
  id: "worker-1",
  workerId: "W001",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "555-0001",
  roleId: "viewer",
  status: "Active",
  avatarUrl: "",
  majorMinistryId: "ministry-1",
  minorMinistryId: "",
  createdAt: new Date("2024-01-01"),
  ...overrides,
});

export const makeMinistry = (overrides: Partial<Ministry> = {}): Ministry => ({
  id: "ministry-1",
  name: "Worship",
  description: "",
  department: "Worship",
  leaderId: "leader-1",
  headId: "head-1",
  approverId: "approver-1",
  ...overrides,
});

export const makeApproval = (overrides: Partial<ApprovalRequest> = {}): ApprovalRequest => ({
  id: "approval-1",
  requester: "Jane Smith",
  type: "New Worker",
  details: "New worker registration",
  date: new Date("2024-06-01"),
  status: "Pending",
  workerId: "worker-1",
  ...overrides,
});
