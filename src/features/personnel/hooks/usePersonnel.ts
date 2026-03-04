import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getPersonnel } from '../api/personnel.api';
import type { PersonnelListParams } from '../api/personnel.api';
import { useAuthStore } from '../../auth/store/authStore';

const DEFAULT_LIMIT = 20;

/**
 * Personel listesi hook'u.
 * Filtre state'ini URL query param'lara yansıtır.
 * MANAGER rolü ise dept parametresi otomatik user.department olur.
 */
export function usePersonnel() {
    const [searchParams, setSearchParams] = useSearchParams();
    const user = useAuthStore((s) => s.user);

    const filters: PersonnelListParams = {
        page: Number(searchParams.get('page')) || 1,
        limit: Number(searchParams.get('limit')) || DEFAULT_LIMIT,
        dept: searchParams.get('dept') || undefined,
        role: searchParams.get('role') || undefined,
        status: searchParams.get('status') || undefined,
        search: searchParams.get('search') || undefined,
    };

    // MANAGER sadece kendi departmanını görebilir
    if (user?.role === 'MANAGER') {
        filters.dept = user.department;
    }

    const query = useQuery({
        queryKey: ['personnel', filters],
        queryFn: () => getPersonnel(filters),
    });

    function setFilter(key: string, value: string | undefined) {
        const next = new URLSearchParams(searchParams);
        if (value) {
            next.set(key, value);
        } else {
            next.delete(key);
        }
        // Filtre değiştiğinde sayfayı 1'e resetle
        if (key !== 'page') next.set('page', '1');
        setSearchParams(next, { replace: true });
    }

    function setPage(page: number) {
        setFilter('page', String(page));
    }

    return { ...query, filters, setFilter, setPage };
}
