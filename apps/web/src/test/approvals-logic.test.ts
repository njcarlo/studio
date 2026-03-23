import { describe, it, expect } from "vitest";
import type { ApprovalRequest, Worker, Ministry } from "@studio/types";
import { makeWorker, makeMinistry, makeApproval } from "./fixtures";

// --- Pure logic extracted from approvals/page.tsx ---

function checkIsApprover(
  request: ApprovalRequest,
  workerProfile: Worker | null,
  workers: Worker[],
  ministries: Ministry[],
): boolean {
  if (!workerProfile) return false;
  if (!request.workerId) return false;

  const targetWorker = workers.find((w) => w.id === request.workerId);
  if (!targetWorker) return false;

  const majorMinistry = ministries.find((m) => m.id === targetWorker.majorMinistryId);
  const minorMinistry = ministries.find((m) => m.id === targetWorker.minorMinistryId);

  return (
    majorMinistry?.approverId === workerProfile.id ||
    majorMinistry?.headId === workerProfile.id ||
    minorMinistry?.approverId === workerProfile.id ||
    minorMinistry?.headId === workerProfile.id
  );
}

function checkCanManage(
  request: ApprovalRequest,
  workerProfile: Worker | null,
  workers: Worker[],
  ministries: Ministry[],
  canApproveAllRequests: boolean,
  canApproveRoomReservation: boolean,
  isSuperAdmin: boolean,
): boolean {
  const isApprover = checkIsApprover(request, workerProfile, workers, ministries);
  if (canApproveAllRequests || isSuperAdmin) return true;

  if (request.type === "Ministry Change") {
    if (!workerProfile) return false;

    if (request.status === "Pending Outgoing Approval") {
      const oldMajor = ministries.find((m) => m.id === request.oldMajorId);
      const oldMinor = ministries.find((m) => m.id === request.oldMinorId);
      return (
        oldMajor?.headId === workerProfile.id ||
        oldMajor?.approverId === workerProfile.id ||
        oldMinor?.headId === workerProfile.id ||
        oldMinor?.approverId === workerProfile.id
      );
    }

    if (request.status === "Pending Incoming Approval") {
      const newMajor = ministries.find((m) => m.id === request.newMajorId);
      const newMinor = ministries.find((m) => m.id === request.newMinorId);
      return (
        newMajor?.headId === workerProfile.id ||
        newMajor?.approverId === workerProfile.id ||
        newMinor?.headId === workerProfile.id ||
        newMinor?.approverId === workerProfile.id
      );
    }
  }

  if (request.type === "Room Booking" && request.status === "Pending Admin Approval") {
    return canApproveRoomReservation && (canApproveAllRequests || isSuperAdmin);
  }

  return isApprover;
}

// --- filteredRequests logic ---

function filterRequests(
  requests: ApprovalRequest[],
  searchTerm: string,
  filterType: string,
): ApprovalRequest[] {
  let results = [...requests];

  if (searchTerm) {
    const lower = searchTerm.toLowerCase();
    results = results.filter(
      (r) =>
        r.requester.toLowerCase().includes(lower) ||
        r.details.toLowerCase().includes(lower),
    );
  }

  if (filterType !== "all") {
    results = results.filter((r) => r.type === filterType);
  }

  return results.sort(
    (a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime(),
  );
}

// ----------------------------------------------------------------

describe("checkIsApprover", () => {
  it("returns false when workerProfile is null", () => {
    const request = makeApproval();
    expect(checkIsApprover(request, null, [], [])).toBe(false);
  });

  it("returns false when request has no workerId", () => {
    const profile = makeWorker({ id: "approver-1" });
    const request = makeApproval({ workerId: undefined });
    expect(checkIsApprover(request, profile, [], [])).toBe(false);
  });

  it("returns false when target worker not found", () => {
    const profile = makeWorker({ id: "approver-1" });
    const request = makeApproval({ workerId: "missing-worker" });
    expect(checkIsApprover(request, profile, [], [])).toBe(false);
  });

  it("returns true when profile is the major ministry approver", () => {
    const profile = makeWorker({ id: "approver-1" });
    const targetWorker = makeWorker({ id: "worker-1", majorMinistryId: "ministry-1" });
    const ministry = makeMinistry({ id: "ministry-1", approverId: "approver-1" });
    const request = makeApproval({ workerId: "worker-1" });
    expect(checkIsApprover(request, profile, [targetWorker], [ministry])).toBe(true);
  });

  it("returns true when profile is the major ministry head", () => {
    const profile = makeWorker({ id: "head-1" });
    const targetWorker = makeWorker({ id: "worker-1", majorMinistryId: "ministry-1" });
    const ministry = makeMinistry({ id: "ministry-1", headId: "head-1" });
    const request = makeApproval({ workerId: "worker-1" });
    expect(checkIsApprover(request, profile, [targetWorker], [ministry])).toBe(true);
  });

  it("returns true when profile is the minor ministry approver", () => {
    const profile = makeWorker({ id: "minor-approver" });
    const targetWorker = makeWorker({ id: "worker-1", majorMinistryId: "ministry-1", minorMinistryId: "ministry-2" });
    const major = makeMinistry({ id: "ministry-1", approverId: "someone-else" });
    const minor = makeMinistry({ id: "ministry-2", approverId: "minor-approver" });
    const request = makeApproval({ workerId: "worker-1" });
    expect(checkIsApprover(request, profile, [targetWorker], [major, minor])).toBe(true);
  });

  it("returns false when profile is unrelated to the worker's ministries", () => {
    const profile = makeWorker({ id: "random-person" });
    const targetWorker = makeWorker({ id: "worker-1", majorMinistryId: "ministry-1" });
    const ministry = makeMinistry({ id: "ministry-1", approverId: "approver-1", headId: "head-1" });
    const request = makeApproval({ workerId: "worker-1" });
    expect(checkIsApprover(request, profile, [targetWorker], [ministry])).toBe(false);
  });
});

describe("checkCanManage", () => {
  const workers = [makeWorker({ id: "worker-1", majorMinistryId: "ministry-1" })];
  const ministries = [makeMinistry({ id: "ministry-1", approverId: "approver-1", headId: "head-1" })];

  it("returns true for superAdmin regardless of request", () => {
    const request = makeApproval({ type: "Room Booking", status: "Pending Admin Approval" });
    expect(checkCanManage(request, null, [], [], false, false, true)).toBe(true);
  });

  it("returns true when canApproveAllRequests is set", () => {
    const request = makeApproval();
    expect(checkCanManage(request, null, [], [], true, false, false)).toBe(true);
  });

  it("Ministry Change Pending Outgoing — returns true for old major head", () => {
    const profile = makeWorker({ id: "head-1" });
    const request = makeApproval({
      type: "Ministry Change",
      status: "Pending Outgoing Approval",
      oldMajorId: "ministry-1",
    });
    expect(checkCanManage(request, profile, workers, ministries, false, false, false)).toBe(true);
  });

  it("Ministry Change Pending Outgoing — returns false for unrelated user", () => {
    const profile = makeWorker({ id: "random" });
    const request = makeApproval({
      type: "Ministry Change",
      status: "Pending Outgoing Approval",
      oldMajorId: "ministry-1",
    });
    expect(checkCanManage(request, profile, workers, ministries, false, false, false)).toBe(false);
  });

  it("Ministry Change Pending Incoming — returns true for new major head", () => {
    const profile = makeWorker({ id: "head-1" });
    const request = makeApproval({
      type: "Ministry Change",
      status: "Pending Incoming Approval",
      newMajorId: "ministry-1",
    });
    expect(checkCanManage(request, profile, workers, ministries, false, false, false)).toBe(true);
  });

  it("Room Booking Pending Admin — returns false without canApproveRoomReservation", () => {
    const profile = makeWorker({ id: "approver-1" });
    const request = makeApproval({ type: "Room Booking", status: "Pending Admin Approval" });
    expect(checkCanManage(request, profile, workers, ministries, false, false, false)).toBe(false);
  });

  it("Room Booking Pending Admin — returns false even with canApproveRoomReservation but not superAdmin/canApproveAll", () => {
    const profile = makeWorker({ id: "approver-1" });
    const request = makeApproval({ type: "Room Booking", status: "Pending Admin Approval" });
    // canApproveRoomReservation=true but canApproveAllRequests=false and isSuperAdmin=false
    expect(checkCanManage(request, profile, workers, ministries, false, true, false)).toBe(false);
  });

  it("falls back to isApprover for standard requests", () => {
    const profile = makeWorker({ id: "approver-1" });
    const request = makeApproval({ type: "New Worker", status: "Pending", workerId: "worker-1" });
    expect(checkCanManage(request, profile, workers, ministries, false, false, false)).toBe(true);
  });
});

describe("filterRequests", () => {
  const requests: ApprovalRequest[] = [
    makeApproval({ id: "1", requester: "Alice", type: "New Worker", date: new Date("2024-06-03") }),
    makeApproval({ id: "2", requester: "Bob", type: "Room Booking", details: "Need a room", date: new Date("2024-06-01") }),
    makeApproval({ id: "3", requester: "Charlie", type: "Ministry Change", date: new Date("2024-06-02") }),
  ];

  it("returns all requests when no filter applied", () => {
    const result = filterRequests(requests, "", "all");
    expect(result).toHaveLength(3);
  });

  it("filters by requester name (case-insensitive)", () => {
    const result = filterRequests(requests, "alice", "all");
    expect(result).toHaveLength(1);
    expect(result[0].requester).toBe("Alice");
  });

  it("filters by details text", () => {
    const result = filterRequests(requests, "need a room", "all");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("filters by type", () => {
    const result = filterRequests(requests, "", "Room Booking");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("Room Booking");
  });

  it("combines search and type filter", () => {
    const result = filterRequests(requests, "bob", "Room Booking");
    expect(result).toHaveLength(1);
    expect(result[0].requester).toBe("Bob");
  });

  it("returns empty when no match", () => {
    const result = filterRequests(requests, "xyz", "all");
    expect(result).toHaveLength(0);
  });

  it("sorts by date descending", () => {
    const result = filterRequests(requests, "", "all");
    expect(result[0].id).toBe("1"); // 2024-06-03 newest
    expect(result[2].id).toBe("2"); // 2024-06-01 oldest
  });
});
