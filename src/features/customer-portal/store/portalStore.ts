import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Customer {
    id: string;
    name: string;
    company: string;
}

interface PortalState {
    portalToken: string | null;
    customer: Customer | null;
}

interface PortalActions {
    setAuth: (token: string, customer: Customer) => void;
    logout: () => void;
}

const INITIAL_STATE: PortalState = {
    portalToken: null,
    customer: null,
};

/**
 * Müşteri Portalı için izole edilmiş Zustand store.
 * Ana uygulamanın authStore'undan tamamen bağımsız çalışır.
 */
export const usePortalStore = create<PortalState & PortalActions>()(
    persist(
        (set) => ({
            ...INITIAL_STATE,
            setAuth: (portalToken, customer) => set({ portalToken, customer }),
            logout: () => set(INITIAL_STATE),
        }),
        {
            name: 'trivexa-portal-auth',
        },
    ),
);
