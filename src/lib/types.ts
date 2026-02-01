export type Worker = {
  id: string;
  name: string;
  avatarUrl: string;
  role: 'Volunteer' | 'Staff' | 'Clergy';
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Pending Approval';
  permissions: string[];
};

export type Room = {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
};

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
  type: 'Breakfast' | 'Lunch' | 'Dinner';
  status: 'Issued' | 'Claimed';
};

export type ApprovalRequest = {
  id: string;
  type: 'New Worker' | 'Profile Update' | 'Room Booking';
  requester: string;
  details: string;
  date: Date;
};
