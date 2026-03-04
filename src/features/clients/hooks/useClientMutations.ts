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
            toast.success('Müşteri başarıyla oluşturuldu', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Müşteri oluşturulurken bir hata oluştu', { duration: 3_000 });
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
            toast.error('Güncelleme sırasında bir hata oluştu', { duration: 3_000 });
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
            toast.error('Silme sırasında bir hata oluştu', { duration: 3_000 });
        },
    });
}

export function useGeneratePortalAccess() {
    return useMutation({
        mutationFn: (clientId: string) => generatePortalAccess(clientId),
        onSuccess: () => {
            toast.success('Portal erişimi oluşturuldu', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Portal erişimi oluşturulurken bir hata oluştu', { duration: 3_000 });
        },
    });
}
