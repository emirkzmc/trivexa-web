import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, CheckSquare, Clock, Filter, Inbox, Search } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Pagination } from '../../../shared/components/Pagination';
import { formatDate } from '../../../shared/utils/formatDate';
import { useNotifications } from '../hooks/useNotifications';
import { useUnreadCount } from '../hooks/useUnreadCount';
import type { NotificationItem } from '../api/notifications.api';

type NotificationViewFilter = 'all' | 'unread' | 'read';

const LIMIT_OPTIONS = [10, 20, 50];

function normalizeText(value: string): string {
    return value.toLocaleLowerCase('tr');
}

function getTypeLabel(type: string): string {
    const normalized = type.trim().toUpperCase();
    if (normalized.includes('TASK')) return 'Görev';
    if (normalized.includes('PROJECT')) return 'Proje';
    if (normalized.includes('TIME')) return 'Time Tracker';
    if (normalized.includes('INVOICE') || normalized.includes('FINANCE')) return 'Finans';
    if (normalized.includes('TICKET') || normalized.includes('REQUEST')) return 'Talep';
    if (normalized.includes('AUTH') || normalized.includes('SECURITY')) return 'Guvenlik';
    return 'Sistem';
}

function getTypeTone(type: string): string {
    const normalized = type.trim().toUpperCase();
    if (normalized.includes('TASK')) return 'bg-blue-100 text-blue-700';
    if (normalized.includes('PROJECT')) return 'bg-indigo-100 text-indigo-700';
    if (normalized.includes('TIME')) return 'bg-orange-100 text-orange-700';
    if (normalized.includes('INVOICE') || normalized.includes('FINANCE')) return 'bg-emerald-100 text-emerald-700';
    if (normalized.includes('TICKET') || normalized.includes('REQUEST')) return 'bg-amber-100 text-amber-700';
    if (normalized.includes('AUTH') || normalized.includes('SECURITY')) return 'bg-rose-100 text-rose-700';
    return 'bg-gray-100 text-gray-700';
}

function getRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const diff = Date.now() - date.getTime();

    if (Number.isNaN(diff)) return '-';

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return 'Simdi';
    if (diff < hour) return `${Math.floor(diff / minute)} dk once`;
    if (diff < day) return `${Math.floor(diff / hour)} saat once`;
    return `${Math.floor(diff / day)} gun once`;
}

export function NotificationsPage() {
    const {
        data,
        isLoading,
        isError,
        filters,
        setPage,
        setLimit,
        markAsRead,
        markAllAsRead,
        markAsReadPending,
        markAllAsReadPending,
    } = useNotifications();
    const unreadCountQuery = useUnreadCount();

    const [viewFilter, setViewFilter] = useState<NotificationViewFilter>('all');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('');

    const rows = data?.data ?? [];
    const total = data?.total ?? 0;
    const limit = filters.limit ?? 20;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const unreadOnPage = useMemo(
        () => rows.filter((item) => !item.isRead).length,
        [rows],
    );

    const readOnPage = rows.length - unreadOnPage;
    const unreadTotal = unreadCountQuery.data ?? unreadOnPage;

    const visibleRows = useMemo(() => {
        const term = normalizeText(search.trim());
        return rows.filter((item) => {
            if (viewFilter === 'unread' && item.isRead) return false;
            if (viewFilter === 'read' && !item.isRead) return false;

            if (!term) return true;
            const haystack = normalizeText(`${item.title} ${item.message} ${item.type}`);
            return haystack.includes(term);
        });
    }, [rows, viewFilter, search]);

    useEffect(() => {
        if (visibleRows.length === 0) {
            setSelectedId('');
            return;
        }

        const isSelectedVisible = visibleRows.some((item) => item.id === selectedId);
        if (!isSelectedVisible) {
            setSelectedId(visibleRows[0].id);
        }
    }, [visibleRows, selectedId]);

    const selectedNotification = useMemo(
        () => rows.find((item) => item.id === selectedId) ?? null,
        [rows, selectedId],
    );

    function handleSelect(item: NotificationItem) {
        setSelectedId(item.id);
        if (!item.isRead && !markAsReadPending) {
            markAsRead(item.id);
        }
    }

    function handleMarkSelectedAsRead() {
        if (!selectedNotification || selectedNotification.isRead || markAsReadPending) return;
        markAsRead(selectedNotification.id);
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-[18px]">
            <PageHeader
                icon={<Bell size={20} color="var(--role-accent-600)" />}
                title="Bildirimler"
                subtitle="Sistemde olusan anlik hareketleri, is atamalarini ve uyarilari takip edin."
                actions={(
                    <button
                        type="button"
                        onClick={() => markAllAsRead()}
                        disabled={markAllAsReadPending}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        <CheckCheck size={14} />
                        Tumunu okundu yap
                    </button>
                )}
            />

            <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Toplam Kayit</p>
                    <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <Inbox size={18} className="text-gray-500" />
                        {total}
                    </p>
                </article>

                <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Okunmamis</p>
                    <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-amber-800">
                        <Bell size={18} />
                        {unreadTotal}
                    </p>
                </article>

                <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Bu Sayfada Okunan</p>
                    <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-emerald-800">
                        <CheckSquare size={18} />
                        {readOnPage}
                    </p>
                </article>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setViewFilter('all')}
                            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${viewFilter === 'all' ? 'bg-[color:var(--role-accent-soft)] text-[color:var(--role-accent-700)]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Tumu ({rows.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewFilter('unread')}
                            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${viewFilter === 'unread' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Okunmamis ({unreadOnPage})
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewFilter('read')}
                            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${viewFilter === 'read' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Okunan ({readOnPage})
                        </button>
                    </div>

                    <label className="relative block w-full max-w-md">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                            <Search size={14} />
                        </span>
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Baslik, mesaj veya tipe göre ara..."
                            className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-[color:var(--role-accent-500)] focus:ring-1 focus:ring-[color:var(--role-accent-500)]"
                        />
                    </label>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="xl:col-span-7">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <Filter size={13} />
                            Liste
                        </div>

                        <div className="space-y-2">
                            {isLoading && (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                                    Bildirimler yükleniyor...
                                </div>
                            )}

                            {isError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    Bildirimler alinirken bir hata olustu.
                                </div>
                            )}

                            {!isLoading && !isError && rows.length === 0 && (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                                    Henuz bildirim bulunmuyor.
                                </div>
                            )}

                            {!isLoading && !isError && rows.length > 0 && visibleRows.length === 0 && (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                                    Arama veya filtreye uygun bildirim bulunamadı.
                                </div>
                            )}

                            {!isLoading && !isError && visibleRows.map((item) => {
                                const isSelected = item.id === selectedId;
                                const isUnread = !item.isRead;
                                return (
                                    <article
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className={`cursor-pointer rounded-lg border p-3 transition ${
                                            isUnread
                                                ? 'border-[color:var(--role-accent-300)] bg-white'
                                                : 'border-gray-200 bg-white'
                                        } ${
                                            isSelected ? 'ring-1 ring-[color:var(--role-accent-200)]' : ''
                                        } hover:border-[color:var(--role-accent-200)] hover:bg-gray-50`}
                                    >
                                        <div className="mb-1 flex items-start justify-between gap-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                {isUnread && (
                                                    <span className="h-2 w-2 rounded-full bg-red-600 shadow-[0_0_0_3px_#FEE2E2]" />
                                                )}
                                                <p className="m-0 text-sm font-semibold text-gray-900">{item.title}</p>
                                            </div>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${getTypeTone(item.type)}`}>
                                                {getTypeLabel(item.type)}
                                            </span>
                                        </div>

                                        <p className="m-0 text-xs text-gray-600">
                                            {item.message}
                                        </p>

                                        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                                            <span className="inline-flex items-center gap-1">
                                                <Clock size={12} />
                                                {getRelativeTime(item.createdAt)}
                                            </span>
                                            {item.isRead && (
                                                <span>Okundu</span>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>

                    <aside className="xl:col-span-5">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Detay
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            {!selectedNotification ? (
                                <p className="m-0 text-sm text-gray-500">
                                    Listeden bir bildirim secin.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="m-0 text-base text-gray-900">{selectedNotification.title}</h3>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${getTypeTone(selectedNotification.type)}`}>
                                            {getTypeLabel(selectedNotification.type)}
                                        </span>
                                    </div>

                                    <p className="m-0 text-sm leading-6 text-gray-700">{selectedNotification.message}</p>

                                    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600">
                                        <p className="m-0">Olusma zamani: {formatDate(selectedNotification.createdAt)}</p>
                                        <p className="m-0 mt-1">Durum: {selectedNotification.isRead ? 'Okundu' : 'Okunmamis'}</p>
                                        <p className="m-0 mt-1 font-mono text-[11px] text-gray-500">ID: {selectedNotification.id}</p>
                                    </div>

                                    {!selectedNotification.isRead && (
                                        <button
                                            type="button"
                                            onClick={handleMarkSelectedAsRead}
                                            disabled={markAsReadPending}
                                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[color:var(--role-accent-600)] px-3 text-sm font-semibold text-white transition hover:bg-[color:var(--role-accent-700)] disabled:cursor-not-allowed disabled:bg-gray-300"
                                        >
                                            <CheckCheck size={14} />
                                            Okundu isaretle
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>
                </div>

                <Pagination
                    currentPage={filters.page ?? 1}
                    totalPages={totalPages}
                    total={total}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                    limitOptions={LIMIT_OPTIONS}
                />
            </section>
        </div>
    );
}
