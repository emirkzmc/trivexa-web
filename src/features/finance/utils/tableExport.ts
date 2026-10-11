export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'docx';

export interface ExportColumn {
    key: string;
    label: string;
}

interface ExportTableOptions {
    format: ExportFormat;
    fileBaseName: string;
    title: string;
    columns: ExportColumn[];
    rows: Array<Record<string, string | number | null | undefined>>;
    sheetName?: string;
}

function asText(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return String(value);
}

function toMatrix(
    columns: ExportColumn[],
    rows: Array<Record<string, string | number | null | undefined>>,
): string[][] {
    return rows.map((row) => columns.map((column) => asText(row[column.key])));
}

function getFileName(fileBaseName: string, extension: string) {
    const datePart = new Date().toISOString().slice(0, 10);
    return `${fileBaseName}-${datePart}.${extension}`;
}

function escapeCsv(value: string) {
    return `"${value.replaceAll('"', '""')}"`;
}

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

async function exportCsv(options: ExportTableOptions) {
    const headers = options.columns.map((column) => column.label);
    const body = toMatrix(options.columns, options.rows);
    const csvContent = [headers, ...body]
        .map((row) => row.map((value) => escapeCsv(value)).join(','))
        .join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, getFileName(options.fileBaseName, 'csv'));
}

async function exportXlsx(options: ExportTableOptions) {
    const XLSX = await import('xlsx');
    const sheetRows = options.rows.map((row) => Object.fromEntries(
        options.columns.map((column) => [column.label, asText(row[column.key])]),
    ));
    const worksheet = XLSX.utils.json_to_sheet(sheetRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Rapor');
    XLSX.writeFile(workbook, getFileName(options.fileBaseName, 'xlsx'));
}

async function exportPdf(options: ExportTableOptions) {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
    ]);
    const autoTable = autoTableModule.default;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });
    doc.setFontSize(13);
    doc.text(options.title, 40, 34);
    autoTable(doc, {
        startY: 48,
        head: [options.columns.map((column) => column.label)],
        body: toMatrix(options.columns, options.rows),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [17, 24, 39] },
    });
    doc.save(getFileName(options.fileBaseName, 'pdf'));
}

async function exportDocx(options: ExportTableOptions) {
    const docx = await import('docx');
    const headerCells = options.columns.map((column) => new docx.TableCell({
        children: [new docx.Paragraph({ text: column.label })],
    }));
    const dataRows = toMatrix(options.columns, options.rows).map((row) => new docx.TableRow({
        children: row.map((cell) => new docx.TableCell({
            children: [new docx.Paragraph({ text: cell })],
        })),
    }));
    const table = new docx.Table({
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        rows: [
            new docx.TableRow({ children: headerCells }),
            ...dataRows,
        ],
    });
    const document = new docx.Document({
        sections: [{
            children: [
                new docx.Paragraph({
                    text: options.title,
                    heading: docx.HeadingLevel.HEADING_1,
                }),
                table,
            ],
        }],
    });
    const blob = await docx.Packer.toBlob(document);
    downloadBlob(blob, getFileName(options.fileBaseName, 'docx'));
}

export async function exportTable(options: ExportTableOptions) {
    if (options.format === 'csv') {
        await exportCsv(options);
        return;
    }
    if (options.format === 'xlsx') {
        await exportXlsx(options);
        return;
    }
    if (options.format === 'pdf') {
        await exportPdf(options);
        return;
    }
    await exportDocx(options);
}
