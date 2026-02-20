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
    employmentType?: 'Full-Time' | 'Part-Time' | 'On-Call' | 'Volunteer';
    passwordChangeRequired?: boolean;
    createdAt: Timestamp;
};

export type Ministry = {
    id: string;
    name: string;
    description: string;
    department: Department;
    leaderId: string;
    approverId?: string;
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
    roomId: string;
    title: string;
    start: Timestamp;
    end: Timestamp;
    status: 'Pending' | 'Approved' | 'Rejected';
    workerProfileId?: string;
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
};

export type ApprovalRequest = {
    id?: string;
    requester: string;
    type: 'New Worker' | 'Profile Update' | 'Room Booking';
    details: string;
    date: Timestamp;
    status: 'Pending' | 'Approved' | 'Rejected';
    workerId?: string;
    roomId?: string;
    reservationId?: string;
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
