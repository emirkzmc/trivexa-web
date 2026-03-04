const MONTHS_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

/**
 * ISO tarih string'ini okunabilir formata çevirir.
 *
 * @param mode
 *  - `'display'` (varsayılan): "15 Ocak 2026 14:30"
 *  - `'file'`:                 "2026-01-15"
 */
export function formatDate(
    isoString: string,
    mode: 'display' | 'file' = 'display',
): string {
    const date = new Date(isoString);

    if (mode === 'file') {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    const day = date.getDate();
    const month = MONTHS_TR[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year} ${hours}:${minutes}`;
}
