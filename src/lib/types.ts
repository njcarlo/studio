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
    primaryMinistryId: string;
    secondaryMinistryId: string;
    employmentType?: 'Full-Time' | 'On-Call' | 'Volunteer';
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
};

export type Department = 'Worship' | 'Outreach' | 'Relationship' | 'Discipleship' | 'Administration';

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
    guidelinesAccepted: boolean;
    checkedInAt?: Timestamp;
};

export type Room = {
    id: string;
    name: string;
    capacity: number;
    equipment: string[];
    areaId: string;
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
    stubType?: 'weekday' | 'sunday';
    assignedBy?: string;
    assignedByName?: string;
};

export type ApprovalRequest = {
    id?: string;
    requester: string;
    type: 'New Worker' | 'Profile Update' | 'Room Booking';
    details: string;
    date: Timestamp;
    status: 'Pending' | 'Pending Ministry Approval' | 'Pending Admin Approval' | 'Approved' | 'Rejected';
    workerId?: string;
    roomId?: string;
    reservationId?: string;
    requestId?: string;
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
