/**
 * Saniye cinsinden süreyi okunabilir formata çevirir.
 * @example formatDuration(3750) → "1s 2dk 30sn"
 */
export function formatDuration(totalSeconds: number): string {
    if (totalSeconds < 0) return '0sn';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}s`);
    if (minutes > 0) parts.push(`${minutes}dk`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}sn`);

    return parts.join(' ');
}
