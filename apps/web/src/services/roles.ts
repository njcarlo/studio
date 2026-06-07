import { prisma } from '@studio/database/prisma';
import { CreateRoleInput, UpdateRoleInput } from '@/lib/schemas/role.schemas';

export class RolesService {
    static async createRole(data: CreateRoleInput & { permissions?: string[] }) {
        return prisma.role.create({ 
            data: { 
                name: data.name, 
                permissions: data.permissions ?? [] 
            } 
        });
    }

    static async updateRole(id: string, data: UpdateRoleInput) {
        return prisma.role.update({
            where: { id },
            data: { ...(data.name !== undefined ? { name: data.name } : {}) },
        });
    }

    static async deleteRole(id: string) {
        return prisma.role.delete({ where: { id } });
    }

    static async setRolePermissions(roleId: string, permissions: string[]) {
        return prisma.role.update({
            where: { id: roleId },
            data: { permissions },
        });
    }
}
