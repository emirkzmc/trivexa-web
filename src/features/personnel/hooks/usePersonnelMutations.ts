import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
} from '../api/personnel.api';
import type {
    PersonnelCreatePayload,
    PersonnelUpdatePayload,
} from '../api/personnel.api';

/**
 * Personel oluşturma mutation'ı.
 * Başarıda personnel listesini invalidate eder.
 */
export function useCreatePersonnel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: PersonnelCreatePayload) => createPersonnel(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            toast.success('Personel başarıyla oluşturuldu', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Personel oluşturulurken bir hata oluştu', { duration: 3_000 });
        },
    });
}

/**
 * Personel güncelleme mutation'ı.
 */
export function useUpdatePersonnel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: PersonnelUpdatePayload }) =>
            updatePersonnel(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            toast.success('Personel bilgileri güncellendi', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Güncelleme sırasında bir hata oluştu', { duration: 3_000 });
        },
    });
}

/**
 * Personel silme mutation'ı.
 */
export function useDeletePersonnel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deletePersonnel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personnel'] });
            toast.success('Personel kaydı silindi', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Silme sırasında bir hata oluştu', { duration: 3_000 });
        },
    });
}
