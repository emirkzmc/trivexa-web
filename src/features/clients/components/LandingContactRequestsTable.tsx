import { Check, X } from 'lucide-react';
import type { LandingContactRequestItem } from '../api/clients.api';

interface LandingContactRequestsTableProps {
    data: LandingContactRequestItem[];
    isLoading: boolean;
    isError: boolean;
    isPendingAction: boolean;
    onApprove: (item: LandingContactRequestItem) => void;
    onReject: (item: LandingContactRequestItem) => void;
}

function formatDateLabel(isoDate: string) {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function LandingContactRequestsTable({
    data,
    isLoading,
    isError,
    isPendingAction,
    onApprove,
    onReject,
}: LandingContactRequestsTableProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-hidden">
                <table className="w-full table-fixed border-collapse text-[13px]">
                    <colgroup>
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '13%' }} />
                        <col style={{ width: '13%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Ad Soyad</th>
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">E-posta</th>
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Telefon</th>
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Firma</th>
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Konu</th>
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Tarih</th>
                            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Islem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                                    Yukleniyor...
                                </td>
                            </tr>
                        )}

                        {isError && (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-red-600">
                                    Onay bekleyen kayitlar yuklenemedi.
                                </td>
                            </tr>
                        )}

                        {!isLoading && !isError && data.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                                    Bekleyen yeni musteri talebi yok.
                                </td>
                            </tr>
                        )}

                        {data.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100 align-top">
                                <td className="px-3 py-3 text-gray-800">{item.fullName || '-'}</td>
                                <td className="px-3 py-3 text-gray-700">{item.email || '-'}</td>
                                <td className="px-3 py-3 text-gray-700">{item.phone || '-'}</td>
                                <td className="px-3 py-3 text-gray-700">{item.company || '-'}</td>
                                <td className="px-3 py-3">
                                    <p className="font-medium text-gray-800">{item.subject || '-'}</p>
                                    <p className="mt-1 line-clamp-3 text-xs text-gray-500">{item.message || '-'}</p>
                                </td>
                                <td className="px-3 py-3 text-gray-700">{formatDateLabel(item.createdAt)}</td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onApprove(item)}
                                            disabled={isPendingAction}
                                            className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                                        >
                                            <Check size={13} />
                                            Onayla
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onReject(item)}
                                            disabled={isPendingAction}
                                            className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                                        >
                                            <X size={13} />
                                            Reddet
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
