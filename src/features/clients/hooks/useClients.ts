import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getClients } from '../api/clients.api';
import type { ClientListParams } from '../api/clients.api';

const DEFAULT_LIMIT = 20;

interface UseClientsOptions {
    enabled?: boolean;
}

export function useClients(options: UseClientsOptions = {}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const enabled = options.enabled ?? true;

    const filters: ClientListParams = {
        page: Number(searchParams.get('page')) || 1,
        limit: Number(searchParams.get('limit')) || DEFAULT_LIMIT,
        isActive: searchParams.get('isActive') || undefined,
        search: searchParams.get('search') || undefined,
    };

    const query = useQuery({
        queryKey: ['clients', filters],
        queryFn: () => getClients(filters),
        enabled,
    });

    function setFilter(key: string, value: string | undefined) {
        const next = new URLSearchParams(searchParams);
        if (value) {
            next.set(key, value);
        } else {
            next.delete(key);
        }

        if (key !== 'page') {
            next.set('page', '1');
        }

        setSearchParams(next, { replace: true });
    }

    function setPage(page: number) {
        setFilter('page', String(page));
    }

    return { ...query, filters, setFilter, setPage };
}
