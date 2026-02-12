export const allPermissions = [
    'manage_users', 
    'manage_roles',
    'manage_content',
    'manage_approvals',
    'operate_scanner',
    'manage_meal_stubs',
] as const;

export type Permission = typeof allPermissions[number];
