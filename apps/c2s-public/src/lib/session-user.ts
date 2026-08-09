/**
 * The signed-in C2S user as the client components see them. Kept free of any
 * server imports so `auth-context` (a client component) can import the type.
 */

export type UserRole = 'ministry_head' | 'mentor' | 'cluster_head' | 'c2s_coordinator';

export interface User {
    id: string;          // Worker.id
    name: string;
    email: string;
    role: UserRole;
    avatar: string;      // initials
    /** The mentor's own group, when they lead exactly one. */
    group?: string;
    groupId?: string;
    /** The cluster a cluster head oversees / a coordinator staffs. */
    cluster?: string;
    clusterId?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
    ministry_head: 'Outreach Ministry Head',
    cluster_head: 'Cluster Head',
    c2s_coordinator: 'C2S Coordinator',
    mentor: 'Mentor',
};
