export interface RoleAccentPalette {
    accent50: string;
    accent100: string;
    accent200: string;
    accent300: string;
    accent400: string;
    accent500: string;
    accent600: string;
    accent700: string;
    accent800: string;
    gradientFrom: string;
    gradientMid: string;
    gradientTo: string;
    accentSoft: string;
    accentBorder: string;
    accentShadow: string;
    rgbChannels: string;
}

export function normalizeHexColor(color: string): string {
    const trimmed = color.trim();
    const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed);
    if (!match) return '#DC2626';

    const value = match[1];
    if (value.length === 3) {
        return `#${value.split('').map((char) => `${char}${char}`).join('')}`.toUpperCase();
    }
    return `#${value}`.toUpperCase();
}

export function shiftHexColor(color: string, amount: number): string {
    const hex = normalizeHexColor(color).slice(1);
    const [r, g, b] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
    const clamp = (value: number) => Math.max(0, Math.min(255, value));

    const nextR = clamp(r + amount);
    const nextG = clamp(g + amount);
    const nextB = clamp(b + amount);

    return `#${[nextR, nextG, nextB]
        .map((channel) => channel.toString(16).padStart(2, '0'))
        .join('')}`.toUpperCase();
}

export function hexToRgba(color: string, alpha: number): string {
    const hex = normalizeHexColor(color).slice(1);
    const [r, g, b] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
    const safeAlpha = Math.max(0, Math.min(1, alpha));
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

function getRgbChannels(color: string): string {
    const hex = normalizeHexColor(color).slice(1);
    const [r, g, b] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
    return `${r} ${g} ${b}`;
}

export function buildRoleAccentPalette(accentColor: string): RoleAccentPalette {
    const accent500 = normalizeHexColor(accentColor);
    const accent600 = shiftHexColor(accent500, -12);
    const accent700 = shiftHexColor(accent500, -28);
    const accent800 = shiftHexColor(accent500, -44);

    return {
        accent50: shiftHexColor(accent500, 112),
        accent100: shiftHexColor(accent500, 86),
        accent200: shiftHexColor(accent500, 58),
        accent300: shiftHexColor(accent500, 34),
        accent400: shiftHexColor(accent500, 16),
        accent500,
        accent600,
        accent700,
        accent800,
        gradientFrom: shiftHexColor(accent500, 58),
        gradientMid: shiftHexColor(accent500, 10),
        gradientTo: shiftHexColor(accent500, -68),
        accentSoft: hexToRgba(accent500, 0.12),
        accentBorder: hexToRgba(accent700, 0.5),
        accentShadow: hexToRgba(accent500, 0.42),
        rgbChannels: getRgbChannels(accent500),
    };
}
