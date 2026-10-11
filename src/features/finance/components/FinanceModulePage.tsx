import { useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { exportTable, type ExportFormat } from '../utils/tableExport';

interface FinanceModulePageProps {
    title: string;
    subtitle: string;
}

export function FinanceModulePage({ title, subtitle }: FinanceModulePageProps) {
    const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');

    async function handleExport() {
        try {
            await exportTable({
                format: exportFormat,
                fileBaseName: 'finans-modul-ozet',
                title: 'Finans Modul Ozet Raporu',
                columns: [
                    { key: 'page', label: 'Sayfa' },
                    { key: 'subtitle', label: 'Alt Baslik' },
                    { key: 'status', label: 'Durum' },
                ],
                rows: [{
                    page: title,
                    subtitle,
                    status: 'Planlama',
                }],
            });
            toast.success(`Rapor ${exportFormat.toUpperCase()} formatinda indirildi.`);
        } catch {
            toast.error('Rapor disa aktarilamadi.');
        }
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<BarChart3 size={20} color="#059669" />}
                title={title}
                subtitle={subtitle}
            />
            <section className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-end gap-2">
                    <select
                        value={exportFormat}
                        onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value="csv">CSV</option>
                        <option value="xlsx">EXCEL</option>
                        <option value="pdf">PDF</option>
                        <option value="docx">WORD</option>
                    </select>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                        <Download size={14} />
                        {exportFormat.toUpperCase()} Indir
                    </button>
                </div>
                <p className="text-sm text-gray-700">
                    Bu modul sidebar ve rota yapisina eklendi. Sonraki adimda bu ekranin
                    is kurallarina gore detayli icerigi tamamlanacak.
                </p>
            </section>
        </div>
    );
}
