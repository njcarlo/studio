import type { Timestamp } from 'firebase/firestore';

export type Role = {
    id: string;
    name: string;
    permissions?: string[];
}

export type Worker = {
    id: string;
    workerId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    roleId: string;
    status: 'Active' | 'Inactive' | 'Pending Approval';
    avatarUrl: string;
    majorMinistryId: string;
    minorMinistryId: string;
    employmentType?: 'Full-Time' | 'On-Call' | 'Volunteer';
    birthDate?: string;
    passwordChangeRequired?: boolean;
    qrToken?: string;
    createdAt: Timestamp;
};

export type Ministry = {
    id: string;
    name: string;
    description: string;
    department: Department;
    leaderId: string;
    headId?: string;
    approverId?: string;
    mealStubAssignerId?: string;
    mealStubWeeklyLimit?: number; // Total stubs allowed per week for this ministry
    weight?: number;
};

export type Department = 'Worship' | 'Outreach' | 'Relationship' | 'Discipleship' | 'Administration';

export type DepartmentData = {
    id: Department;
    description?: string;
    headId?: string;
    mealStubTotalAllocation?: number;
};

export type MealStubSettings = {
    disabledVolunteerDays: number[]; // days of week 1-6
};

export type AttendanceRecord = {
    id: string;
    workerProfileId: string;
    type: "Clock In" | "Clock Out";
    time: Timestamp;
};

export type Booking = {
    id: string;
    requestId?: string;
    roomId: string;
    title: string;
    purpose?: string;
    start: Timestamp;
    end: Timestamp;
    status: 'Pending' | 'Pending Ministry Approval' | 'Pending Admin Approval' | 'Approved' | 'Rejected';
    workerProfileId: string;
    name: string;
    ministryId: string;
    email: string;
    requesterEmail?: string;
    dateRequested: Timestamp;
    pax: number;
    numTables?: number;
    numChairs?: number;
    equipment_TV?: boolean;
    equipment_Mic?: boolean;
    equipment_Speakers?: boolean;
    requestedElements?: string[]; // IDs of VenueElements requested
    guidelinesAccepted: boolean;
    checkedInAt?: Timestamp;
};

export type Room = {
    id: string;
    name: string;
    capacity: number;
    elements?: string[]; // Array of VenueElement IDs available in this room
    areaId: string;
    weight?: number;
};

export type Area = {
    id: string;
    name: string;
    branchId: string;
    areaId?: string;
};

export type Branch = {
    id: string;
    name: string;
};

export type MealStub = {
    id: string;
    workerId: string;
    workerName: string;
    date: Timestamp;
    status: 'Issued' | 'Claimed';
    stubType?: string; // e.g., 'daily'
    assignedBy?: string;
    assignedByName?: string;
    claimedAt?: Timestamp;
};

export type VenueElement = {
    id: string;
    name: string;
    category: 'Equipment' | 'Manpower' | 'Other';
    providerMinistryId: string;
};

export type ApprovalRequest = {
    id?: string;
    requester: string;
    type: 'New Worker' | 'Profile Update' | 'Room Booking' | 'Ministry Change';
    details: string;
    date: Timestamp;
    status: 'Pending' | 'Pending Ministry Approval' | 'Pending Admin Approval' | 'Approved' | 'Rejected' | 'Pending Outgoing Approval' | 'Pending Incoming Approval';
    workerId?: string;
    roomId?: string;
    reservationId?: string;
    requestId?: string;
    oldMajorId?: string;
    newMajorId?: string;
    oldMinorId?: string;
    newMinorId?: string;
    outgoingApproved?: boolean;
    incomingApproved?: boolean;
};

export type ScanLog = {
    id: string;
    scannerId: string;
    scannerName: string;
    timestamp: Timestamp;
    scanType: 'Attendance' | 'Meal Stub' | 'Room Check-in';
    details: string;
    targetUserId?: string;
    targetUserName?: string;
    mealStubId?: string;
    reservationId?: string;
};

export type C2SMentee = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: 'In Progress' | 'Completed' | 'Dropped';
    groupId: string;
    mentorId: string;
    createdAt: Timestamp;
};

export type C2SGroup = {
    id: string;
    name: string;
    mentorId: string;
    menteeIds: string[];
    createdAt: Timestamp;
};
