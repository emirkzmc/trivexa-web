import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    createPersonnel,
    updatePersonnel,
    deactivatePersonnel,
    activatePersonnel,
} from '../api/personnel.api';
import type {
    PersonnelCreatePayload,
    PersonnelUpdatePayload,
} from '../api/personnel.api';

export function useCreatePersonnel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PersonnelCreatePayload) => createPersonnel(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            toast.success('Personel basariyla olusturuldu', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Personel olusturulurken bir hata olustu', { duration: 3_000 });
        },
    });
}

export function useUpdatePersonnel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: PersonnelUpdatePayload }) =>
            updatePersonnel(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            toast.success('Personel bilgileri guncellendi', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Guncelleme sirasinda bir hata olustu', { duration: 3_000 });
        },
    });
}

export function useDeactivatePersonnel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deactivatePersonnel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            toast.success('Personel deaktif edildi', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Deaktif etme sirasinda bir hata olustu', { duration: 3_000 });
        },
    });
}

export function useActivatePersonnel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => activatePersonnel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            toast.success('Personel aktif edildi', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Aktif etme sirasinda bir hata olustu', { duration: 3_000 });
        },
    });
}
