import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    createClient,
    updateClient,
    deleteClient,
    generatePortalAccess,
} from '../api/clients.api';
import type {
    ClientCreatePayload,
    ClientUpdatePayload,
} from '../api/clients.api';

export function useCreateClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: ClientCreatePayload) => createClient(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success('Müşteri basariyla olusturuldu', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Müşteri olusturulurken bir hata olustu', { duration: 3_000 });
        },
    });
}

export function useUpdateClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: ClientUpdatePayload }) =>
            updateClient(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success('Müşteri bilgileri güncellendi', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Guncelleme sirasinda bir hata olustu', { duration: 3_000 });
        },
    });
}

export function useDeleteClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteClient(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success('Müşteri kaydı silindi', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Silme sirasinda bir hata olustu', { duration: 3_000 });
        },
    });
}

export function useGeneratePortalAccess() {
    return useMutation({
        mutationFn: (payload: { email?: string; clientId?: string }) => generatePortalAccess(payload),
        onError: () => {
            toast.error('Portal erişim linki olusturulurken bir hata olustu', { duration: 3_000 });
        },
    });
}
