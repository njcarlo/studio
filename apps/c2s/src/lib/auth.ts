// ─── Static accounts ─────────────────────────────────────────────────────────

export type UserRole = 'ministry_head' | 'mentor' | 'cluster_head' | 'c2s_coordinator';

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    group?: string;    // mentor's assigned group
    cluster?: string;  // cluster head's cluster
    avatar: string;    // initials
}

export const STATIC_USERS: User[] = [
    {
        id: '1',
        name: 'Pastor Ramon Dela Cruz',
        email: 'ministry@cogdasmarinas.org',
        password: 'Ministry@2024',
        role: 'ministry_head',
        avatar: 'RD',
    },
    {
        id: '2',
        name: 'Juan Dela Cruz',
        email: 'mentor.orchard@cogdasmarinas.org',
        password: 'Mentor@2024',
        role: 'mentor',
        group: 'Orchard Residences',
        avatar: 'JD',
    },
    {
        id: '3',
        name: 'Pedro Santos',
        email: 'mentor.dbb@cogdasmarinas.org',
        password: 'Mentor@2024',
        role: 'mentor',
        group: 'DBB-B',
        avatar: 'PS',
    },
    {
        id: '4',
        name: 'Maria Reyes',
        email: 'mentor.greenfields@cogdasmarinas.org',
        password: 'Mentor@2024',
        role: 'mentor',
        group: 'Greenfields 1',
        avatar: 'MR',
    },
    {
        id: '5',
        name: 'Liza Evangelista',
        email: 'clusterhead@cogdasmarinas.org',
        password: 'Cluster@2024',
        role: 'cluster_head',
        cluster: 'Outreach Cluster 4',
        avatar: 'LE',
    },
    {
        id: '6',
        name: 'Rosa Castillo',
        email: 'coordinator@cogdasmarinas.org',
        password: 'Coord@2024',
        role: 'c2s_coordinator',
        cluster: 'Outreach Cluster 4',
        avatar: 'RC',
    },
];

export function authenticate(email: string, password: string): User | null {
    return STATIC_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    ) ?? null;
}
