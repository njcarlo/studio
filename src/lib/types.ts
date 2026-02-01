export type WorkerRole = 'Volunteer' | 'Clergy' | 'Admin' | 'Full-time' | 'On-call' | 'Ministry Head' | 'Super Admin' | 'Department Head' | 'Mentee';

export type Worker = {
  id: string;
  workerId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  role: WorkerRole;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Pending Approval';
  permissions: string[];
  primaryMinistryId?: string;
  secondaryMinistryId?: string;
  passwordChangeRequired?: boolean;
};

export type Location = {
  id: string;
  name: string;
};

export type Room = {
  id: string;
  name: string;
  locationId: string;
  capacity: number;
  equipment: string[];
};

export type Equipment = {
  id: string;
  name: string;
  description?: string;
  available: boolean;
}

export type Booking = {
  id: string;
  roomId: string;
  roomName: string;
  workerName: string;
  start: Date;
  end: Date;
  title: string;
  status: 'Approved' | 'Pending' | 'Rejected';
};

export type MealStub = {
  id: string;
  workerId: string;
  workerName: string;
  date: Date;
  status: 'Issued' | 'Claimed';
};

export type ApprovalRequest = {
  id: string;
  type: 'New Worker' | 'Profile Update' | 'Room Booking';
  requester: string;
  details: string;
  date: Date;
  status: 'Approved' | 'Pending' | 'Rejected';
  workerId?: string;
  roomId?: string;
  reservationId?: string;
};

export type Department = 'Worship' | 'Outreach' | 'Relationship' | 'Discipleship' | 'Administration';

export type Ministry = {
  id: string;
  name: string;
  description: string;
  leaderId: string; // Worker ID
  department: Department;
};
