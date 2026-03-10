import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    createClient,
    updateClient,
    deleteClient,
    deactivateClient,
    activateClient,
    generatePortalAccess,
    resetClientPortalAccess,
    approveLandingContactRequest,
    rejectLandingContactRequest,
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
            toast.success('Musteri basariyla olusturuldu', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Musteri olusturulurken bir hata olustu', { duration: 3_000 });
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
            toast.success('Musteri bilgileri guncellendi', { duration: 3_000 });
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
            toast.success('Musteri kaydi silindi', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Silme sirasinda bir hata olustu', { duration: 3_000 });
        },
    });
}

export function useDeactivateClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deactivateClient(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success('Musteri pasif hale getirildi.', { duration: 3_000 });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message
                || error?.message
                || 'Musteri pasife alinamadi.';
            toast.error(message, { duration: 3_000 });
        },
    });
}

export function useActivateClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => activateClient(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success('Musteri aktif hale getirildi.', { duration: 3_000 });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message
                || error?.message
                || 'Musteri aktif edilemedi.';
            toast.error(message, { duration: 3_000 });
        },
    });
}

export function useGeneratePortalAccess() {
    return useMutation({
        mutationFn: (payload: { email?: string; clientId?: string }) => generatePortalAccess(payload),
        onError: () => {
            toast.error('Portal erisim linki olusturulurken bir hata olustu', { duration: 3_000 });
        },
    });
}

export function useResetClientPortalAccess() {
    return useMutation({
        mutationFn: (clientId: string) => resetClientPortalAccess(clientId),
        onSuccess: () => {
            toast.success('Portal sifresi sifirlandi ve e-posta gonderildi.', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Portal sifresi sifirlanirken bir hata olustu.', { duration: 3_000 });
        },
    });
}

export function useApproveLandingContactRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => approveLandingContactRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['landing-contact-requests'] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success('Musteri talebi onaylandi ve kayit olusturuldu.', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Onay islemi sirasinda bir hata olustu.', { duration: 3_000 });
        },
    });
}

export function useRejectLandingContactRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            rejectLandingContactRequest(id, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['landing-contact-requests'] });
            toast.success('Musteri talebi reddedildi.', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Red islemi sirasinda bir hata olustu.', { duration: 3_000 });
        },
    });
}
