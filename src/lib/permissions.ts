export const allPermissions = [
    'create_user', 
    'delete_user', 
    'edit_all', 
    'manage_roles'
] as const;

export type Permission = typeof allPermissions[number];
