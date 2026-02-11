export type Role = {
  id: string;
  name: string;
  privileges: string[];
}

export type User = {
    id: string;
    email: string;
    roleId: string;
    status: 'active' | 'inactive';
    createdAt: any; // Firestore Timestamp
}
