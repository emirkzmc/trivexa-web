import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    WidthType,
} from 'docx';
import { getPersonnel } from '../api/personnel.api';
import type { PersonnelItem, PersonnelListParams } from '../api/personnel.api';
import { formatDate } from '../../../shared/utils/formatDate';
import { ROLE_LABELS } from '../../../shared/constants/roleLabels';
import { DEPARTMENT_LABELS } from '../../../shared/constants/departments';

const EXPORT_PAGE_SIZE = 100;

export type PersonnelExportFormat = 'pdf' | 'docx' | 'xlsx' | 'csv';

interface ExportPayload {
    filters: PersonnelListParams;
    format: PersonnelExportFormat;
}

type ExportRow = {
    fullName: string;
    email: string;
    role: string;
    department: string;
    status: string;
    phone: string;
    createdAt: string;
};

function getExportRows(items: PersonnelItem[]): ExportRow[] {
    return items.map((item) => ({
        fullName: `${item.firstName} ${item.lastName}`.trim(),
        email: item.email,
        role: ROLE_LABELS[item.role] ?? item.role,
        department: DEPARTMENT_LABELS[item.department] ?? item.department ?? '-',
        status: item.isActive ? 'Aktif' : 'Pasif',
        phone: item.phone || '-',
        createdAt: formatDate(item.createdAt),
    }));
}

async function fetchAllPersonnel(filters: PersonnelListParams): Promise<PersonnelItem[]> {
    const { page: _page, limit: _limit, ...filterOnly } = filters;
    const all: PersonnelItem[] = [];
    let page = 1;
    let totalPages = 1;

    do {
        const response = await getPersonnel({
            ...filterOnly,
            page,
            limit: EXPORT_PAGE_SIZE,
        });
        all.push(...response.data);
        totalPages = response.meta.totalPages || Math.max(1, Math.ceil((response.meta.total || 0) / EXPORT_PAGE_SIZE));
        page += 1;
    } while (page <= totalPages);

    return all;
}

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportAsCsv(rows: ExportRow[], fileName: string) {
    const headers = ['Ad Soyad', 'E-posta', 'Rol', 'Departman', 'Durum', 'Telefon', 'Olusturma Tarihi'];
    const body = rows.map((row) => [
        row.fullName,
        row.email,
        row.role,
        row.department,
        row.status,
        row.phone,
        row.createdAt,
    ]);

    const escaped = [headers, ...body]
        .map((cols) =>
            cols
                .map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`)
                .join(','),
        )
        .join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + escaped], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, fileName);
}

function exportAsExcel(rows: ExportRow[], fileName: string) {
    const sheetRows = rows.map((row) => ({
        'Ad Soyad': row.fullName,
        'E-posta': row.email,
        Rol: row.role,
        Departman: row.department,
        Durum: row.status,
        Telefon: row.phone,
        'Olusturma Tarihi': row.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Personeller');
    XLSX.writeFile(workbook, fileName);
}

function exportAsPdf(rows: ExportRow[], fileName: string) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });
    doc.setFontSize(14);
    doc.text('Personel Listesi', 40, 36);

    autoTable(doc, {
        startY: 52,
        head: [['Ad Soyad', 'E-posta', 'Rol', 'Departman', 'Durum', 'Telefon', 'Olusturma Tarihi']],
        body: rows.map((row) => [
            row.fullName,
            row.email,
            row.role,
            row.department,
            row.status,
            row.phone,
            row.createdAt,
        ]),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [220, 38, 38] },
    });

    doc.save(fileName);
}

async function exportAsDocx(rows: ExportRow[], fileName: string) {
    const header = new TableRow({
        children: ['Ad Soyad', 'E-posta', 'Rol', 'Departman', 'Durum', 'Telefon', 'Olusturma Tarihi'].map(
            (text) =>
                new TableCell({
                    children: [new Paragraph({ text })],
                }),
        ),
    });

    const dataRows = rows.map(
        (row) =>
            new TableRow({
                children: [
                    row.fullName,
                    row.email,
                    row.role,
                    row.department,
                    row.status,
                    row.phone,
                    row.createdAt,
                ].map(
                    (text) =>
                        new TableCell({
                            children: [new Paragraph({ text })],
                        }),
                ),
            }),
    );

    const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [header, ...dataRows],
    });

    const doc = new Document({
        sections: [
            {
                children: [
                    new Paragraph({
                        text: 'Personel Listesi',
                        heading: HeadingLevel.HEADING_1,
                    }),
                    table,
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, fileName);
}

async function runExport(format: PersonnelExportFormat, rows: ExportRow[], baseName: string) {
    if (format === 'csv') {
        exportAsCsv(rows, `${baseName}.csv`);
        return;
    }

    if (format === 'xlsx') {
        exportAsExcel(rows, `${baseName}.xlsx`);
        return;
    }

    if (format === 'pdf') {
        exportAsPdf(rows, `${baseName}.pdf`);
        return;
    }

    await exportAsDocx(rows, `${baseName}.docx`);
}

export function useExportPersonnel() {
    return useMutation({
        mutationFn: async ({ filters, format }: ExportPayload) => {
            const items = await fetchAllPersonnel(filters);
            const rows = getExportRows(items);
            const today = formatDate(new Date().toISOString(), 'file');
            const baseName = `personel-listesi-${today}`;
            await runExport(format, rows, baseName);
            return { count: rows.length, format };
        },
        onSuccess: ({ count, format }) => {
            toast.success(`${count} personel ${format.toUpperCase()} formatinda disa aktarildi`, {
                duration: 3_000,
            });
        },
        onError: () => {
            toast.error('Disa aktarma sirasinda bir hata olustu', { duration: 3_000 });
        },
    });
}
