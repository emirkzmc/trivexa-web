import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { validatePortalToken } from '../api/portal.api';
import { usePortalStore } from '../store/portalStore';

/**
 * Portal bağlantı validasyon hook'u.
 * Magic link ile gelindiğinde route parametresindeki token'ı alır ve validate eder.
 */
export function usePortalAuth() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const setAuth = usePortalStore((s) => s.setAuth);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function validate() {
            if (!token) {
                navigate('/404', { replace: true });
                return;
            }

            try {
                const customer = await validatePortalToken(token);
                setAuth(token, customer);
                setIsLoading(false);
            } catch {
                navigate('/404', { replace: true });
            }
        }

        validate();
    }, [token, navigate, setAuth]);

    return { isLoading };
}
