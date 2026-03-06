import { useMemo, useState } from 'react';
import {
    ArrowLeft,
    CalendarClock,
    CheckCircle2,
    FolderKanban,
    GaugeCircle,
    Layers3,
    Save,
    ShieldCheck,
    Sparkles,
    Tag,
    Users,
    Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';

type Visibility = 'INTERNAL' | 'CLIENT_SHARED' | 'PRIVATE';

const PROJECT_TYPE_OPTIONS = [
    'Web Development',
    'Branding',
    'Social Media',
    'Performance Marketing',
    'Video Production',
    'Custom',
];

const STATUS_OPTIONS = ['PLANNING', 'DRAFT', 'IN_PROGRESS', 'ON_HOLD'];

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const VISIBILITY_OPTIONS: Array<{ value: Visibility; label: string }> = [
    { value: 'INTERNAL', label: 'Internal' },
    { value: 'CLIENT_SHARED', label: 'Client Shared' },
    { value: 'PRIVATE', label: 'Private' },
];

interface ProjectCreateFormState {
    name: string;
    description: string;
    projectType: string;
    clientName: string;
    clientContact: string;
    status: string;
    priority: string;
    startDate: string;
    deadline: string;
    budget: string;
    visibility: Visibility;
    teamSize: string;
    repositoryUrl: string;
    tags: string;
}

const INITIAL_FORM: ProjectCreateFormState = {
    name: '',
    description: '',
    projectType: PROJECT_TYPE_OPTIONS[0],
    clientName: '',
    clientContact: '',
    status: STATUS_OPTIONS[0],
    priority: PRIORITY_OPTIONS[1],
    startDate: '',
    deadline: '',
    budget: '',
    visibility: 'INTERNAL',
    teamSize: '',
    repositoryUrl: '',
    tags: '',
};

function formatCurrency(value: string) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return '-';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function ProjectCreatePage() {
    const navigate = useNavigate();
    const [form, setForm] = useState<ProjectCreateFormState>(INITIAL_FORM);

    const completionScore = useMemo(() => {
        const fields = [
            form.name,
            form.description,
            form.clientName,
            form.startDate,
            form.deadline,
            form.budget,
            form.teamSize,
        ];
        const filledCount = fields.filter((value) => value.trim().length > 0).length;
        return Math.round((filledCount / fields.length) * 100);
    }, [form]);

    const tags = useMemo(
        () =>
            form.tags
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
                .slice(0, 8),
        [form.tags],
    );

    const summaryRows = [
        { label: 'Project Name', value: form.name || '-' },
        { label: 'Project Type', value: form.projectType || '-' },
        { label: 'Client', value: form.clientName || '-' },
        { label: 'Timeline', value: form.startDate && form.deadline ? `${form.startDate} -> ${form.deadline}` : '-' },
        { label: 'Budget', value: formatCurrency(form.budget) },
        { label: 'Visibility', value: form.visibility },
        { label: 'Team Size', value: form.teamSize || '-' },
    ];

    function updateField<K extends keyof ProjectCreateFormState>(key: K, value: ProjectCreateFormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function handleSaveDraft() {
        toast.info('Taslak proje ekrani hazirlandi. Kaydetme entegrasyonu bir sonraki adimda acilacak.');
    }

    function handleSubmit() {
        if (!form.name.trim()) {
            toast.error('Proje adi zorunludur.');
            return;
        }

        if (!form.clientName.trim()) {
            toast.error('Musteri alani zorunludur.');
            return;
        }

        toast.success('Proje olusturma tasarimi hazir. API baglantisini istersen bir sonraki adimda ekleyebilirim.');
    }

    return (
        <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
            <PageHeader
                icon={<FolderKanban size={20} color="#DC2626" />}
                title="Yeni Proje Tasarimi"
                subtitle="Proje olusturma akisinin form yapisi ve planlama paneli"
                actions={(
                    <button
                        type="button"
                        onClick={() => navigate('/app/projeler')}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        <ArrowLeft size={14} />
                        Projelere Don
                    </button>
                )}
            />

            <section className="mb-4 overflow-hidden rounded-xl border border-red-200 bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 p-4 text-white shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                    <div>
                        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                            <Sparkles size={12} />
                            Creative Project Intake
                        </p>
                        <h2 className="text-xl font-bold tracking-tight">Akilli Proje Baslatma Paneli</h2>
                        <p className="mt-1 max-w-[60ch] text-sm text-white/90">
                            Proje kapsamini, zaman planini, ekip yapisini ve teslim beklentilerini tek ekranda netlestir.
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/30 bg-black/10 p-3">
                        <p className="text-xs uppercase tracking-wide text-white/80">Hazirlik Seviyesi</p>
                        <p className="mt-1 text-3xl font-bold">{completionScore}%</p>
                        <div className="mt-2 h-2 rounded-full bg-white/25">
                            <div className="h-2 rounded-full bg-white" style={{ width: `${completionScore}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-white/85">Tum kritik alanlar dolunca proje olusturmaya hazir.</p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
                <div className="space-y-4">
                    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Layers3 size={15} />
                            Temel Bilgiler
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Proje Adi</label>
                                <input
                                    value={form.name}
                                    onChange={(event) => updateField('name', event.target.value)}
                                    placeholder="Orn: Trivexa Marketing Website Revamp"
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Proje Tipi</label>
                                <select
                                    value={form.projectType}
                                    onChange={(event) => updateField('projectType', event.target.value)}
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                >
                                    {PROJECT_TYPE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Durum</label>
                                <select
                                    value={form.status}
                                    onChange={(event) => updateField('status', event.target.value)}
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Musteri</label>
                                <input
                                    value={form.clientName}
                                    onChange={(event) => updateField('clientName', event.target.value)}
                                    placeholder="Orn: ACME Corp"
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Musteri Yetkilisi</label>
                                <input
                                    value={form.clientContact}
                                    onChange={(event) => updateField('clientContact', event.target.value)}
                                    placeholder="Orn: Zeynep Kaya"
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Proje Aciklamasi</label>
                                <textarea
                                    value={form.description}
                                    onChange={(event) => updateField('description', event.target.value)}
                                    placeholder="Kapsam, hedefler, teslim beklentisi ve kritik notlar..."
                                    className="min-h-[110px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                        </div>
                    </article>

                    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <CalendarClock size={15} />
                            Takvim, Butce ve Ekip
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Baslangic Tarihi</label>
                                <input
                                    type="date"
                                    value={form.startDate}
                                    onChange={(event) => updateField('startDate', event.target.value)}
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Teslim Tarihi</label>
                                <input
                                    type="date"
                                    value={form.deadline}
                                    onChange={(event) => updateField('deadline', event.target.value)}
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Butce (TRY)</label>
                                <div className="relative">
                                    <Wallet size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={form.budget}
                                        onChange={(event) => updateField('budget', event.target.value.replace(/[^\d]/g, ''))}
                                        placeholder="250000"
                                        className="h-10 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Oncelik</label>
                                <select
                                    value={form.priority}
                                    onChange={(event) => updateField('priority', event.target.value)}
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                >
                                    {PRIORITY_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Gorunurluk</label>
                                <select
                                    value={form.visibility}
                                    onChange={(event) => updateField('visibility', event.target.value as Visibility)}
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                >
                                    {VISIBILITY_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Tahmini Ekip Sayisi</label>
                                <div className="relative">
                                    <Users size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={form.teamSize}
                                        onChange={(event) => updateField('teamSize', event.target.value.replace(/[^\d]/g, ''))}
                                        placeholder="6"
                                        className="h-10 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Repository URL (Opsiyonel)</label>
                                <input
                                    value={form.repositoryUrl}
                                    onChange={(event) => updateField('repositoryUrl', event.target.value)}
                                    placeholder="https://github.com/org/repo"
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Etiketler</label>
                                <input
                                    value={form.tags}
                                    onChange={(event) => updateField('tags', event.target.value)}
                                    placeholder="ui, seo, launch, sprint-1"
                                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                        </div>
                    </article>
                </div>

                <aside className="space-y-4">
                    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <GaugeCircle size={15} />
                            Canli Ozet
                        </h3>
                        <div className="space-y-2">
                            {summaryRows.map((row) => (
                                <div key={row.label} className="flex items-start justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-xs font-medium text-gray-500">{row.label}</p>
                                    <p className="max-w-[60%] text-right text-xs font-semibold text-gray-900 break-words">{row.value}</p>
                                </div>
                            ))}
                        </div>
                        {tags.length > 0 && (
                            <div className="mt-3">
                                <p className="mb-1 text-xs font-semibold text-gray-600">Tag Preview</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700"
                                        >
                                            <Tag size={10} />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </article>

                    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <ShieldCheck size={15} />
                            On Kontrol Listesi
                        </h3>
                        <div className="space-y-2 text-xs">
                            <p className={`inline-flex w-full items-center gap-2 rounded-lg px-2.5 py-2 ${form.name ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                <CheckCircle2 size={13} />
                                Proje adi tanimlandi
                            </p>
                            <p className={`inline-flex w-full items-center gap-2 rounded-lg px-2.5 py-2 ${form.clientName ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                <CheckCircle2 size={13} />
                                Musteri bilgisi girildi
                            </p>
                            <p className={`inline-flex w-full items-center gap-2 rounded-lg px-2.5 py-2 ${form.startDate && form.deadline ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                <CheckCircle2 size={13} />
                                Takvim netlesti
                            </p>
                            <p className={`inline-flex w-full items-center gap-2 rounded-lg px-2.5 py-2 ${form.budget ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                <CheckCircle2 size={13} />
                                Butce belirlendi
                            </p>
                        </div>
                    </article>

                    <article className="rounded-xl border border-dashed border-gray-300 bg-white p-4">
                        <p className="text-xs text-gray-600">
                            Bu ekran su an tasarim odakli. Kaydetme ve backend entegrasyonunu bir sonraki adimda aktif edebiliriz.
                        </p>
                    </article>
                </aside>
            </section>

            <section className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    <Save size={14} />
                    Taslak Kaydet
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                    <FolderKanban size={14} />
                    Proje Olustur
                </button>
            </section>
        </div>
    );
}
