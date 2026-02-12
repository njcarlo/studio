export type Role = {
  id: string;
  name: string;
  privileges: { [key: string]: boolean };
}

export type User = {
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
    passwordChangeRequired?: boolean;
    createdAt: any; // Firestore Timestamp
};

export type Ministry = {
    id: string;
    name: string;
    description: string;
    department: Department;
    leaderId: string;
};

export type Department = 'Worship' | 'Outreach' | 'Relationship' | 'Discipleship' | 'Administration';

export type Booking = {
    id: string;
    roomId: string;
    title: string;
    start: any; // Timestamp
    end: any; // Timestamp
    status: 'Pending' | 'Approved' | 'Rejected';
    workerProfileId?: string;
};

export type Room = {
    id: string;
    name: string;
    capacity: number;
    equipment: string[];
    locationId: string;
};

export type Location = {
    id: string;
    name: string;
};

export type MealStub = {
    id: string;
    workerId: string;
    workerName: string;
    date: any; // Timestamp
    status: 'Issued' | 'Claimed';
    qrValue: string;
};

export type ApprovalRequest = {
    id?: string;
    requester: string;
    type: 'New Worker' | 'Profile Update' | 'Room Booking';
    details: string;
    date: any; // Timestamp
    workflowId: string;
    currentStateId: string;
    workerId?: string;
    roomId?: string;
    reservationId?: string;
};

export type ScanLog = {
    id: string;
    scannerId: string;
    scannerName: string;
    timestamp: any; // Timestamp
    scanType: 'Attendance' | 'Meal Stub' | 'Room Check-in';
    details: string;
    targetUserId?: string;
    targetUserName?: string;
    mealStubId?: string;
    reservationId?: string;
};

export type Workflow = {
    id: string;
    name: string;
    description: string;
}

export type WorkflowState = {
    id: string;
    name: string;
    order: number;
    workflowId: string;
}

export type WorkflowTransition = {
    id: string;
    name: string; // The action name, e.g., "Approve"
    workflowId: string;
    fromStateId: string;
    toStateId: string;
    allowedRoles?: string[];
}
