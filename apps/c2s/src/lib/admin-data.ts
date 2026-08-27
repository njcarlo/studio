// ─── Admin-specific static data ──────────────────────────────────────────────
// Whole C2S scope — accessible only to the admin role

// ─── RBAC / Workers ──────────────────────────────────────────────────────────
export type WorkerStatus = 'Active' | 'Inactive';
export type C2SRole = 'ministry_head' | 'cluster_head' | 'c2s_coordinator' | 'mentor' | 'department_head';

export interface AdminWorker {
    id: string;
    initials: string;
    name: string;
    color: string;
    email: string;
    phone: string;
    ministry: string;
    department?: Department;
    cluster?: string;
    c2sRole?: C2SRole;
    status: WorkerStatus;
    workerIdStatus: 'Approved' | 'Pending' | 'None';
    dateAdded: string;
    permissions: string[];
}

export const ADMIN_WORKERS: AdminWorker[] = [
    { id: 'w1',  initials: 'RD', name: 'Pastor Ramon Dela Cruz', color: '#0b9b8a', email: 'ministry@cogdasmarinas.org',         phone: '+63 917 000 0100', ministry: 'Outreach', department: 'Outreach', cluster: undefined,    c2sRole: 'ministry_head',   status: 'Active',   workerIdStatus: 'Approved', dateAdded: 'Jan 1, 2024',  permissions: ['c2s:admin_view','c2s:reports','c2s:manage_workers','c2s:manage_groups','c2s:manage_mentees'] },
    { id: 'w2',  initials: 'LE', name: 'Liza Evangelista',       color: '#6741d9', email: 'clusterhead@cogdasmarinas.org',       phone: '+63 917 000 0101', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 1', c2sRole: 'cluster_head',    status: 'Active',   workerIdStatus: 'Approved', dateAdded: 'Jan 10, 2024', permissions: ['c2s:cluster_view','c2s:manage_cluster_mentees'] },
    { id: 'w3',  initials: 'MV', name: 'Marco Villanueva',       color: '#1971c2', email: 'marco.v@cogdasmarinas.org',           phone: '+63 917 000 0102', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 2', c2sRole: 'cluster_head',    status: 'Active',   workerIdStatus: 'Approved', dateAdded: 'Jan 10, 2024', permissions: ['c2s:cluster_view','c2s:manage_cluster_mentees'] },
    { id: 'w4',  initials: 'RC', name: 'Rosa Castillo',          color: '#e91e8c', email: 'coordinator@cogdasmarinas.org',       phone: '+63 917 100 2001', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 1', c2sRole: 'c2s_coordinator', status: 'Active',   workerIdStatus: 'Approved', dateAdded: 'Feb 1, 2024',  permissions: ['c2s:coord_view','c2s:assign_mentees','c2s:manage_potential'] },
    { id: 'w5',  initials: 'BM', name: 'Ben Macaraeg',           color: '#0b9b8a', email: 'ben.m@cogdasmarinas.org',             phone: '+63 918 200 3002', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 2', c2sRole: 'c2s_coordinator', status: 'Active',   workerIdStatus: 'Approved', dateAdded: 'Feb 1, 2024',  permissions: ['c2s:coord_view','c2s:assign_mentees','c2s:manage_potential'] },
    { id: 'w6',  initials: 'SA', name: 'Sofia Aguila',           color: '#e91e8c', email: 'sofia.a@cogdasmarinas.org',           phone: '+63 919 300 4003', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 3', c2sRole: 'c2s_coordinator', status: 'Active',   workerIdStatus: 'Pending',  dateAdded: 'Feb 5, 2024',  permissions: ['c2s:coord_view','c2s:assign_mentees'] },
    { id: 'w7',  initials: 'JD', name: 'Juan Dela Cruz',         color: '#5b50d6', email: 'mentor.orchard@cogdasmarinas.org',    phone: '+63 917 123 4567', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 1', c2sRole: 'mentor',          status: 'Active',   workerIdStatus: 'Approved', dateAdded: 'Mar 1, 2024',  permissions: ['c2s:mentor_view','c2s:manage_mentees'] },
    { id: 'w8',  initials: 'PS', name: 'Pedro Santos',           color: '#e91e8c', email: 'mentor.dbb@cogdasmarinas.org',        phone: '+63 918 234 5678', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 1', c2sRole: 'mentor',          status: 'Active',   workerIdStatus: 'Approved', dateAdded: 'Mar 1, 2024',  permissions: ['c2s:mentor_view','c2s:manage_mentees'] },
    { id: 'w9',  initials: 'MR', name: 'Maria Reyes',            color: '#0b9b8a', email: 'mentor.greenfields@cogdasmarinas.org',phone: '+63 919 345 6789', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 1', c2sRole: 'mentor',          status: 'Active',   workerIdStatus: 'Approved', dateAdded: 'Mar 1, 2024',  permissions: ['c2s:mentor_view','c2s:manage_mentees'] },
    { id: 'w10', initials: 'LS', name: 'Lena Santos',            color: '#e67700', email: 'lena.s@cogdasmarinas.org',            phone: '+63 920 456 7890', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 1', c2sRole: 'mentor',          status: 'Inactive', workerIdStatus: 'Approved', dateAdded: 'Apr 1, 2024',  permissions: ['c2s:mentor_view'] },
    { id: 'w11', initials: 'AL', name: 'Ana Lim',                color: '#6741d9', email: 'ana.lim@cogdasmarinas.org',           phone: '+63 917 000 0005', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 2', c2sRole: 'mentor',          status: 'Active',   workerIdStatus: 'Approved', dateAdded: 'Jan 20, 2024', permissions: ['c2s:mentor_view','c2s:manage_mentees'] },
    { id: 'w12', initials: 'CV', name: 'Carmen Villanueva',      color: '#0c8a6e', email: 'carmen.v@cogdasmarinas.org',          phone: '+63 917 000 0006', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 2', c2sRole: 'mentor',          status: 'Active',   workerIdStatus: 'Pending',  dateAdded: 'Feb 10, 2024', permissions: ['c2s:mentor_view'] },
    { id: 'w13', initials: 'EF', name: 'Elena Fuentes',          color: '#e67700', email: 'elena.f@cogdasmarinas.org',           phone: '+63 920 111 2233', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 3', c2sRole: 'cluster_head',    status: 'Active',   workerIdStatus: 'Pending',  dateAdded: 'Jan 8, 2024',  permissions: ['c2s:cluster_view'] },
    { id: 'w14', initials: 'PB', name: 'Patricia Bautista',      color: '#e67700', email: 'patricia.b@cogdasmarinas.org',        phone: '+63 917 000 0014', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 4', c2sRole: 'c2s_coordinator', status: 'Active',   workerIdStatus: 'Approved', dateAdded: 'Feb 1, 2024',  permissions: ['c2s:coord_view','c2s:assign_mentees','c2s:manage_potential'] },
    { id: 'w15', initials: 'FR', name: 'Ferdinand Ramos',        color: '#5b50d6', email: 'ferdinand.r@cogdasmarinas.org',       phone: '+63 917 000 0015', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 5', c2sRole: 'c2s_coordinator', status: 'Active',   workerIdStatus: 'Approved', dateAdded: 'Feb 5, 2024',  permissions: ['c2s:coord_view','c2s:assign_mentees','c2s:manage_potential'] },
    { id: 'w16', initials: 'MS', name: 'Maricel Santos',         color: '#1971c2', email: 'maricel.s@cogdasmarinas.org',         phone: '+63 917 000 0016', ministry: 'Outreach', department: 'Outreach', cluster: 'Cluster 6', c2sRole: 'c2s_coordinator', status: 'Active',   workerIdStatus: 'Approved', dateAdded: 'Feb 5, 2024',  permissions: ['c2s:coord_view','c2s:assign_mentees','c2s:manage_potential'] },
];

// ─── RBAC Role Templates ──────────────────────────────────────────────────────
export interface RBACPermission {
    key: string;
    label: string;
    description: string;
    group: string;
}

export const C2S_PERMISSIONS: RBACPermission[] = [
    // Dashboard
    { key: 'c2s:dashboard',          label: 'c2s:dashboard',          description: 'View C2S dashboard',                   group: 'Dashboard' },
    { key: 'c2s:admin_view',         label: 'c2s:admin_view',         description: 'Full admin view across all C2S',       group: 'Dashboard' },
    { key: 'c2s:reports',            label: 'c2s:reports',            description: 'View and export all reports',          group: 'Dashboard' },
    // Workers
    { key: 'c2s:manage_workers',     label: 'c2s:manage_workers',     description: 'Add/edit/remove C2S workers',          group: 'Workers' },
    { key: 'c2s:assign_roles',       label: 'c2s:assign_roles',       description: 'Assign C2S roles to workers',          group: 'Workers' },
    { key: 'c2s:approve_worker_id',  label: 'c2s:approve_worker_id',  description: 'Approve/reject Worker ID requests',    group: 'Workers' },
    // Groups
    { key: 'c2s:manage_groups',      label: 'c2s:manage_groups',      description: 'Create/edit/archive C2S groups',       group: 'Groups' },
    { key: 'c2s:group_finder',       label: 'c2s:group_finder',       description: 'Manage Group Finder visibility',       group: 'Groups' },
    { key: 'c2s:group_capacity',     label: 'c2s:group_capacity',     description: 'Set/override group capacity limits',   group: 'Groups' },
    // Mentees
    { key: 'c2s:manage_mentees',     label: 'c2s:manage_mentees',     description: 'Manage active mentees in own group',   group: 'Mentees' },
    { key: 'c2s:manage_potential',   label: 'c2s:manage_potential',   description: 'Manage potential mentee pipeline',     group: 'Mentees' },
    { key: 'c2s:assign_mentees',     label: 'c2s:assign_mentees',     description: 'Assign potential mentees to mentors',  group: 'Mentees' },
    // Cluster / Coordinator views
    { key: 'c2s:cluster_view',       label: 'c2s:cluster_view',       description: 'View cluster-level data',              group: 'Scope' },
    { key: 'c2s:coord_view',         label: 'c2s:coord_view',         description: 'View coordinator-level data',          group: 'Scope' },
    { key: 'c2s:mentor_view',        label: 'c2s:mentor_view',        description: 'View mentor-level data',               group: 'Scope' },
    // Settings
    { key: 'c2s:settings',           label: 'c2s:settings',           description: 'Access system settings',              group: 'Settings' },
    { key: 'c2s:otp_settings',       label: 'c2s:otp_settings',       description: 'Manage OTP configuration',             group: 'Settings' },
    { key: 'c2s:notifications',      label: 'c2s:notifications',      description: 'Configure notification rules',         group: 'Settings' },
];

export interface RoleTemplate {
    id: string;
    name: string;
    description: string;
    color: string;
    permissions: string[];
    workerCount: number;
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
    {
        id: 'rt1',
        name: 'Ministry Head',
        description: 'Full ministry-level access with reporting and worker management',
        color: '#0b9b8a',
        permissions: ['c2s:admin_view','c2s:reports','c2s:manage_workers','c2s:manage_groups','c2s:manage_mentees','c2s:assign_roles','c2s:dashboard'],
        workerCount: 1,
    },
    {
        id: 'rt2',
        name: 'Cluster Head',
        description: 'Cluster-wide visibility over mentors, coordinators, and mentees',
        color: '#6741d9',
        permissions: ['c2s:cluster_view','c2s:manage_cluster_mentees','c2s:dashboard','c2s:reports'],
        workerCount: 6,
    },
    {
        id: 'rt3',
        name: 'C2S Coordinator',
        description: 'Manage potential mentees and assignment workflow within a cluster',
        color: '#e91e8c',
        permissions: ['c2s:coord_view','c2s:assign_mentees','c2s:manage_potential','c2s:dashboard'],
        workerCount: 6,
    },
    {
        id: 'rt4',
        name: 'Mentor',
        description: 'Manage own group, potential mentees, and mentee progress',
        color: '#5b50d6',
        permissions: ['c2s:mentor_view','c2s:manage_mentees','c2s:dashboard'],
        workerCount: ADMIN_WORKERS.filter(w => w.c2sRole === 'mentor').length,
    },
];

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export type AuditLogType = 'user_activity' | 'assignment' | 'rbac_change' | 'worker_id' | 'group_change' | 'system';

export interface AuditLog {
    id: string;
    type: AuditLogType;
    actor: string;
    actorInitials: string;
    actorColor: string;
    action: string;
    target: string;
    detail: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'critical';
}

export const AUDIT_LOGS: AuditLog[] = [
    { id: 'al1',  type: 'rbac_change',   actor: 'C2S Admin',         actorInitials: 'CA', actorColor: '#e91e8c', action: 'Assigned Role',         target: 'Sofia Aguila',         detail: 'Role "C2S Coordinator" assigned to Cluster 3',          timestamp: 'Aug 14, 2026 · 09:14 AM', severity: 'info' },
    { id: 'al2',  type: 'worker_id',     actor: 'C2S Admin',         actorInitials: 'CA', actorColor: '#e91e8c', action: 'Approved Worker ID',     target: 'Juan Dela Cruz',       detail: 'Worker ID request #W-0071 approved',                     timestamp: 'Aug 14, 2026 · 08:55 AM', severity: 'info' },
    { id: 'al3',  type: 'assignment',    actor: 'Rosa Castillo',     actorInitials: 'RC', actorColor: '#e91e8c', action: 'Assigned Mentee',        target: 'Jasmine Reyes',        detail: 'Assigned to mentor Juan Dela Cruz (Orchard Residences)', timestamp: 'Aug 14, 2026 · 08:30 AM', severity: 'info' },
    { id: 'al4',  type: 'group_change',  actor: 'Ben Macaraeg',      actorInitials: 'BM', actorColor: '#0b9b8a', action: 'Group Updated',          target: 'Emmanuel Homes',       detail: 'Group capacity changed from 8 to 10',                    timestamp: 'Aug 13, 2026 · 05:45 PM', severity: 'warning' },
    { id: 'al5',  type: 'user_activity', actor: 'Sofia Aguila',      actorInitials: 'SA', actorColor: '#e91e8c', action: 'Login',                  target: 'System',               detail: 'Successful login from 192.168.1.45',                     timestamp: 'Aug 13, 2026 · 03:22 PM', severity: 'info' },
    { id: 'al6',  type: 'rbac_change',   actor: 'C2S Admin',         actorInitials: 'CA', actorColor: '#e91e8c', action: 'Permission Revoked',     target: 'Lena Santos',          detail: 'Permission c2s:manage_mentees revoked — Inactive',       timestamp: 'Aug 13, 2026 · 02:10 PM', severity: 'critical' },
    { id: 'al7',  type: 'assignment',    actor: 'Ben Macaraeg',      actorInitials: 'BM', actorColor: '#0b9b8a', action: 'Reassigned Mentee',      target: 'Aira Mendoza',         detail: 'Transferred from Cluster 1 to Cluster 2 mentor',         timestamp: 'Aug 13, 2026 · 11:00 AM', severity: 'warning' },
    { id: 'al8',  type: 'system',        actor: 'System',            actorInitials: 'SY', actorColor: '#64748b', action: 'OTP Config Updated',     target: 'Settings',             detail: 'OTP expiry changed from 5 to 10 minutes',                timestamp: 'Aug 12, 2026 · 10:00 AM', severity: 'info' },
    { id: 'al9',  type: 'worker_id',     actor: 'C2S Admin',         actorInitials: 'CA', actorColor: '#e91e8c', action: 'Rejected Worker ID',     target: 'Carmen Villanueva',    detail: 'Worker ID request #W-0074 rejected — Missing info',      timestamp: 'Aug 12, 2026 · 09:20 AM', severity: 'warning' },
    { id: 'al10', type: 'group_change',  actor: 'Pastor Ramon Dela Cruz', actorInitials: 'RD', actorColor: '#0b9b8a', action: 'Group Archived', target: 'Salitran Heights',     detail: 'Group archived due to mentor inactivity',                timestamp: 'Aug 11, 2026 · 04:00 PM', severity: 'critical' },
    { id: 'al11', type: 'user_activity', actor: 'Pedro Santos',      actorInitials: 'PS', actorColor: '#e91e8c', action: 'Profile Updated',        target: 'Pedro Santos',         detail: 'Email address updated',                                  timestamp: 'Aug 11, 2026 · 02:45 PM', severity: 'info' },
    { id: 'al12', type: 'rbac_change',   actor: 'C2S Admin',         actorInitials: 'CA', actorColor: '#e91e8c', action: 'Role Template Applied',  target: 'Ferdinand Ramos',      detail: 'Role template "C2S Coordinator" applied to Cluster 5',   timestamp: 'Aug 10, 2026 · 09:00 AM', severity: 'info' },
];

// ─── System Notifications ─────────────────────────────────────────────────────
export type AdminNotifType = 'worker_id' | 'new_registration' | 'assignment_update' | 'hub_update' | 'system_alert';

export interface AdminNotification {
    id: string;
    type: AdminNotifType;
    title: string;
    text: string;
    time: string;
    read: boolean;
    priority: 'high' | 'medium' | 'low';
}

export const ADMIN_NOTIFICATIONS: AdminNotification[] = [
    { id: 'an1', type: 'worker_id',          title: 'Worker ID Request',        text: 'Carmen Villanueva (Cluster 2 Mentor) submitted a Worker ID request',              time: '1 hr ago',    read: false, priority: 'high' },
    { id: 'an2', type: 'worker_id',          title: 'Worker ID Request',        text: 'Elena Fuentes (Cluster 3 Cluster Head) submitted a Worker ID request',            time: '2 hrs ago',   read: false, priority: 'high' },
    { id: 'an3', type: 'new_registration',   title: 'New Potential Mentee',     text: 'Bella Flores registered via C2S Group Finder — pending coordinator assignment',   time: '3 hrs ago',   read: false, priority: 'medium' },
    { id: 'an4', type: 'new_registration',   title: 'C2S Home Application',     text: 'New C2S Home application from Sampaloc III — barangay expansion opportunity',     time: '4 hrs ago',   read: true,  priority: 'medium' },
    { id: 'an5', type: 'assignment_update',  title: 'Assignment Update',        text: 'Aira Mendoza successfully assigned to Maria Reyes (Greenfields 1)',               time: 'Yesterday',   read: true,  priority: 'low' },
    { id: 'an6', type: 'hub_update',         title: 'C2S Hub Update',           text: 'Salitran Heights C2S Home application approved by coordinator',                   time: 'Yesterday',   read: true,  priority: 'low' },
    { id: 'an7', type: 'system_alert',       title: 'System Alert',             text: 'Group capacity threshold exceeded: Salitran Heights (100%) — action recommended', time: '2 days ago',  read: true,  priority: 'high' },
    { id: 'an8', type: 'worker_id',          title: 'Worker ID Approved',       text: 'Juan Dela Cruz Worker ID request #W-0071 has been approved',                     time: '2 days ago',  read: true,  priority: 'low' },
];

// ─── System Settings ──────────────────────────────────────────────────────────
export interface GroupCapacityConfig {
    id: string;
    label: string;
    defaultMin: number;
    defaultMax: number;
    hardMax: number;
}

export const GROUP_CAPACITY_CONFIGS: GroupCapacityConfig[] = [
    { id: 'gc1', label: 'Community-based Groups', defaultMin: 5, defaultMax: 12, hardMax: 20 },
    { id: 'gc2', label: 'Church-based Groups',    defaultMin: 5, defaultMax: 15, hardMax: 25 },
    { id: 'gc3', label: 'C2S Home Groups',        defaultMin: 3, defaultMax: 8,  hardMax: 15 },
];

// ─── Ministries per Department ───────────────────────────────────────────────
export const DEPARTMENTS = ['Worship', 'Outreach', 'Relationship', 'Discipleship', 'Administration'] as const;
export type Department = typeof DEPARTMENTS[number];

export const MINISTRY_DEPARTMENTS: Record<Department, string[]> = {
    Worship:        ['Whitelight', 'Dance', 'PMT', 'Crusade', 'Singers', 'Musicians', 'Audio'],
    Outreach:       ['Cluster 1', 'Cluster 2', 'Cluster 3', 'Cluster 4', 'Cluster 5', 'Cluster 6', 'Cluster 7', 'Cluster 8', 'Cluster 9', 'WEYJTA', 'TAPAT'],
    Relationship:   ['Sports', 'GEM', 'Ushering', 'Mens', 'Ladies', 'Youth Empowered', 'Young Adults'],
    Discipleship:   ['J12', 'Oneliner', 'CLDP', 'KID', "Children's Ministry", 'Life Institute', 'KCA'],
    Administration: ['Finance', 'Engineering', 'Security and Shuttle', 'Technology', 'In house', 'Ventures', 'Arts', 'Linkages'],
};

/** Flat list of all ministry names across all departments */
export const ALL_MINISTRIES: string[] = DEPARTMENTS.flatMap(d => MINISTRY_DEPARTMENTS[d]);

/** Get the department name for a given ministry or cluster name */
export function getMinistryDept(ministryOrCluster: string): Department | undefined {
    if (DEPARTMENTS.includes(ministryOrCluster as Department)) {
        return ministryOrCluster as Department;
    }
    return DEPARTMENTS.find(d => 
        MINISTRY_DEPARTMENTS[d].includes(ministryOrCluster) ||
        ministryOrCluster.toLowerCase().includes(d.toLowerCase())
    );
}

/** Get the resolved department of a worker */
export function getDepartmentOfWorker(worker: { department?: Department; ministry?: string; cluster?: string }): Department {
    if (worker.department && DEPARTMENTS.includes(worker.department)) {
        return worker.department;
    }
    if (worker.cluster) {
        const d = getMinistryDept(worker.cluster);
        if (d) return d;
    }
    if (worker.ministry) {
        const d = getMinistryDept(worker.ministry);
        if (d) return d;
    }
    return 'Outreach';
}

// ─── Org Structure (WORDA) ────────────────────────────────────────────────────
export interface OrgMinistry {
    id: string;
    name: string;
    head: string;
    headInitials: string;
    headColor: string;
    clusters: OrgCluster[];
    totalWorkers: number;
    totalMentors: number;
    totalMentees: number;
    totalGroups: number;
}

export interface OrgCluster {
    id: string;
    name: string;
    clusterHead: string;
    clusterHeadInitials: string;
    clusterHeadColor: string;
    coordinator: string;
    coordinatorInitials: string;
    coordinatorColor: string;
    mentorCount: number;
    menteeCount: number;
    groupCount: number;
}

export const ORG_MINISTRIES: OrgMinistry[] = [
    // 1. WORSHIP
    {
        id: 'om2',
        name: 'Worship Ministry',
        head: 'Pastor Jose Aquino',
        headInitials: 'JA',
        headColor: '#1e3a6e',
        totalWorkers: 48,
        totalMentors: 14,
        totalMentees: 55,
        totalGroups: 18,
        clusters: [
            { id: 'wc1', name: 'Whitelight', clusterHead: 'Andrea Santos',    clusterHeadInitials: 'AS', clusterHeadColor: '#4DA6F5', coordinator: 'Luis Reyes',    coordinatorInitials: 'LR', coordinatorColor: '#6741d9', mentorCount: 4, menteeCount: 18, groupCount: 5 },
            { id: 'wc2', name: 'Dance',      clusterHead: 'Miguela Cruz',     clusterHeadInitials: 'MC', clusterHeadColor: '#1971c2', coordinator: 'Nora Bautista', coordinatorInitials: 'NB', coordinatorColor: '#5b50d6', mentorCount: 3, menteeCount: 15, groupCount: 4 },
            { id: 'wc3', name: 'PMT',        clusterHead: 'Victor Hernandez', clusterHeadInitials: 'VH', clusterHeadColor: '#0b9b8a', coordinator: 'Rita Domingo',  coordinatorInitials: 'RD', coordinatorColor: '#e67700', mentorCount: 4, menteeCount: 16, groupCount: 5 },
            { id: 'wc4', name: 'Crusade',    clusterHead: 'Clara Magno',      clusterHeadInitials: 'CM', clusterHeadColor: '#5b50d6', coordinator: 'Ernesto Vega',  coordinatorInitials: 'EV', coordinatorColor: '#0b9b8a', mentorCount: 3, menteeCount:  6, groupCount: 4 },
            { id: 'wc5', name: 'Singers',    clusterHead: 'Jose Reyes',       clusterHeadInitials: 'JR', clusterHeadColor: '#1e3a6e', coordinator: 'Ana Cruz',      coordinatorInitials: 'AC', coordinatorColor: '#6741d9', mentorCount: 2, menteeCount:  5, groupCount: 3 },
            { id: 'wc6', name: 'Musicians',  clusterHead: 'Ben Lim',          clusterHeadInitials: 'BL', clusterHeadColor: '#2d7a2d', coordinator: 'Rosa Santos',   coordinatorInitials: 'RS', coordinatorColor: '#1971c2', mentorCount: 2, menteeCount:  6, groupCount: 3 },
            { id: 'wc7', name: 'Audio',      clusterHead: 'Carlo Diaz',       clusterHeadInitials: 'CD', clusterHeadColor: '#b22222', coordinator: 'Luz Reyes',     coordinatorInitials: 'LR', coordinatorColor: '#0b9b8a', mentorCount: 2, menteeCount:  4, groupCount: 2 },
        ],
    },
    // 2. OUTREACH
    {
        id: 'om1',
        name: 'Outreach Ministry',
        head: 'Pastor Ramon Dela Cruz',
        headInitials: 'RD',
        headColor: '#e8952a',
        totalWorkers: 64,
        totalMentors: 23,
        totalMentees: 83,
        totalGroups: 23,
        clusters: [
            { id: 'oc1', name: 'Cluster 1', clusterHead: 'Liza Evangelista',   clusterHeadInitials: 'LE', clusterHeadColor: '#5b50d6', coordinator: 'Rosa Castillo',     coordinatorInitials: 'RC', coordinatorColor: '#5b50d6', mentorCount: 4, menteeCount: 14, groupCount: 4 },
            { id: 'oc2', name: 'Cluster 2', clusterHead: 'Marco Villanueva',   clusterHeadInitials: 'MV', clusterHeadColor: '#0b9b8a', coordinator: 'Ben Macaraeg',      coordinatorInitials: 'BM', coordinatorColor: '#6741d9', mentorCount: 3, menteeCount: 10, groupCount: 3 },
            { id: 'oc3', name: 'Cluster 3', clusterHead: 'Elena Fuentes',      clusterHeadInitials: 'EF', clusterHeadColor: '#e67700', coordinator: 'Sofia Aguila',      coordinatorInitials: 'SA', coordinatorColor: '#0b9b8a', mentorCount: 5, menteeCount: 18, groupCount: 5 },
            { id: 'oc4', name: 'Cluster 4', clusterHead: 'Ramon Dela Cruz',    clusterHeadInitials: 'RD', clusterHeadColor: '#1971c2', coordinator: 'Patricia Bautista', coordinatorInitials: 'PB', coordinatorColor: '#e67700', mentorCount: 4, menteeCount: 12, groupCount: 4 },
            { id: 'oc5', name: 'Cluster 5', clusterHead: 'Cynthia Torres',     clusterHeadInitials: 'CT', clusterHeadColor: '#5b50d6', coordinator: 'Ferdinand Ramos',   coordinatorInitials: 'FR', coordinatorColor: '#5b50d6', mentorCount: 3, menteeCount:  9, groupCount: 3 },
            { id: 'oc6', name: 'Cluster 6', clusterHead: 'Danilo Reyes',       clusterHeadInitials: 'DR', clusterHeadColor: '#0c8a6e', coordinator: 'Maricel Santos',    coordinatorInitials: 'MS', coordinatorColor: '#1971c2', mentorCount: 4, menteeCount: 15, groupCount: 4 },
            { id: 'oc7', name: 'Cluster 7', clusterHead: 'Nilda Aquino',       clusterHeadInitials: 'NA', clusterHeadColor: '#b22222', coordinator: 'Tony Reyes',        coordinatorInitials: 'TR', coordinatorColor: '#2d7a2d', mentorCount: 3, menteeCount:  8, groupCount: 3 },
            { id: 'oc8', name: 'Cluster 8', clusterHead: 'Rodel Cruz',         clusterHeadInitials: 'RC', clusterHeadColor: '#1e3a6e', coordinator: 'Gina Santos',       coordinatorInitials: 'GS', coordinatorColor: '#e67700', mentorCount: 3, menteeCount:  7, groupCount: 3 },
            { id: 'oc9', name: 'Cluster 9', clusterHead: 'Precy Lim',          clusterHeadInitials: 'PL', clusterHeadColor: '#6741d9', coordinator: 'Bert Diaz',         coordinatorInitials: 'BD', coordinatorColor: '#0b9b8a', mentorCount: 3, menteeCount:  8, groupCount: 3 },
            { id: 'oc10', name: 'WEYJTA',   clusterHead: 'Minda Torres',       clusterHeadInitials: 'MT', clusterHeadColor: '#e67700', coordinator: 'Nick Bautista',     coordinatorInitials: 'NB', coordinatorColor: '#5b50d6', mentorCount: 2, menteeCount:  6, groupCount: 2 },
            { id: 'oc11', name: 'PAT',      clusterHead: 'Aling Rosa',         clusterHeadInitials: 'AR', clusterHeadColor: '#0b9b8a', coordinator: 'Cora Mendoza',      coordinatorInitials: 'CM', coordinatorColor: '#1971c2', mentorCount: 2, menteeCount:  5, groupCount: 2 },
        ],
    },
    // 3. RELATIONSHIP
    {
        id: 'om4',
        name: 'Relationship Ministry',
        head: 'Pastor Grace Dela Torre',
        headInitials: 'GT',
        headColor: '#b22222',
        totalWorkers: 42,
        totalMentors: 18,
        totalMentees: 60,
        totalGroups: 24,
        clusters: [
            { id: 'rc1', name: 'Sports',         clusterHead: 'Josie Navarro',    clusterHeadInitials: 'JN', clusterHeadColor: '#5b50d6', coordinator: 'Alvin Cruz',      coordinatorInitials: 'AC', coordinatorColor: '#1971c2', mentorCount: 5, menteeCount: 18, groupCount: 7 },
            { id: 'rc2', name: 'GEM',            clusterHead: 'Rommel Aguilar',   clusterHeadInitials: 'RA', clusterHeadColor: '#5b50d6', coordinator: 'Cecile Morales',  coordinatorInitials: 'CM', coordinatorColor: '#0b9b8a', mentorCount: 4, menteeCount: 15, groupCount: 6 },
            { id: 'rc3', name: 'Ushering',       clusterHead: 'Marites Ocampo',   clusterHeadInitials: 'MO', clusterHeadColor: '#e67700', coordinator: 'Randolph Dizon',  coordinatorInitials: 'RD', coordinatorColor: '#6741d9', mentorCount: 5, menteeCount: 16, groupCount: 6 },
            { id: 'rc4', name: 'Mens',           clusterHead: 'Cheryl Mangahas',  clusterHeadInitials: 'CM', clusterHeadColor: '#0b9b8a', coordinator: 'Gilbert Santos',  coordinatorInitials: 'GS', coordinatorColor: '#5b50d6', mentorCount: 4, menteeCount: 11, groupCount: 5 },
            { id: 'rc5', name: 'Ladies',         clusterHead: 'Linda Reyes',      clusterHeadInitials: 'LR', clusterHeadColor: '#b22222', coordinator: 'Maria Cruz',      coordinatorInitials: 'MC', coordinatorColor: '#e67700', mentorCount: 3, menteeCount: 10, groupCount: 4 },
            { id: 'rc6', name: 'Youth Empowered',clusterHead: 'Dan Santos',       clusterHeadInitials: 'DS', clusterHeadColor: '#1e3a6e', coordinator: 'June Lim',        coordinatorInitials: 'JL', coordinatorColor: '#0b9b8a', mentorCount: 4, menteeCount: 14, groupCount: 5 },
            { id: 'rc7', name: 'Young Adults',   clusterHead: 'Kris Bautista',    clusterHeadInitials: 'KB', clusterHeadColor: '#2d7a2d', coordinator: 'Anna Tan',        coordinatorInitials: 'AT', coordinatorColor: '#6741d9', mentorCount: 3, menteeCount: 11, groupCount: 4 },
        ],
    },
    // 4. DISCIPLESHIP
    {
        id: 'om3',
        name: 'Discipleship Ministry',
        head: 'Pastor Maria Santos',
        headInitials: 'MS',
        headColor: '#2d7a2d',
        totalWorkers: 72,
        totalMentors: 28,
        totalMentees: 112,
        totalGroups: 35,
        clusters: [
            { id: 'dc1', name: 'J12',                clusterHead: 'Noel Torres',      clusterHeadInitials: 'NT', clusterHeadColor: '#E05C5C', coordinator: 'Lydia Puno',      coordinatorInitials: 'LP', coordinatorColor: '#5b50d6', mentorCount: 6, menteeCount: 28, groupCount: 8 },
            { id: 'dc2', name: 'Oneliner',           clusterHead: 'Flor Batungbakal', clusterHeadInitials: 'FB', clusterHeadColor: '#e67700', coordinator: 'Dante Espiritu',  coordinatorInitials: 'DE', coordinatorColor: '#0b9b8a', mentorCount: 5, menteeCount: 25, groupCount: 7 },
            { id: 'dc3', name: 'CLDP',               clusterHead: 'Rene Geronimo',    clusterHeadInitials: 'RG', clusterHeadColor: '#1971c2', coordinator: 'Elvira Castillo', coordinatorInitials: 'EC', coordinatorColor: '#5b50d6', mentorCount: 5, menteeCount: 22, groupCount: 6 },
            { id: 'dc4', name: 'KID',                clusterHead: 'Teresa Narciso',   clusterHeadInitials: 'TN', clusterHeadColor: '#6741d9', coordinator: 'Cris de Leon',    coordinatorInitials: 'CL', coordinatorColor: '#e67700', mentorCount: 6, menteeCount: 22, groupCount: 8 },
            { id: 'dc5', name: "Children's Ministry",clusterHead: 'Arnel Magsino',    clusterHeadInitials: 'AM', clusterHeadColor: '#0c8a6e', coordinator: 'Daisy Corpuz',    coordinatorInitials: 'DC', coordinatorColor: '#5b50d6', mentorCount: 6, menteeCount: 15, groupCount: 6 },
            { id: 'dc6', name: 'Life Institute',     clusterHead: 'Perla Santos',     clusterHeadInitials: 'PS', clusterHeadColor: '#2d7a2d', coordinator: 'Ricky Lim',       coordinatorInitials: 'RL', coordinatorColor: '#1971c2', mentorCount: 4, menteeCount: 12, groupCount: 5 },
            { id: 'dc7', name: 'KCA',                clusterHead: 'Virgie Cruz',      clusterHeadInitials: 'VC', clusterHeadColor: '#1e3a6e', coordinator: 'Nestor Diaz',     coordinatorInitials: 'ND', coordinatorColor: '#6741d9', mentorCount: 4, menteeCount: 11, groupCount: 5 },
        ],
    },
    // 5. ADMINISTRATION
    {
        id: 'om5',
        name: 'Administration Ministry',
        head: 'Pastor Roberto Lim',
        headInitials: 'RL',
        headColor: '#1a1a1a',
        totalWorkers: 30,
        totalMentors: 6,
        totalMentees: 0,
        totalGroups: 0,
        clusters: [
            { id: 'ac1', name: 'Finance',              clusterHead: 'Rosario Medina',  clusterHeadInitials: 'RM', clusterHeadColor: '#6741d9', coordinator: 'Danilo Pascual',    coordinatorInitials: 'DP', coordinatorColor: '#1971c2', mentorCount: 2, menteeCount: 0, groupCount: 0 },
            { id: 'ac2', name: 'Engineering',          clusterHead: 'Ernesto Bernal',  clusterHeadInitials: 'EB', clusterHeadColor: '#5b50d6', coordinator: 'Luisa Fontanilla',  coordinatorInitials: 'LF', coordinatorColor: '#0b9b8a', mentorCount: 2, menteeCount: 0, groupCount: 0 },
            { id: 'ac3', name: 'Security and Shuttle', clusterHead: 'Sylvia Abadilla', clusterHeadInitials: 'SA', clusterHeadColor: '#e67700', coordinator: 'Nestor Villafuerte',coordinatorInitials: 'NV', coordinatorColor: '#5b50d6', mentorCount: 2, menteeCount: 0, groupCount: 0 },
            { id: 'ac4', name: 'Technology',           clusterHead: 'Ben Reyes',       clusterHeadInitials: 'BR', clusterHeadColor: '#1971c2', coordinator: 'Glo Santos',        coordinatorInitials: 'GS', coordinatorColor: '#6741d9', mentorCount: 1, menteeCount: 0, groupCount: 0 },
            { id: 'ac5', name: 'In house',             clusterHead: 'Cora Diaz',       clusterHeadInitials: 'CD', clusterHeadColor: '#0b9b8a', coordinator: 'Tony Cruz',         coordinatorInitials: 'TC', coordinatorColor: '#e67700', mentorCount: 1, menteeCount: 0, groupCount: 0 },
            { id: 'ac6', name: 'Ventures',             clusterHead: 'Ray Lim',         clusterHeadInitials: 'RL', clusterHeadColor: '#2d7a2d', coordinator: 'Neth Bautista',     coordinatorInitials: 'NB', coordinatorColor: '#1971c2', mentorCount: 1, menteeCount: 0, groupCount: 0 },
            { id: 'ac7', name: 'Arts',                 clusterHead: 'Mia Torres',      clusterHeadInitials: 'MT', clusterHeadColor: '#b22222', coordinator: 'Jun Reyes',         coordinatorInitials: 'JR', coordinatorColor: '#0b9b8a', mentorCount: 1, menteeCount: 0, groupCount: 0 },
            { id: 'ac8', name: 'Linkages',             clusterHead: 'Dan Mendoza',     clusterHeadInitials: 'DM', clusterHeadColor: '#1e3a6e', coordinator: 'Paz Santos',        coordinatorInitials: 'PS', coordinatorColor: '#6741d9', mentorCount: 1, menteeCount: 0, groupCount: 0 },
        ],
    },
];

// ─── Analytics / Reports data ─────────────────────────────────────────────────
export const ADMIN_GROWTH_DATA = [
    { month: 'Feb', mentees: 195, mentors: 68, groups: 148 },
    { month: 'Mar', mentees: 218, mentors: 72, groups: 155 },
    { month: 'Apr', mentees: 242, mentors: 76, groups: 161 },
    { month: 'May', mentees: 268, mentors: 80, groups: 168 },
    { month: 'Jun', mentees: 289, mentors: 84, groups: 174 },
    { month: 'Jul', mentees: 310, mentors: 89, groups: 179 },
];

export const ADMIN_MINISTRY_PERF = [
    { name: 'Outreach',       mentees: 83,  mentors: 23, groups: 23 },
    { name: 'Worship',        mentees: 55,  mentors: 14, groups: 18 },
    { name: 'Discipleship',   mentees: 112, mentors: 28, groups: 35 },
    { name: 'Relationship',   mentees: 60,  mentors: 18, groups: 24 },
    { name: 'Administration', mentees: 0,   mentors: 6,  groups: 0  },
];
