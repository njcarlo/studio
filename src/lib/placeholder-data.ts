import type { Worker, Room, Booking, MealStub, ApprovalRequest } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getAvatar = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

export const workers: Worker[] = [
  { id: '1', name: 'John Doe', avatarUrl: getAvatar('worker-avatar-1'), role: 'Volunteer', email: 'john.d@example.com', phone: '123-456-7890', status: 'Active', permissions: ['Room Booking'] },
  { id: '2', name: 'Jane Smith', avatarUrl: getAvatar('worker-avatar-2'), role: 'Full-time', email: 'jane.s@example.com', phone: '123-456-7891', status: 'Active', permissions: ['Room Booking', 'Manage Workers'] },
  { id: '3', name: 'Peter Jones', avatarUrl: getAvatar('worker-avatar-3'), role: 'Clergy', email: 'peter.j@example.com', phone: '123-456-7892', status: 'Active', permissions: ['Room Booking', 'Manage Workers', 'Approve All'] },
  { id: '4', name: 'Mary Williams', avatarUrl: getAvatar('worker-avatar-4'), role: 'Volunteer', email: 'mary.w@example.com', phone: '123-456-7893', status: 'Pending Approval', permissions: [] },
];

export const rooms: Room[] = [
  { id: 'R1', name: 'Main Hall', capacity: 200, equipment: ['Projector', 'Sound System'] },
  { id: 'R2', name: 'Meeting Room A', capacity: 20, equipment: ['Whiteboard', 'Conference Phone'] },
  { id: 'R3', name: 'Meeting Room B', capacity: 20, equipment: ['Whiteboard'] },
  { id: 'R4', name: 'Youth Center', capacity: 50, equipment: ['TV', 'Gaming Console'] },
];

export const bookings: Booking[] = [
  { id: 'B1', roomId: 'R1', roomName: 'Main Hall', workerName: 'Jane Smith', start: new Date(new Date().setDate(new Date().getDate() + 1)), end: new Date(new Date().setDate(new Date().getDate() + 1)), title: 'Youth Group Weekly', status: 'Approved' },
  { id: 'B2', roomId: 'R2', roomName: 'Meeting Room A', workerName: 'Peter Jones', start: new Date(new Date().setDate(new Date().getDate() + 2)), end: new Date(new Date().setDate(new Date().getDate() + 2)), title: 'Council Meeting', status: 'Approved' },
  { id: 'B3', roomId: 'R1', roomName: 'Main Hall', workerName: 'John Doe', start: new Date(new Date().setDate(new Date().getDate() + 3)), end: new Date(new Date().setDate(new Date().getDate() + 3)), title: 'Charity Bake Sale Prep', status: 'Pending' },
];

export const mealStubs: MealStub[] = [
  { id: 'M1', workerId: '1', workerName: 'John Doe', date: new Date(), type: 'Lunch', status: 'Issued' },
  { id: 'M2', workerId: '2', workerName: 'Jane Smith', date: new Date(), type: 'Lunch', status: 'Claimed' },
  { id: 'M3', workerId: '2', workerName: 'Jane Smith', date: new Date(new Date().setDate(new Date().getDate() - 1)), type: 'Dinner', status: 'Claimed' },
  { id: 'M4', workerId: '3', workerName: 'Peter Jones', date: new Date(), type: 'Lunch', status: 'Issued' },
];

export const approvalRequests: ApprovalRequest[] = [
  { id: 'A1', type: 'New Worker', requester: 'Mary Williams', details: 'New volunteer application.', date: new Date(new Date().setDate(new Date().getDate() - 1)) },
  { id: 'A2', type: 'Room Booking', requester: 'John Doe', details: 'Booking request for Main Hall for Charity Bake Sale Prep.', date: new Date() },
  { id: 'A3', type: 'Profile Update', requester: 'Jane Smith', details: 'Request to change phone number.', date: new Date(new Date().setDate(new Date().getDate() - 2)) },
];

export const attendanceChartData = [
  { date: 'Mon', attendance: Math.floor(Math.random() * 20) + 30 },
  { date: 'Tue', attendance: Math.floor(Math.random() * 20) + 35 },
  { date: 'Wed', attendance: Math.floor(Math.random() * 20) + 40 },
  { date: 'Thu', attendance: Math.floor(Math.random() * 20) + 38 },
  { date: 'Fri', attendance: Math.floor(Math.random() * 20) + 42 },
  { date: 'Sat', attendance: Math.floor(Math.random() * 20) + 60 },
  { date: 'Sun', attendance: Math.floor(Math.random() * 20) + 75 },
];
