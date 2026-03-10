import axios, { type AxiosRequestConfig } from 'axios';
import api from '../../../shared/lib/axios';

type MaybeWrapped<T> = { data?: T } | T;

export type LandingHeroContent = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  backgroundImage: string;
};

export type LandingIntroContent = {
  label: string;
  title: string;
  paragraphs: string[];
  tickerTexts: string[];
};

export type LandingServiceItem = {
  title: string;
  description: string;
};

export type LandingServicesContent = {
  label: string;
  title: string;
  items: LandingServiceItem[];
};

export type LandingProcessStep = {
  title: string;
  description: string;
};

export type LandingProcessContent = {
  label: string;
  title: string;
  steps: LandingProcessStep[];
};

export type LandingStat = {
  value: string;
  label: string;
};

export type LandingImpactContent = {
  label: string;
  title: string;
  ctaLabel: string;
  ctaLink: string;
  backgroundColor: string;
  stats: LandingStat[];
};

export type LandingContactContent = {
  label: string;
  title: string;
  description: string;
  image: string;
};

export type LandingContent = {
  hero: LandingHeroContent;
  intro: LandingIntroContent;
  services: LandingServicesContent;
  process: LandingProcessContent;
  impact: LandingImpactContent;
  contact: LandingContactContent;
  meta?: {
    updatedAt?: string;
    updatedBy?: string | null;
  };
};

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    title: 'Bir yonetimden daha fazlasi',
    subtitle: 'Harika fikirler, guclu yazilimlarla hayat bulur.',
    ctaLabel: 'Hemen Basla',
    ctaLink: '#agency-intro',
    backgroundImage: '/photo.png',
  },
  intro: {
    label: 'TRIVEXA',
    title: 'Yazilim ajansiniz: fikri urune, urunu buyumeye donusturuyoruz.',
    paragraphs: [
      'Trivexa; web ve mobil uygulama gelistirme, urun tasarimi, altyapi kurulumu ve teknik danismanlik alanlarinda uctan uca hizmet veren bir yazilim ajansidir. Ekibimiz, markanizin hedeflerine uygun, olceklenebilir ve performans odakli dijital urunler tasarlar.',
      'Sureci netlestiren, hizli teslimat yapan ve kaliteyi koruyan bir yaklasimla calisiriz. Ister sifirdan bir urun gelistirin, ister mevcut projenizi bir ust seviyeye tasiyin; Trivexa teknik gucunuz olur.',
    ],
    tickerTexts: ['Trivexa', 'Solve the Problem,'],
  },
  services: {
    label: 'Hizmetler',
    title: 'Uctan uca yazilim cozumleri',
    items: [
      {
        title: 'Web Uygulama Gelistirme',
        description:
          'Performans odakli, olceklenebilir ve surdurulebilir web urunleri gelistiriyoruz.',
      },
      {
        title: 'Mobil Uygulama Gelistirme',
        description:
          'iOS ve Android icin kullanici odakli, hizli ve guvenilir mobil deneyimler tasarliyoruz.',
      },
      {
        title: 'UI/UX Tasarim',
        description:
          'Markaniza uygun, sade ve etkili arayuzlerle kullanici deneyimini guclendiriyoruz.',
      },
      {
        title: 'Teknik Danismanlik',
        description:
          'Mimari kararlar, kod kalitesi ve urun yol haritasinda ekibinize stratejik destek veriyoruz.',
      },
    ],
  },
  process: {
    label: 'Surec',
    title: 'Nasil calisiyoruz?',
    steps: [
      {
        title: 'Kesif ve Planlama',
        description:
          'Ihtiyaclari netlestirir, hedefleri olculebilir adimlara donustururuz.',
      },
      {
        title: 'Tasarim ve Prototipleme',
        description:
          'Kullanici akislarini tasarlar, fikirleri hizli prototiplerle gorunur hale getiririz.',
      },
      {
        title: 'Gelistirme ve Test',
        description:
          'Temiz kod, duzenli test ve iteratif teslimatlarla guvenli bir surec yuruturuz.',
      },
      {
        title: 'Yayin ve Buyume',
        description:
          'Urunu yayina alir, metriklerle izler ve surekli iyilestirme uygulariz.',
      },
    ],
  },
  impact: {
    label: 'Trivexa Etkisi',
    title: 'Urununuzu daha hizli ve daha dogru buyutun',
    ctaLabel: 'Projeni Konusalim',
    ctaLink: '/iletisim',
    backgroundColor: '#7D98AA',
    stats: [
      { value: '50+', label: 'Tamamlanan Proje' },
      { value: '12', label: 'Farkli Sektor' },
      { value: '%98', label: 'Zamaninda Teslimat' },
      { value: '24/7', label: 'Teknik Destek' },
    ],
  },
  contact: {
    label: 'ILETISIM',
    title: 'Projenizi birlikte planlayalim.',
    description:
      'Kisa bir formla ihtiyacinizi aktarip ekibimizin size donus yapmasini saglayin.',
    image: '/contact.png',
  },
};

function unwrapData<T>(payload: MaybeWrapped<T>): T {
  if (
    payload
    && typeof payload === 'object'
    && 'data' in payload
    && (payload as { data?: unknown }).data !== undefined
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function normalizeLandingContent(raw: unknown): LandingContent {
  const payload = (raw && typeof raw === 'object') ? (raw as Partial<LandingContent>) : {};
  const hero = { ...DEFAULT_LANDING_CONTENT.hero, ...(payload.hero ?? {}) };
  const introParagraphs = Array.isArray(payload.intro?.paragraphs) && payload.intro.paragraphs.length > 0
    ? payload.intro.paragraphs
    : DEFAULT_LANDING_CONTENT.intro.paragraphs;
  const introTickerTexts = Array.isArray(payload.intro?.tickerTexts) && payload.intro.tickerTexts.length > 0
    ? payload.intro.tickerTexts
    : DEFAULT_LANDING_CONTENT.intro.tickerTexts;
  const intro = {
    ...DEFAULT_LANDING_CONTENT.intro,
    ...(payload.intro ?? {}),
    paragraphs: introParagraphs,
    tickerTexts: introTickerTexts,
  };
  const servicesItems = Array.isArray(payload.services?.items) && payload.services.items.length > 0
    ? payload.services.items
    : DEFAULT_LANDING_CONTENT.services.items;
  const services = {
    ...DEFAULT_LANDING_CONTENT.services,
    ...(payload.services ?? {}),
    items: servicesItems,
  };
  const processSteps = Array.isArray(payload.process?.steps) && payload.process.steps.length > 0
    ? payload.process.steps
    : DEFAULT_LANDING_CONTENT.process.steps;
  const process = {
    ...DEFAULT_LANDING_CONTENT.process,
    ...(payload.process ?? {}),
    steps: processSteps,
  };
  const impactStats = Array.isArray(payload.impact?.stats) && payload.impact.stats.length > 0
    ? payload.impact.stats
    : DEFAULT_LANDING_CONTENT.impact.stats;
  const impact = {
    ...DEFAULT_LANDING_CONTENT.impact,
    ...(payload.impact ?? {}),
    stats: impactStats,
  };
  const contact = { ...DEFAULT_LANDING_CONTENT.contact, ...(payload.contact ?? {}) };

  return {
    hero,
    intro,
    services,
    process,
    impact,
    contact,
    meta: payload.meta ?? undefined,
  };
}

function buildBaseUrlCandidates(): string[] {
  const rawBase = typeof api.defaults.baseURL === 'string'
    ? api.defaults.baseURL.trim().replace(/\/+$/, '')
    : '';
  const candidates: string[] = [];

  if (rawBase) {
    candidates.push(rawBase);
  }

  if (rawBase.endsWith('/api/v1')) {
    candidates.push(rawBase.replace(/\/api\/v1$/, '/api'));
  } else if (rawBase.endsWith('/api')) {
    candidates.push(rawBase.replace(/\/api$/, '/api/v1'));
  }

  if (candidates.length === 0) {
    candidates.push('');
  }

  return Array.from(new Set(candidates));
}

async function requestWithFallback<T>(config: AxiosRequestConfig): Promise<T> {
  const bases = buildBaseUrlCandidates();
  let lastError: unknown;

  const requestConfig: AxiosRequestConfig = {
    ...config,
    headers: {
      ...(config.headers ?? {}),
      'x-skip-error-toast': '1',
    },
  };

  for (const base of bases) {
    try {
      const { data } = await api.request<T>({
        ...requestConfig,
        baseURL: base || undefined,
      });
      return data;
    } catch (error) {
      const isNotFound = axios.isAxiosError(error) && error.response?.status === 404;
      if (isNotFound && bases.length > 1) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error('Landing content request failed.');
}

export async function getLandingContent(): Promise<LandingContent> {
  const data = await requestWithFallback<MaybeWrapped<unknown>>({
    method: 'GET',
    url: '/landing/content',
  });
  const payload = unwrapData(data);
  return normalizeLandingContent(payload);
}

export async function updateLandingContent(payload: LandingContent): Promise<LandingContent> {
  const { meta, ...safePayload } = payload;
  const data = await requestWithFallback<MaybeWrapped<unknown>>({
    method: 'POST',
    url: '/landing/content',
    data: safePayload,
  });
  const response = unwrapData(data);
  return normalizeLandingContent(response);
}
