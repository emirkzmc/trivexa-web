import { BarChart3 } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';

interface FinanceModulePageProps {
    title: string;
    subtitle: string;
}

export function FinanceModulePage({ title, subtitle }: FinanceModulePageProps) {
    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<BarChart3 size={20} color="#059669" />}
                title={title}
                subtitle={subtitle}
            />
            <section className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-700">
                    Bu modul sidebar ve rota yapisina eklendi. Sonraki adimda bu ekranin
                    is kurallarina göre detayli icerigi tamamlanacak.
                </p>
            </section>
        </div>
    );
}

