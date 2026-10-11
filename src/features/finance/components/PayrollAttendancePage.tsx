import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { getPersonnel, type PersonnelItem } from '../../personnel/api/personnel.api';
import { getTimerHistory, type TimerEntry } from '../../time-tracker/api/timeTracker.api';

type PaidState = {
    paid: boolean;
    approvedAt?: string;
};

const DEFAULT_LIMIT = 200;
const TIME_ENTRY_LIMIT = 100;
const MAX_PAGES = 40;

function getMonthKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function getMonthRange(monthKey: string) {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    return { start, end, year, monthIndex };
}

function countWeekdays(year: number, monthIndex: number) {
    let count = 0;
    const date = new Date(year, monthIndex, 1);
    while (date.getMonth() === monthIndex) {
        const day = date.getDay();
        if (day !== 0 && day !== 6) {
            count += 1;
        }
        date.setDate(date.getDate() + 1);
    }
    return count;
}

function formatDate(value?: string) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('tr-TR');
}

function formatHours(value: number) {
    if (!Number.isFinite(value)) return '-';
    return `${value.toFixed(1)} saat`;
}

function formatMoney(value?: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) return '-';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(value);
}

function buildStorageKey(monthKey: string) {
    return `payroll-confirmations:${monthKey}`;
}

function loadPaidMap(monthKey: string): Record<string, PaidState> {
    const storageKey = buildStorageKey(monthKey);
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as Record<string, PaidState>;
        return parsed || {};
    } catch {
        return {};
    }
}

function persistPaidMap(monthKey: string, map: Record<string, PaidState>) {
    const storageKey = buildStorageKey(monthKey);
    window.localStorage.setItem(storageKey, JSON.stringify(map));
}

function normalizeName(person: PersonnelItem) {
    const full = `${person.firstName || ''} ${person.lastName || ''}`.trim();
    return full || person.email || '-';
}

export function PayrollAttendancePage() {
    const [monthKey, setMonthKey] = useState(() => getMonthKey(new Date()));
    const [paidMap, setPaidMap] = useState<Record<string, PaidState>>(() => loadPaidMap(getMonthKey(new Date())));

    const { start, end, year, monthIndex } = useMemo(() => getMonthRange(monthKey), [monthKey]);
    const workingDays = useMemo(() => countWeekdays(year, monthIndex), [year, monthIndex]);

    const personnelQuery = useQuery({
        queryKey: ['payroll-personnel'],
        queryFn: () => getPersonnel({ page: 1, limit: DEFAULT_LIMIT, isActive: 'true' }),
    });

    const timeEntriesQuery = useQuery({
        queryKey: ['payroll-time-entries', monthKey],
        queryFn: async () => {
            const allEntries: TimerEntry[] = [];
            let page = 1;

            while (page <= MAX_PAGES) {
                const response = await getTimerHistory({
                    page,
                    limit: TIME_ENTRY_LIMIT,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                });

                allEntries.push(...response.data);

                if (response.data.length < TIME_ENTRY_LIMIT) {
                    break;
                }

                page += 1;
            }

            return allEntries;
        },
    });

    function handleMonthChange(nextKey: string) {
        setMonthKey(nextKey);
        setPaidMap(loadPaidMap(nextKey));
    }

    const timeEntriesByUser = useMemo(() => {
        const map = new Map<string, TimerEntry[]>();
        (timeEntriesQuery.data ?? []).forEach((entry) => {
            if (!entry.userId) return;
            if (!map.has(entry.userId)) map.set(entry.userId, []);
            map.get(entry.userId)?.push(entry);
        });
        return map;
    }, [timeEntriesQuery.data]);

    const rows = useMemo(() => {
        const personnel = personnelQuery.data?.data ?? [];
        return personnel.map((person) => {
            const entries = timeEntriesByUser.get(person.id) || [];
            const totalSeconds = entries.reduce((acc, entry) => acc + (entry.duration ?? 0), 0);
            const totalHours = totalSeconds / 3600;
            const workedDays = totalHours / 8;
            const baseSalary = typeof person.salary === 'number' ? person.salary : undefined;
            const payable = baseSalary && workingDays > 0
                ? baseSalary * Math.min(1, workedDays / workingDays)
                : undefined;
            const paidState = paidMap[person.id];

            return {
                id: person.id,
                name: normalizeName(person),
                role: person.role || '-',
                department: person.department || '-',
                totalHours,
                workedDays,
                baseSalary,
                payable,
                paid: paidState?.paid ?? false,
                approvedAt: paidState?.approvedAt,
            };
        });
    }, [personnelQuery.data?.data, paidMap, timeEntriesByUser, workingDays]);

    const paidCount = rows.filter((row) => row.paid).length;
    const totalPayable = rows.reduce((acc, row) => acc + (row.payable ?? 0), 0);

    function handleApprove(userId: string) {
        setPaidMap((prev) => {
            const next = {
                ...prev,
                [userId]: {
                    paid: true,
                    approvedAt: new Date().toISOString(),
                },
            };
            persistPaidMap(monthKey, next);
            return next;
        });
    }

    function handleRevoke(userId: string) {
        setPaidMap((prev) => {
            const next = {
                ...prev,
                [userId]: {
                    paid: false,
                },
            };
            persistPaidMap(monthKey, next);
            return next;
        });
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<ClipboardList size={20} color="#059669" />}
                title="Puantaj ve Maas Onaylari"
                subtitle="Aylik calisma sureleri ve maas odeme onaylari"
            />

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Donem</label>
                        <input
                            type="month"
                            value={monthKey}
                            onChange={(event) => handleMonthChange(event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Calisma Gunleri</label>
                        <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700">
                            {workingDays} is gunu
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Toplam Odeme</label>
                        <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-emerald-700">
                            {formatMoney(totalPayable)}
                        </div>
                    </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={14} />
                        Onaylanan Maas: {paidCount} kisi
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                        <AlertCircle size={14} />
                        Onay Bekleyen: {Math.max(rows.length - paidCount, 0)} kisi
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">Personel Puantaj Tablosu</h3>
                <p className="mb-3 text-xs text-gray-500">
                    Calisma sureleri time-tracker kayitlarindan hesaplanir. Maas onayi secimini kaydetmek icin satirdaki butonu kullanin.
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-gray-500">
                                <th className="px-2 py-2 font-semibold">Personel</th>
                                <th className="px-2 py-2 font-semibold">Rol</th>
                                <th className="px-2 py-2 font-semibold">Departman</th>
                                <th className="px-2 py-2 font-semibold">Calisma Gun</th>
                                <th className="px-2 py-2 font-semibold">Toplam Saat</th>
                                <th className="px-2 py-2 font-semibold">Maas</th>
                                <th className="px-2 py-2 font-semibold">Odenecek</th>
                                <th className="px-2 py-2 font-semibold">Odeme Durumu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personnelQuery.isLoading || timeEntriesQuery.isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-2 py-6 text-center text-gray-400">
                                        Veriler yukleniyor...
                                    </td>
                                </tr>
                            ) : personnelQuery.isError || timeEntriesQuery.isError ? (
                                <tr>
                                    <td colSpan={8} className="px-2 py-6 text-center text-red-600">
                                        Puantaj verileri yuklenemedi.
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-2 py-6 text-center text-gray-400">
                                        Personel bulunmuyor.
                                    </td>
                                </tr>
                            ) : rows.map((row) => (
                                <tr key={row.id} className="border-b border-gray-100">
                                    <td className="px-2 py-2 text-gray-700">{row.name}</td>
                                    <td className="px-2 py-2 text-gray-700">{row.role}</td>
                                    <td className="px-2 py-2 text-gray-700">{row.department}</td>
                                    <td className="px-2 py-2 text-gray-700">{row.workedDays.toFixed(1)} gun</td>
                                    <td className="px-2 py-2 text-gray-700">{formatHours(row.totalHours)}</td>
                                    <td className="px-2 py-2 text-gray-700">{formatMoney(row.baseSalary)}</td>
                                    <td className="px-2 py-2 font-semibold text-gray-800">{formatMoney(row.payable)}</td>
                                    <td className="px-2 py-2">
                                        {row.paid ? (
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                                    Odendi
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRevoke(row.id)}
                                                    className="text-[11px] font-semibold text-gray-500 underline hover:text-gray-700"
                                                >
                                                    Geri al
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleApprove(row.id)}
                                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                            >
                                                Odemeyi Onayla
                                            </button>
                                        )}
                                        {row.approvedAt && (
                                            <div className="mt-1 text-[10px] text-gray-400">
                                                {formatDate(row.approvedAt)}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
