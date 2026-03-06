import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createManualEntry, deleteTimerEntry, startTimer, stopTimer } from '../api/timeTracker.api';
import type { CreateManualEntryPayload, StartTimerPayload, TimerEntry } from '../api/timeTracker.api';

function isActiveTimer(value: unknown): value is TimerEntry {
    return (
        typeof value === 'object' &&
        value !== null &&
        'status' in value &&
        (value as { status?: unknown }).status === 'ACTIVE'
    );
}

export function useStartTimer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: StartTimerPayload) => {
            const cached = queryClient.getQueryData(['active-timer']);
            if (isActiveTimer(cached)) {
                throw new Error('Zaten aktif bir timer calisiyor');
            }
            return startTimer(payload);
        },
        onSuccess: (timer) => {
            queryClient.setQueryData(['active-timer'], timer);
            queryClient.invalidateQueries({ queryKey: ['active-timer'] });
            queryClient.invalidateQueries({ queryKey: ['timer-history'] });
            toast.success('Timer baslatildi', { duration: 3000 });
        },
        onError: (error: unknown) => {
            const message = error instanceof Error
                ? error.message
                : 'Timer baslatilirken bir hata olustu';
            toast.error(message, { duration: 3000 });
        },
    });
}

export function useStopTimer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => stopTimer(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-timer'] });
            queryClient.invalidateQueries({ queryKey: ['timer-history'] });
            toast.success('Timer durduruldu', { duration: 3000 });
        },
        onError: () => {
            toast.error('Timer durdurulurken bir hata olustu', { duration: 3000 });
        },
    });
}

export function useDeleteTimerEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteTimerEntry(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-timer'] });
            queryClient.invalidateQueries({ queryKey: ['timer-history'] });
            toast.success('Kayit silindi', { duration: 3000 });
        },
        onError: () => {
            toast.error('Silme sirasinda bir hata olustu', { duration: 3000 });
        },
    });
}

export function useCreateManualEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateManualEntryPayload) => createManualEntry(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-timer'] });
            queryClient.invalidateQueries({ queryKey: ['timer-history'] });
            toast.success('Manuel kayit olusturuldu', { duration: 3000 });
        },
        onError: () => {
            toast.error('Manuel kayit olusturulurken bir hata olustu', { duration: 3000 });
        },
    });
}
