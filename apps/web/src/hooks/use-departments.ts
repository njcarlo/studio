import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartmentSettings, createDepartmentSetting, updateDepartmentSetting, deleteDepartmentSetting, upsertDepartmentSetting } from '@/actions/db';

export function useDepartments() {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['departments'],
        queryFn: getDepartmentSettings,
        staleTime: 5 * 60_000,
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await createDepartmentSetting(data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await updateDepartmentSetting(id, data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });

    const upsertMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await upsertDepartmentSetting(id, data);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteDepartmentSetting(id);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });

    return {
        departments: data || [],
        isLoading,
        error,
        createDepartment: createMutation.mutateAsync,
        updateDepartment: updateMutation.mutateAsync,
        upsertDepartment: upsertMutation.mutateAsync,
        deleteDepartment: deleteMutation.mutateAsync,
    };
}
