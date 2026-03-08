import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { getNotifications, markAllAsRead, markAsRead, type NotificationItem } from '../../../features/notifications/api/notifications.api';
import { useUnreadCount } from '../../../features/notifications/hooks/useUnreadCount';
import { formatDate } from '../../utils/formatDate';

interface NotificationsDropdownProps {
    hasFreshNotification?: boolean;
    onClearFreshNotification?: () => void;
}

function getTypeLabel(type: string): string {
    const normalized = type.trim().toUpperCase();
    if (normalized.includes('TASK')) return 'Görev';
    if (normalized.includes('PROJECT')) return 'Proje';
    if (normalized.includes('TIME')) return 'Time';
    if (normalized.includes('FINANCE') || normalized.includes('INVOICE')) return 'Finans';
    if (normalized.includes('AUTH') || normalized.includes('SECURITY')) return 'Guvenlik';
    return 'Sistem';
}

function shorten(text: string, max = 86): string {
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
}

export function NotificationsDropdown({
    hasFreshNotification = false,
    onClearFreshNotification,
}: NotificationsDropdownProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);

    const unreadCountQuery = useUnreadCount();
    const unreadCount = unreadCountQuery.data ?? 0;

    const latestQuery = useQuery({
        queryKey: ['notifications', 'header', 'latest'],
        queryFn: () => getNotifications({ page: 1, limit: 7 }),
        enabled: open,
        staleTime: 10_000,
        refetchInterval: open ? 15_000 : false,
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string) => markAsRead(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => markAllAsRead(),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['notifications'] });
            void queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        },
    });

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (!target) return;
            if (wrapperRef.current?.contains(target)) return;
            setOpen(false);
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('mousedown', handlePointerDown);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    const rows = latestQuery.data?.data ?? [];

    function handleRowClick(item: NotificationItem) {
        if (!item.isRead && !markReadMutation.isPending) {
            markReadMutation.mutate(item.id);
        }
        onClearFreshNotification?.();
        navigate('/app/notifications');
        setOpen(false);
    }

    function handleOpenNotificationsPage() {
        onClearFreshNotification?.();
        navigate('/app/notifications');
        setOpen(false);
    }

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => {
                    setOpen((prev) => {
                        const next = !prev;
                        if (next) {
                            onClearFreshNotification?.();
                        }
                        return next;
                    });
                }}
                aria-label="Bildirimler"
                title="Bildirimler"
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    backgroundColor: open ? 'var(--role-accent-soft)' : '#fff',
                    color: open ? 'var(--role-accent-700)' : '#4B5563',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    position: 'relative',
                    transition: 'background-color 0.15s, color 0.15s',
                }}
            >
                <Bell size={16} />
                {hasFreshNotification && (
                    <span
                        style={{
                            position: 'absolute',
                            right: 2,
                            bottom: 2,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#EF4444',
                            border: '1.5px solid #FFFFFF',
                        }}
                    />
                )}
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            minWidth: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: 'var(--role-accent-600)',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 700,
                            lineHeight: '16px',
                            padding: '0 4px',
                            textAlign: 'center',
                            border: '2px solid #fff',
                        }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        right: 0,
                        width: 360,
                        maxWidth: 'min(360px, calc(100vw - 24px))',
                        border: '1px solid #E5E7EB',
                        borderRadius: 12,
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.14)',
                        zIndex: 90,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            borderBottom: '1px solid #F1F5F9',
                        }}
                    >
                        <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>Bildirimler</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6B7280' }}>
                                Okunmamis: {unreadCount}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                            style={{
                                height: 28,
                                borderRadius: 7,
                                border: '1px solid #D1D5DB',
                                backgroundColor: '#fff',
                                color: '#374151',
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '0 8px',
                                cursor: markAllReadMutation.isPending ? 'not-allowed' : 'pointer',
                                opacity: markAllReadMutation.isPending ? 0.5 : 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                            }}
                        >
                            <CheckCheck size={12} />
                            Tumunu okundu yap
                        </button>
                    </div>

                    <div style={{ maxHeight: 380, overflowY: 'auto', padding: 8 }}>
                        {latestQuery.isLoading && (
                            <div style={{ padding: 10, fontSize: 12, color: '#6B7280' }}>
                                Bildirimler yükleniyor...
                            </div>
                        )}

                        {latestQuery.isError && (
                            <div style={{ padding: 10, fontSize: 12, color: '#B91C1C' }}>
                                Bildirimler alinamadi.
                            </div>
                        )}

                        {!latestQuery.isLoading && !latestQuery.isError && rows.length === 0 && (
                            <div style={{ padding: 10, fontSize: 12, color: '#6B7280' }}>
                                Gosterilecek bildirim yok.
                            </div>
                        )}

                        {!latestQuery.isLoading && !latestQuery.isError && rows.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleRowClick(item)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    border: '1px solid #E5E7EB',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 9,
                                    padding: '9px 10px',
                                    marginBottom: 7,
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                                        {!item.isRead && (
                                            <span
                                                style={{
                                                    width: 7,
                                                    height: 7,
                                                    borderRadius: '50%',
                                                    backgroundColor: '#DC2626',
                                                    boxShadow: '0 0 0 3px #FEE2E2',
                                                    flexShrink: 0,
                                                }}
                                            />
                                        )}
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#111827' }}>
                                            {shorten(item.title, 54)}
                                        </p>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#475569',
                                            backgroundColor: '#F1F5F9',
                                            borderRadius: 999,
                                            padding: '2px 7px',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {getTypeLabel(item.type)}
                                    </span>
                                </div>
                                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4B5563' }}>
                                    {shorten(item.message, 98)}
                                </p>
                                <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 10, color: '#6B7280' }}>
                                        {formatDate(item.createdAt)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div
                        style={{
                            borderTop: '1px solid #F1F5F9',
                            padding: 8,
                            backgroundColor: '#FFFFFF',
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleOpenNotificationsPage}
                            style={{
                                width: '100%',
                                height: 32,
                                borderRadius: 8,
                                border: '1px solid #D1D5DB',
                                backgroundColor: '#FFFFFF',
                                color: '#374151',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                            }}
                        >
                            Tüm bildirimleri gor
                            <ExternalLink size={12} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
