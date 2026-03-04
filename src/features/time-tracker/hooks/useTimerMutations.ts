import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { startTimer, stopTimer, cancelTimer } from '../api/timeTracker.api';
import type { StartTimerPayload } from '../api/timeTracker.api';

/**
 * Timer başlatma mutation'ı.
 * Başlamadan önce aktif timer kontrolü query cache'den yapılır.
 */
export function useStartTimer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: StartTimerPayload) => {
            // Aktif timer var mı kontrol et
            const cached = queryClient.getQueryData(['active-timer']);
            if (cached) {
                throw new Error('Zaten aktif bir timer çalışıyor');
            }
            return startTimer(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-timer'] });
            toast.success('Timer başlatıldı', { duration: 3_000 });
        },
        onError: (error) => {
            toast.error(
                error.message || 'Timer başlatılırken bir hata oluştu',
                { duration: 3_000 },
            );
        },
    });
}

/**
 * Timer durdurma mutation'ı.
 */
export function useStopTimer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => stopTimer(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-timer'] });
            queryClient.invalidateQueries({ queryKey: ['timer-history'] });
            toast.success('Timer durduruldu', { duration: 3_000 });
        },
        onError: () => {
            toast.error('Timer durdurulurken bir hata oluştu', { duration: 3_000 });
        },
    });
}

/**
 * Timer iptal etme mutation'ı.
 * Audit log backend tarafından kaydedilir.
 */
export function useCancelTimer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => cancelTimer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-timer'] });
            queryClient.invalidateQueries({ queryKey: ['timer-history'] });
            toast.success('Kayıt iptal edildi', { duration: 3_000 });
        },
        onError: () => {
            toast.error('İptal sırasında bir hata oluştu', { duration: 3_000 });
        },
    });
}
