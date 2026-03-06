import { ArrowDown, ArrowUp } from 'lucide-react';

interface SortIconProps {
    field: string;
    currentSortField: string;
    currentSortDirection: 'asc' | 'desc';
}

export function SortIcon({ field, currentSortField, currentSortDirection }: SortIconProps) {
    if (currentSortField !== field) {
        return <ArrowUp size={12} className="text-gray-300 opacity-0 group-hover:opacity-50"/>;
    }
    return currentSortDirection === 'asc'
        ? <ArrowUp size={12} className="text-red-500"/>
        : <ArrowDown size={12} className="text-red-500"/>;
}
