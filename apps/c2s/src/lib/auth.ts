// ─── Static accounts ─────────────────────────────────────────────────────────

export type UserRole = 'ministry_head' | 'mentor' | 'cluster_head' | 'c2s_coordinator' | 'admin';

export interface User {
    id: string;
    workerId?: string;
    workerIdCreatedAt?: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department?: string;
    group?: string;    // mentor's assigned group
    cluster?: string;  // cluster head's cluster
    avatar: string;    // initials
}

export const STATIC_USERS: User[] = [
    {
        id: '0',
        workerId: 'W-0001',
        workerIdCreatedAt: '2024-01-01T08:00:00Z',
        name: 'C2S Admin',
        email: 'admin@cogdasmarinas.org',
        password: 'Admin@2024',
        role: 'admin',
        department: 'Administration',
        avatar: 'CA',
    },
    {
        id: '1',
        workerId: 'W-0012',
        workerIdCreatedAt: '2024-01-01T08:30:00Z',
        name: 'Pastor Ramon Dela Cruz',
        email: 'ministry@cogdasmarinas.org',
        password: 'Ministry@2024',
        role: 'ministry_head',
        department: 'Outreach',
        avatar: 'RD',
    },
    {
        id: '2',
        workerId: 'W-0071',
        workerIdCreatedAt: '2024-03-01T09:00:00Z',
        name: 'Juan Dela Cruz',
        email: 'mentor.orchard@cogdasmarinas.org',
        password: 'Mentor@2024',
        role: 'mentor',
        department: 'Outreach',
        group: 'Orchard Residences',
        cluster: 'Cluster 1',
        avatar: 'JD',
    },
    {
        id: '3',
        workerId: 'W-0072',
        workerIdCreatedAt: '2024-03-01T09:15:00Z',
        name: 'Pedro Santos',
        email: 'mentor.dbb@cogdasmarinas.org',
        password: 'Mentor@2024',
        role: 'mentor',
        department: 'Outreach',
        group: 'DBB-B',
        cluster: 'Cluster 1',
        avatar: 'PS',
    },
    {
        id: '4',
        workerId: 'W-0073',
        workerIdCreatedAt: '2024-03-01T09:30:00Z',
        name: 'Maria Reyes',
        email: 'mentor.greenfields@cogdasmarinas.org',
        password: 'Mentor@2024',
        role: 'mentor',
        department: 'Outreach',
        group: 'Greenfields 1',
        cluster: 'Cluster 1',
        avatar: 'MR',
    },
    {
        id: '5',
        workerId: 'W-0024',
        workerIdCreatedAt: '2024-01-10T09:00:00Z',
        name: 'Liza Evangelista',
        email: 'clusterhead@cogdasmarinas.org',
        password: 'Cluster@2024',
        role: 'cluster_head',
        department: 'Outreach',
        cluster: 'Outreach Cluster 4',
        avatar: 'LE',
    },
    {
        id: '6',
        workerId: 'W-0041',
        workerIdCreatedAt: '2024-02-01T10:00:00Z',
        name: 'Rosa Castillo',
        email: 'coordinator@cogdasmarinas.org',
        password: 'Coord@2024',
        role: 'c2s_coordinator',
        department: 'Outreach',
        cluster: 'Outreach Cluster 4',
        avatar: 'RC',
    },
];

/**
 * Resolves full worker identity metadata (including Worker ID & creation timestamp)
 * for any authenticated user session, falling back cleanly for cached sessions.
 */
export function resolveSessionUser(user: User): User {
    const match = STATIC_USERS.find(
        (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (!match) return user;
    return {
        ...match,
        ...user,
        workerId: user.workerId ?? match.workerId,
        workerIdCreatedAt: user.workerIdCreatedAt ?? match.workerIdCreatedAt,
        department: user.department ?? match.department,
    };
}

export function authenticate(email: string, password: string): User | null {
    return STATIC_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    ) ?? null;
}
