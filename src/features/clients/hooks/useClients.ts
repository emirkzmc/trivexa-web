import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getClients } from '../api/clients.api';
import type { ClientListParams } from '../api/clients.api';
import { useAuthStore } from '../../auth/store/authStore';

const DEFAULT_LIMIT = 20;

/**
 * Müşteri listesi hook'u.
 * ACCOUNT_MANAGER rolü sadece kendi müşterilerini görür.
 */
export function useClients() {
    const [searchParams, setSearchParams] = useSearchParams();
    const user = useAuthStore((s) => s.user);

    const filters: ClientListParams = {
        page: Number(searchParams.get('page')) || 1,
        limit: Number(searchParams.get('limit')) || DEFAULT_LIMIT,
        status: searchParams.get('status') || undefined,
        search: searchParams.get('search') || undefined,
        accountManagerId: undefined,
    };

    // ACCOUNT_MANAGER sadece kendi müşterilerini görür
    if (user?.role === 'ACCOUNT_MANAGER') {
        filters.accountManagerId = user.id;
    }

    const query = useQuery({
        queryKey: ['clients', filters],
        queryFn: () => getClients(filters),
    });

    function setFilter(key: string, value: string | undefined) {
        const next = new URLSearchParams(searchParams);
        if (value) {
            next.set(key, value);
        } else {
            next.delete(key);
        }
        if (key !== 'page') next.set('page', '1');
        setSearchParams(next, { replace: true });
    }

    function setPage(page: number) {
        setFilter('page', String(page));
    }

    return { ...query, filters, setFilter, setPage };
}
