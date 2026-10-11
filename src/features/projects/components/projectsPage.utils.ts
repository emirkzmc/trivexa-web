import { STATUS_META } from './projectsPage.constants';
import type { DepartmentFormType } from './projectsPage.types';

export function toMeta(status: string) {
    return STATUS_META[status?.toUpperCase()] ?? {
        label: status || 'Bilinmiyor',
        badgeClass: 'bg-gray-100 text-gray-700',
        progress: 12,
    };
}

export function formatMoney(value?: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-';
    }

    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(value);
}

function normalizeText(value: string) {
    return value
        .toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/\s+/g, ' ')
        .trim();
}

export function resolveDepartmentFormType(departmentName: string): DepartmentFormType {
    const normalized = normalizeText(departmentName);

    if (normalized.includes('yazilim') || normalized.includes('software')) {
        return 'SOFTWARE';
    }
    if (normalized.includes('pazarlama') || normalized.includes('marketing')) {
        return 'MARKETING';
    }
    if (normalized.includes('produksiyon') || normalized.includes('production')) {
        return 'PRODUCTION';
    }
    if (normalized.includes('tasarim') || normalized.includes('design')) {
        return 'DESIGN';
    }
    return 'GENERAL';
}

export function isSameDepartment(personDepartment: string, selectedDepartment: string) {
    const person = normalizeText(personDepartment);
    const selected = normalizeText(selectedDepartment);
    return person === selected || person.includes(selected) || selected.includes(person);
}

export function splitTags(value: string) {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
