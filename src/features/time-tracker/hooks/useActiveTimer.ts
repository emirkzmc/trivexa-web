import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActiveTimer } from '../api/timeTracker.api';

/**
 * Aktif timer hook'u.
 * Backend'den startedAt alır, setInterval ile canlı sayaç çalıştırır.
 * Date.now() sadece elapsed süre hesabı için kullanılır, timestamp üretmez.
 */
export function useActiveTimer() {
    const [elapsed, setElapsed] = useState(0);

    const query = useQuery({
        queryKey: ['active-timer'],
        queryFn: getActiveTimer,
    });

    const startedAt = query.data?.startedAt;
    const isActive = !!query.data && query.data.status === 'ACTIVE';

    const calcElapsed = useCallback(() => {
        if (!startedAt) return 0;
        return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1_000);
    }, [startedAt]);

    useEffect(() => {
        if (!isActive || !startedAt) {
            setTimeout(() => setElapsed(0), 0);
            return;
        }

        setTimeout(() => setElapsed(calcElapsed()), 0);

        const interval = setInterval(() => {
            setElapsed(calcElapsed());
        }, 1_000);

        return () => clearInterval(interval);
    }, [isActive, startedAt, calcElapsed]);

    return {
        ...query,
        timer: query.data,
        isActive,
        elapsed,
    };
}
