
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Settings, UploadCloud, XCircle, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../shared/components/PageHeader';
import { useAuthStore } from '../../auth/store/authStore';
import { normalizeRoleKey } from '../../../shared/utils/roleUtils';
import {
  DEFAULT_LANDING_CONTENT,
  getLandingContent,
  updateLandingContent,
  type LandingContent,
} from '../api/landingContent.api';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const normalizedRole = normalizeRoleKey(role);
  const canEditLanding = normalizedRole === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'landing' | 'info'>('landing');
  const [infoTab, setInfoTab] = useState<'panel' | 'notifications' | 'integrations' | 'security'>('panel');
  const [panelSettings, setPanelSettings] = useState({
    companyName: 'Trivexa',
    timezone: 'Europe/Istanbul',
    language: 'tr',
    dateFormat: 'DD.MM.YYYY',
    currency: 'TRY',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    push: true,
    weeklySummary: true,
  });
  const [integrationSettings, setIntegrationSettings] = useState({
    slackEnabled: false,
    googleCalendarEnabled: false,
    githubEnabled: true,
  });
  const [securitySettings, setSecuritySettings] = useState({
    requireTwoFactor: false,
    sessionTimeout: '60',
    passwordRotationDays: '90',
  });

  const landingQuery = useQuery<LandingContent>({
    queryKey: ['landing-content'],
    queryFn: getLandingContent,
  });

  const [form, setForm] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);

  useEffect(() => {
    if (landingQuery.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(landingQuery.data);
    }
  }, [landingQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () => updateLandingContent(form),
    onSuccess: (data) => {
      queryClient.setQueryData(['landing-content'], data);
      toast.success('Landing icerigi guncellendi.');
    },
    onError: () => {
      toast.error('Landing icerigi guncellenemedi.');
    },
  });

  const handleSaveGeneralSettings = () => {
    toast.success('Genel ayarlar kaydedildi (demo).');
  };

  const lastUpdated = useMemo(() => {
    const value = landingQuery.data?.meta?.updatedAt;
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('tr-TR');
  }, [landingQuery.data?.meta?.updatedAt]);

  const handleHeroChange = (field: keyof LandingContent['hero'], value: string) => {
    setForm((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }));
  };

  const handleIntroChange = (field: keyof LandingContent['intro'], value: string) => {
    setForm((prev) => ({
      ...prev,
      intro: { ...prev.intro, [field]: value },
    }));
  };

  const handleIntroParagraphChange = (index: number, value: string) => {
    setForm((prev) => {
      const paragraphs = prev.intro.paragraphs.map((item, idx) => (idx === index ? value : item));
      return {
        ...prev,
        intro: { ...prev.intro, paragraphs },
      };
    });
  };

  const handleAddIntroParagraph = () => {
    setForm((prev) => ({
      ...prev,
      intro: {
        ...prev.intro,
        paragraphs: [...prev.intro.paragraphs, ''],
      },
    }));
  };

  const handleRemoveIntroParagraph = (index: number) => {
    setForm((prev) => ({
      ...prev,
      intro: {
        ...prev.intro,
        paragraphs: prev.intro.paragraphs.filter((_, idx) => idx !== index),
      },
    }));
  };

  const handleIntroTickerChange = (index: number, value: string) => {
    setForm((prev) => {
      const tickerTexts = prev.intro.tickerTexts.map((item, idx) => (idx === index ? value : item));
      return {
        ...prev,
        intro: { ...prev.intro, tickerTexts },
      };
    });
  };

  const handleAddIntroTicker = () => {
    setForm((prev) => ({
      ...prev,
      intro: {
        ...prev.intro,
        tickerTexts: [...prev.intro.tickerTexts, ''],
      },
    }));
  };

  const handleRemoveIntroTicker = (index: number) => {
    setForm((prev) => ({
      ...prev,
      intro: {
        ...prev.intro,
        tickerTexts: prev.intro.tickerTexts.filter((_, idx) => idx !== index),
      },
    }));
  };

  const handleServicesChange = (field: keyof LandingContent['services'], value: string) => {
    setForm((prev) => ({
      ...prev,
      services: { ...prev.services, [field]: value },
    }));
  };

  const handleServiceItemChange = (
    index: number,
    field: keyof LandingContent['services']['items'][number],
    value: string,
  ) => {
    setForm((prev) => {
      const items = prev.services.items.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      );
      return {
        ...prev,
        services: { ...prev.services, items },
      };
    });
  };

  const handleAddService = () => {
    setForm((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        items: [...prev.services.items, { title: '', description: '' }],
      },
    }));
  };

  const handleRemoveService = (index: number) => {
    setForm((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        items: prev.services.items.filter((_, idx) => idx !== index),
      },
    }));
  };

  const handleProcessChange = (field: keyof LandingContent['process'], value: string) => {
    setForm((prev) => ({
      ...prev,
      process: { ...prev.process, [field]: value },
    }));
  };

  const handleProcessStepChange = (
    index: number,
    field: keyof LandingContent['process']['steps'][number],
    value: string,
  ) => {
    setForm((prev) => {
      const steps = prev.process.steps.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      );
      return {
        ...prev,
        process: { ...prev.process, steps },
      };
    });
  };

  const handleAddProcessStep = () => {
    setForm((prev) => ({
      ...prev,
      process: {
        ...prev.process,
        steps: [...prev.process.steps, { title: '', description: '' }],
      },
    }));
  };

  const handleRemoveProcessStep = (index: number) => {
    setForm((prev) => ({
      ...prev,
      process: {
        ...prev.process,
        steps: prev.process.steps.filter((_, idx) => idx !== index),
      },
    }));
  };

  const handleImpactChange = (field: keyof LandingContent['impact'], value: string) => {
    setForm((prev) => ({
      ...prev,
      impact: { ...prev.impact, [field]: value },
    }));
  };

  const handleImpactStatChange = (
    index: number,
    field: keyof LandingContent['impact']['stats'][number],
    value: string,
  ) => {
    setForm((prev) => {
      const stats = prev.impact.stats.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      );
      return {
        ...prev,
        impact: { ...prev.impact, stats },
      };
    });
  };

  const handleAddImpactStat = () => {
    setForm((prev) => ({
      ...prev,
      impact: {
        ...prev.impact,
        stats: [...prev.impact.stats, { value: '', label: '' }],
      },
    }));
  };

  const handleRemoveImpactStat = (index: number) => {
    setForm((prev) => ({
      ...prev,
      impact: {
        ...prev.impact,
        stats: prev.impact.stats.filter((_, idx) => idx !== index),
      },
    }));
  };

  const handleContactChange = (field: keyof LandingContent['contact'], value: string) => {
    setForm((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  };

  const handlePrivacyPolicyChange = (field: keyof LandingContent['privacyPolicy'], value: string) => {
    setForm((prev) => ({
      ...prev,
      privacyPolicy: { ...prev.privacyPolicy, [field]: value },
    }));
  };

  const handleUserPolicyChange = (field: keyof LandingContent['userPolicy'], value: string) => {
    setForm((prev) => ({
      ...prev,
      userPolicy: { ...prev.userPolicy, [field]: value },
    }));
  };

  const isSaving = updateMutation.isPending;
  const isDisabled = !canEditLanding || isSaving;

  return (
    <div className="px-8 py-6 max-[900px]:px-4 max-[900px]:py-4">
      <PageHeader
        icon={<Settings size={20} color="#111827" />}
        title="Ayarlar"
        subtitle="Panel ayarlari ve landing icerik yonetimi"
        actions={(
          activeTab === 'landing' ? (
            <button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={isDisabled}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={14} />
              Kaydet
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveGeneralSettings}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Save size={14} />
              Kaydet
            </button>
          )
        )}
      />

      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2">
        <button
          type="button"
          onClick={() => setActiveTab('landing')}
          className={`px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'landing'
              ? 'rounded-lg bg-gray-900 text-white'
              : 'rounded-lg text-gray-600 hover:bg-gray-100'
          }`}
        >
          Landing Icerigi
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'info'
              ? 'rounded-lg bg-gray-900 text-white'
              : 'rounded-lg text-gray-600 hover:bg-gray-100'
          }`}
        >
          Genel Bilgi
        </button>
      </div>

      {activeTab === 'landing' && (
        <>
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Landing Proje Icerigi</h2>
                <p className="text-xs text-gray-500">
                  trivexa-landing icerikleri bu formdan guncellenir. Son guncelleme: {lastUpdated}
                </p>
              </div>
              {!canEditLanding && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  Sadece ADMIN rolu landing icerigini guncelleyebilir.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <article className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">Hero Bolumu</h3>
              <p className="mb-4 text-xs text-gray-500">Ana baslik, alt baslik ve arka plan gorseli.</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Baslik</label>
                  <input
                    value={form.hero.title}
                    onChange={(event) => handleHeroChange('title', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Alt Baslik</label>
                  <input
                    value={form.hero.subtitle}
                    onChange={(event) => handleHeroChange('subtitle', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">CTA Etiketi</label>
                  <input
                    value={form.hero.ctaLabel}
                    onChange={(event) => handleHeroChange('ctaLabel', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">CTA Link</label>
                  <input
                    value={form.hero.ctaLink}
                    onChange={(event) => handleHeroChange('ctaLink', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Arka Plan Gorsel URL</label>
                  <input
                    value={form.hero.backgroundImage}
                    onChange={(event) => handleHeroChange('backgroundImage', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Tanitim Bolumu</h3>
                  <p className="text-xs text-gray-500">Ajans tanitimi ve kaydirma metinleri.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddIntroParagraph}
                  disabled={isDisabled}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlusCircle size={14} />
                  Paragraf Ekle
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Etiket</label>
                  <input
                    value={form.intro.label}
                    onChange={(event) => handleIntroChange('label', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Baslik</label>
                  <input
                    value={form.intro.title}
                    onChange={(event) => handleIntroChange('title', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {form.intro.paragraphs.map((item, index) => (
                  <div key={`intro-paragraph-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-600">Paragraf {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveIntroParagraph(index)}
                        disabled={isDisabled || form.intro.paragraphs.length <= 1}
                        className="text-xs font-semibold text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                    <textarea
                      value={item}
                      onChange={(event) => handleIntroParagraphChange(index, event.target.value)}
                      disabled={isDisabled}
                      className="h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                      placeholder="Paragraf metni"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600">Scroll Metinleri</p>
                  <button
                    type="button"
                    onClick={handleAddIntroTicker}
                    disabled={isDisabled}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PlusCircle size={14} />
                    Metin Ekle
                  </button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {form.intro.tickerTexts.map((item, index) => (
                    <div key={`intro-ticker-${index}`} className="flex items-center gap-2">
                      <input
                        value={item}
                        onChange={(event) => handleIntroTickerChange(index, event.target.value)}
                        disabled={isDisabled}
                        className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveIntroTicker(index)}
                        disabled={isDisabled || form.intro.tickerTexts.length <= 1}
                        className="text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Hizmetler</h3>
                  <p className="text-xs text-gray-500">Landing sayfasi hizmet kartlari.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddService}
                  disabled={isDisabled}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlusCircle size={14} />
                  Ekle
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Bolum Etiketi</label>
                  <input
                    value={form.services.label}
                    onChange={(event) => handleServicesChange('label', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Bolum Basligi</label>
                  <input
                    value={form.services.title}
                    onChange={(event) => handleServicesChange('title', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {form.services.items.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-600">Kart {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(index)}
                        disabled={isDisabled || form.services.items.length <= 1}
                        className="text-xs font-semibold text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                    <input
                      value={item.title}
                      onChange={(event) => handleServiceItemChange(index, 'title', event.target.value)}
                      disabled={isDisabled}
                      className="mb-2 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                      placeholder="Baslik"
                    />
                    <textarea
                      value={item.description}
                      onChange={(event) => handleServiceItemChange(index, 'description', event.target.value)}
                      disabled={isDisabled}
                      className="h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                      placeholder="Aciklama"
                    />
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Surec</h3>
                  <p className="text-xs text-gray-500">Calisma adimlari ve surec kartlari.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddProcessStep}
                  disabled={isDisabled}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlusCircle size={14} />
                  Ekle
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Bolum Etiketi</label>
                  <input
                    value={form.process.label}
                    onChange={(event) => handleProcessChange('label', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Bolum Basligi</label>
                  <input
                    value={form.process.title}
                    onChange={(event) => handleProcessChange('title', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {form.process.steps.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-600">Adim {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveProcessStep(index)}
                        disabled={isDisabled || form.process.steps.length <= 1}
                        className="text-xs font-semibold text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                    <input
                      value={item.title}
                      onChange={(event) => handleProcessStepChange(index, 'title', event.target.value)}
                      disabled={isDisabled}
                      className="mb-2 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                      placeholder="Baslik"
                    />
                    <textarea
                      value={item.description}
                      onChange={(event) => handleProcessStepChange(index, 'description', event.target.value)}
                      disabled={isDisabled}
                      className="h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                      placeholder="Aciklama"
                    />
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Trivexa Etkisi</h3>
                  <p className="text-xs text-gray-500">Impact bolumu ve istatistikler.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddImpactStat}
                  disabled={isDisabled}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlusCircle size={14} />
                  Ekle
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Bolum Etiketi</label>
                  <input
                    value={form.impact.label}
                    onChange={(event) => handleImpactChange('label', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Bolum Basligi</label>
                  <input
                    value={form.impact.title}
                    onChange={(event) => handleImpactChange('title', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">CTA Etiketi</label>
                  <input
                    value={form.impact.ctaLabel}
                    onChange={(event) => handleImpactChange('ctaLabel', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">CTA Link</label>
                  <input
                    value={form.impact.ctaLink}
                    onChange={(event) => handleImpactChange('ctaLink', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Arka Plan Renk</label>
                  <input
                    value={form.impact.backgroundColor}
                    onChange={(event) => handleImpactChange('backgroundColor', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {form.impact.stats.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-600">Istatistik {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveImpactStat(index)}
                        disabled={isDisabled || form.impact.stats.length <= 1}
                        className="text-xs font-semibold text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                    <input
                      value={item.value}
                      onChange={(event) => handleImpactStatChange(index, 'value', event.target.value)}
                      disabled={isDisabled}
                      className="mb-2 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                      placeholder="Deger"
                    />
                    <input
                      value={item.label}
                      onChange={(event) => handleImpactStatChange(index, 'label', event.target.value)}
                      disabled={isDisabled}
                      className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                      placeholder="Aciklama"
                    />
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">Iletisim Bolumu</h3>
              <p className="mb-4 text-xs text-gray-500">Contact sayfasi basliklari ve gorsel.</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Etiket</label>
                  <input
                    value={form.contact.label}
                    onChange={(event) => handleContactChange('label', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Baslik</label>
                  <input
                    value={form.contact.title}
                    onChange={(event) => handleContactChange('title', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Aciklama</label>
                  <textarea
                    value={form.contact.description}
                    onChange={(event) => handleContactChange('description', event.target.value)}
                    disabled={isDisabled}
                    className="h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Gorsel URL</label>
                  <input
                    value={form.contact.image}
                    onChange={(event) => handleContactChange('image', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">Gizlilik Politikası</h3>
              <p className="mb-4 text-xs text-gray-500">Landing sayfasındaki Gizlilik Politikası içeriği.</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Baslik</label>
                  <input
                    value={form.privacyPolicy?.title || ''}
                    onChange={(event) => handlePrivacyPolicyChange('title', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Link Etiketi</label>
                  <input
                    value={form.privacyPolicy?.label || ''}
                    onChange={(event) => handlePrivacyPolicyChange('label', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">İçerik</label>
                  <textarea
                    value={form.privacyPolicy?.content || ''}
                    onChange={(event) => handlePrivacyPolicyChange('content', event.target.value)}
                    disabled={isDisabled}
                    className="h-48 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">Kullanıcı Politikası</h3>
              <p className="mb-4 text-xs text-gray-500">Landing sayfasındaki Kullanıcı Politikası içeriği.</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Baslik</label>
                  <input
                    value={form.userPolicy?.title || ''}
                    onChange={(event) => handleUserPolicyChange('title', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Link Etiketi</label>
                  <input
                    value={form.userPolicy?.label || ''}
                    onChange={(event) => handleUserPolicyChange('label', event.target.value)}
                    disabled={isDisabled}
                    className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">İçerik</label>
                  <textarea
                    value={form.userPolicy?.content || ''}
                    onChange={(event) => handleUserPolicyChange('content', event.target.value)}
                    disabled={isDisabled}
                    className="h-48 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">Landing Yayinlama Notu</h3>
              <p className="text-xs text-gray-500">
                Bu panelde yapilan degisiklikler landing API uzerinden yayina alinir. trivexa-landing uygulamasi bu API'yi
                okuyarak icerigi gunceller.
              </p>
              <div className="mt-4 flex flex-col gap-2 text-xs text-gray-500">
                <div className="inline-flex items-center gap-2">
                  <UploadCloud size={14} />
                  Degisiklikleri kaydettikten sonra landing sayfayi yenileyin.
                </div>
              </div>
            </article>
          </section>
        </>
      )}

      {activeTab === 'info' && (
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            <button
              type="button"
              onClick={() => setInfoTab('panel')}
              className={`px-3 py-1.5 text-xs font-semibold transition ${
                infoTab === 'panel'
                  ? 'rounded-md bg-gray-900 text-white'
                  : 'rounded-md text-gray-600 hover:bg-gray-100'
              }`}
            >
              Panel
            </button>
            <button
              type="button"
              onClick={() => setInfoTab('notifications')}
              className={`px-3 py-1.5 text-xs font-semibold transition ${
                infoTab === 'notifications'
                  ? 'rounded-md bg-gray-900 text-white'
                  : 'rounded-md text-gray-600 hover:bg-gray-100'
              }`}
            >
              Bildirimler
            </button>
            <button
              type="button"
              onClick={() => setInfoTab('integrations')}
              className={`px-3 py-1.5 text-xs font-semibold transition ${
                infoTab === 'integrations'
                  ? 'rounded-md bg-gray-900 text-white'
                  : 'rounded-md text-gray-600 hover:bg-gray-100'
              }`}
            >
              Entegrasyonlar
            </button>
            <button
              type="button"
              onClick={() => setInfoTab('security')}
              className={`px-3 py-1.5 text-xs font-semibold transition ${
                infoTab === 'security'
                  ? 'rounded-md bg-gray-900 text-white'
                  : 'rounded-md text-gray-600 hover:bg-gray-100'
              }`}
            >
              Guvenlik
            </button>
          </div>

          {infoTab === 'panel' && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Firma Adi</label>
                <input
                  value={panelSettings.companyName}
                  onChange={(event) => setPanelSettings((prev) => ({ ...prev, companyName: event.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Saat Dilimi</label>
                <input
                  value={panelSettings.timezone}
                  onChange={(event) => setPanelSettings((prev) => ({ ...prev, timezone: event.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Dil</label>
                <select
                  value={panelSettings.language}
                  onChange={(event) => setPanelSettings((prev) => ({ ...prev, language: event.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                >
                  <option value="tr">Turkce</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Tarih Formati</label>
                <input
                  value={panelSettings.dateFormat}
                  onChange={(event) => setPanelSettings((prev) => ({ ...prev, dateFormat: event.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Para Birimi</label>
                <input
                  value={panelSettings.currency}
                  onChange={(event) => setPanelSettings((prev) => ({ ...prev, currency: event.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                />
              </div>
            </div>
          )}

          {infoTab === 'notifications' && (
            <div className="mt-4 grid gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={notificationSettings.email}
                  onChange={(event) => setNotificationSettings((prev) => ({ ...prev, email: event.target.checked }))}
                />
                Email bildirimleri
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={notificationSettings.sms}
                  onChange={(event) => setNotificationSettings((prev) => ({ ...prev, sms: event.target.checked }))}
                />
                SMS bildirimleri
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={notificationSettings.push}
                  onChange={(event) => setNotificationSettings((prev) => ({ ...prev, push: event.target.checked }))}
                />
                Push bildirimleri
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={notificationSettings.weeklySummary}
                  onChange={(event) => setNotificationSettings((prev) => ({ ...prev, weeklySummary: event.target.checked }))}
                />
                Haftalik ozet raporu
              </label>
            </div>
          )}

          {infoTab === 'integrations' && (
            <div className="mt-4 grid gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={integrationSettings.slackEnabled}
                  onChange={(event) => setIntegrationSettings((prev) => ({ ...prev, slackEnabled: event.target.checked }))}
                />
                Slack entegrasyonu
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={integrationSettings.googleCalendarEnabled}
                  onChange={(event) => setIntegrationSettings((prev) => ({ ...prev, googleCalendarEnabled: event.target.checked }))}
                />
                Google Calendar entegrasyonu
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={integrationSettings.githubEnabled}
                  onChange={(event) => setIntegrationSettings((prev) => ({ ...prev, githubEnabled: event.target.checked }))}
                />
                GitHub entegrasyonu
              </label>
              <p className="text-xs text-gray-500">
                Entegrasyon anahtarlarini saklamak icin backend ayarlari eklenecek.
              </p>
            </div>
          )}

          {infoTab === 'security' && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={securitySettings.requireTwoFactor}
                  onChange={(event) => setSecuritySettings((prev) => ({ ...prev, requireTwoFactor: event.target.checked }))}
                />
                Tum kullanicilar icin 2FA zorunlu
              </label>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Oturum Suresi (dk)</label>
                <input
                  value={securitySettings.sessionTimeout}
                  onChange={(event) => setSecuritySettings((prev) => ({ ...prev, sessionTimeout: event.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Sifre Yenileme (gun)</label>
                <input
                  value={securitySettings.passwordRotationDays}
                  onChange={(event) => setSecuritySettings((prev) => ({ ...prev, passwordRotationDays: event.target.value }))}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                />
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
