/**
 * Permission registry — single source of truth for all module:action strings.
 * Used for UI permission editors, middleware checks, and DB seeding.
 */
export const PERMISSIONS = {
  roles: {
    view:   'roles:view',
    create: 'roles:create',
    update: 'roles:update',
    delete: 'roles:delete',
    assign: 'roles:assign',
  },
  workers: {
    view:   'workers:view',
    create: 'workers:create',
    update: 'workers:update',
    delete: 'workers:delete',
  },
  ministries: {
    manage: 'ministries:manage',
  },
  facilities: {
    manage: 'facilities:manage',
  },
  venues: {
    create:        'venues:create',
    update:        'venues:update',
    delete:        'venues:delete',
    approve:       'venues:approve',
    view_calendar: 'venues:view_calendar',
  },
  approvals: {
    manage: 'approvals:manage',
  },
  attendance: {
    view: 'attendance:view',
    scan: 'attendance:scan',
  },
  meals: {
    view:   'meals:view',
    manage: 'meals:manage',
  },
  mentorship: {
    manage:       'mentorship:manage',
    view_reports: 'mentorship:view_reports',
  },
  reports: {
    view: 'reports:view',
  },
  system: {
    view_audit_logs: 'system:view_audit_logs',
    manage_ors_sync: 'system:manage_ors_sync',
  },
  venue_assistance: {
    manage:            'venue_assistance:manage',
    manage_own_ministry: 'venue_assistance:manage_own_ministry',
  },
  schedule: {
    manage:           'schedule:manage',
    confirm:          'schedule:confirm',
    assign_schedulers: 'schedule:assign_schedulers',
  },
  inventory: {
    access: 'inventory:access',
  },
} as const;

/** Flat list of all permission strings for iteration/seeding. */
export const ALL_PERMISSIONS: { module: string; action: string; description?: string }[] = [
  { module: 'roles',            action: 'view',                description: 'View roles list' },
  { module: 'roles',            action: 'create',              description: 'Create new roles' },
  { module: 'roles',            action: 'update',              description: 'Edit role details & permissions' },
  { module: 'roles',            action: 'delete',              description: 'Delete roles' },
  { module: 'roles',            action: 'assign',              description: 'Assign roles to workers' },
  { module: 'workers',          action: 'view',                description: 'View worker profiles' },
  { module: 'workers',          action: 'create',              description: 'Create new workers' },
  { module: 'workers',          action: 'update',              description: 'Edit worker profiles' },
  { module: 'workers',          action: 'delete',              description: 'Delete workers' },
  { module: 'ministries',       action: 'manage',              description: 'Create, edit, and delete ministries' },
  { module: 'facilities',       action: 'manage',              description: 'Manage venue elements & facility settings' },
  { module: 'venues',           action: 'create',              description: 'Create room reservations' },
  { module: 'venues',           action: 'update',              description: 'Edit room reservations' },
  { module: 'venues',           action: 'delete',              description: 'Delete room reservations' },
  { module: 'venues',           action: 'approve',             description: 'Approve/reject room reservations' },
  { module: 'venues',           action: 'view_calendar',       description: 'View master schedule calendar' },
  { module: 'approvals',        action: 'manage',              description: 'Manage all approval requests' },
  { module: 'attendance',       action: 'view',                description: 'View attendance logs' },
  { module: 'attendance',       action: 'scan',                description: 'Operate attendance/meal scanner' },
  { module: 'meals',            action: 'view',                description: 'View meal stubs' },
  { module: 'meals',            action: 'manage',              description: 'Manage and assign all meal stubs' },
  { module: 'mentorship',       action: 'manage',              description: 'Manage C2S groups & mentees' },
  { module: 'mentorship',       action: 'view_reports',        description: 'View C2S analytics & reports' },
  { module: 'reports',          action: 'view',                description: 'View system reports' },
  { module: 'system',           action: 'view_audit_logs',     description: 'View transaction/audit logs' },
  { module: 'system',           action: 'manage_ors_sync',     description: 'Manage ORS worker sync' },
  { module: 'venue_assistance', action: 'manage',              description: 'Manage all venue assistance requests' },
  { module: 'venue_assistance', action: 'manage_own_ministry', description: 'Manage own ministry assistance requests' },
  { module: 'schedule',         action: 'manage',              description: 'Create and manage Sunday service schedules' },
  { module: 'schedule',         action: 'confirm',             description: 'Confirm worker acknowledgement of schedule assignments' },
  { module: 'schedule',         action: 'assign_schedulers',   description: 'Assign Ministry Scheduler role to workers' },
  { module: 'inventory',        action: 'access',              description: 'Access the Inventory Management module' },
];

/**
 * Maps old flat permission strings to their new module:action equivalents.
 * Used for seeding RolePermission rows from legacy Role.permissions[].
 */
export const LEGACY_PERMISSION_MAP: Record<string, string[]> = {
  manage_roles:               ['roles:view', 'roles:create', 'roles:update', 'roles:delete', 'roles:assign'],
  manage_workers:             ['workers:view', 'workers:create', 'workers:update', 'workers:delete'],
  manage_ministries:          ['ministries:manage'],
  manage_facilities:          ['facilities:manage'],
  create_room_reservation:    ['venues:create'],
  edit_room_reservation:      ['venues:update'],
  delete_room_reservation:    ['venues:delete'],
  approve_room_reservation:   ['venues:approve'],
  view_schedule_masterview:   ['venues:view_calendar'],
  manage_approvals:           ['approvals:manage'],
  operate_scanner:            ['attendance:scan'],
  view_attendance_log:        ['attendance:view'],
  view_meal_stubs:            ['meals:view'],
  manage_all_mealstubs:       ['meals:manage'],
  manage_c2s:                 ['mentorship:manage'],
  view_c2s_analytics:         ['mentorship:view_reports'],
  view_reports:               ['reports:view'],
  view_transaction_logs:      ['system:view_audit_logs'],
  manage_ors_sync:            ['system:manage_ors_sync'],
  manage_venue_assistance:    ['venue_assistance:manage'],
  manage_own_ministry_assistance: ['venue_assistance:manage_own_ministry'],
};
