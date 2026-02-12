export const allPermissions = [
    'manage_users', 
    'manage_roles',
    'manage_content',
    'manage_approvals',
    'operate_scanner',
] as const;

export type Permission = typeof allPermissions[number];
