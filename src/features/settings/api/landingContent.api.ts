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

export type LandingPolicyContent = {
  label: string;
  title: string;
  content: string;
};

export type LandingContent = {
  hero: LandingHeroContent;
  intro: LandingIntroContent;
  services: LandingServicesContent;
  process: LandingProcessContent;
  impact: LandingImpactContent;
  contact: LandingContactContent;
  privacyPolicy: LandingPolicyContent;
  userPolicy: LandingPolicyContent;
  meta?: {
    updatedAt?: string;
    updatedBy?: string | null;
  };
};

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    title: 'Bir yönetimden daha fazlası',
    subtitle: 'Harika fikirler, güçlü yazılımlarla hayat bulur.',
    ctaLabel: 'Hemen Başla',
    ctaLink: '#agency-intro',
    backgroundImage: '/photo.png',
  },
  intro: {
    label: 'TRIVEXA',
    title: 'Yazılım ajansınız: fikri ürüne, ürünü büyümeye dönüştürüyoruz.',
    paragraphs: [
      'Trivexa; web ve mobil uygulama geliştirme, ürün tasarımı, altyapı kurulumu ve teknik danışmanlık alanlarında uçtan uca hizmet veren bir yazılım ajansıdır. Ekibimiz, markanızın hedeflerine uygun, ölçeklenebilir ve performans odaklı dijital ürünler tasarlar.',
      'Süreci netleştiren, hızlı teslimat yapan ve kaliteyi koruyan bir yaklaşımla çalışırız. İster sıfırdan bir ürün geliştirin, ister mevcut projenizi bir üst seviyeye taşıyın; Trivexa teknik gücünüz olur.',
    ],
    tickerTexts: ['Trivexa', 'Solve the Problem,'],
  },
  services: {
    label: 'Hizmetler',
    title: 'Uçtan uca yazılım çözümleri',
    items: [
      {
        title: 'Web Uygulama Geliştirme',
        description:
          'Performans odaklı, ölçeklenebilir ve sürdürülebilir web ürünleri geliştiriyoruz.',
      },
      {
        title: 'Mobil Uygulama Geliştirme',
        description:
          'iOS ve Android için kullanıcı odaklı, hızlı ve güvenilir mobil deneyimler tasarlıyoruz.',
      },
      {
        title: 'UI/UX Tasarım',
        description:
          'Markanıza uygun, sade ve etkili arayüzlerle kullanıcı deneyimini güçlendiriyoruz.',
      },
      {
        title: 'Teknik Danışmanlık',
        description:
          'Mimari kararlar, kod kalitesi ve ürün yol haritasında ekibinize stratejik destek veriyoruz.',
      },
    ],
  },
  process: {
    label: 'Süreç',
    title: 'Nasıl çalışıyoruz?',
    steps: [
      {
        title: 'Keşif ve Planlama',
        description:
          'İhtiyaçları netleştirir, hedefleri ölçülebilir adımlara dönüştürürüz.',
      },
      {
        title: 'Tasarım ve Prototipleme',
        description:
          'Kullanıcı akışlarını tasarlar, fikirleri hızlı prototiplerle görünür hale getiririz.',
      },
      {
        title: 'Geliştirme ve Test',
        description:
          'Temiz kod, düzenli test ve iteratif teslimatlarla güvenli bir süreç yürütürüz.',
      },
      {
        title: 'Yayın ve Büyüme',
        description:
          'Ürünü yayına alır, metriklerle izler ve sürekli iyileştirme uygularız.',
      },
    ],
  },
  impact: {
    label: 'Trivexa Etkisi',
    title: 'Ürününüzü daha hızlı ve daha doğru büyütün',
    ctaLabel: 'Projeni Konuşalım',
    ctaLink: '/iletisim',
    backgroundColor: '#7D98AA',
    stats: [
      { value: '50+', label: 'Tamamlanan Proje' },
      { value: '12', label: 'Farklı Sektör' },
      { value: '%98', label: 'Zamanında Teslimat' },
      { value: '24/7', label: 'Teknik Destek' },
    ],
  },
  contact: {
    label: 'İLETİŞİM',
    title: 'Projenizi birlikte planlayalım.',
    description:
      'Kısa bir formla ihtiyacınızı aktarıp ekibimizin size dönüş yapmasını sağlayın.',
    image: '/contact.png',
  },
  privacyPolicy: {
    label: 'Gizlilik',
    title: 'Gizlilik Politikası',
    content: `TRIVEXA olarak, kullanıcılarımızın kişisel verilerinin korunmasına ve güvenliğine en yüksek önemi veriyoruz. Bu Gizlilik Politikası, web sitemizi ziyaret ettiğinizde veya hizmetlerimizi kullandığınızda bilgilerinizin nasıl toplandığını, kullanıldığını ve paylaşıldığını açıklamaktadır.

1. Toplanan Bilgiler
İletişim formları veya müşteri paneli aracılığıyla adınız, e-posta adresiniz, telefon numaranız ve şirket bilgileriniz gibi kişisel verileri toplayabiliriz. Sistem performansını artırmak amacıyla çerezler (cookies) ve benzeri teknolojiler kullanılarak anonim kullanım istatistikleri elde edilebilir.

2. Bilgilerin Kullanımı
Topladığımız bilgiler; size daha iyi hizmet sunmak, taleplerinizi yanıtlamak, projelerinizi yönetmek, müşteri portalı erişimi sağlamak ve yasal yükümlülüklerimizi yerine getirmek amacıyla kullanılır.

3. Bilgilerin Paylaşımı
Kişisel verileriniz, izniniz olmadan üçüncü şahıslarla paylaşılmaz. Sadece yasal zorunluluklar doğrultusunda resmi makamlarla veya hizmet sağlayıcı iş ortaklarımızla gizlilik sözleşmeleri çerçevesinde paylaşılabilir.

4. Veri Güvenliği
TRIVEXA, kişisel verilerinizi yetkisiz erişim, kayıp veya kötüye kullanıma karşı korumak için geçerli güvenlik önlemleri almaktadır.

5. Haklarınız
Kişisel verilerinizle ilgili bilgi alma, düzeltme veya silme talebinde bulunma hakkına sahipsiniz. Bizimle iletişim sayfamızdan irtibata geçebilirsiniz.`,
  },
  userPolicy: {
    label: 'Kullanıcı',
    title: 'Kullanıcı Politikası (Kullanım Şartları)',
    content: `TRIVEXA platformlarına hoş geldiniz. Web sitemizi veya müşteri portalımızı kullanarak aşağıdaki kullanım şartlarını kabul etmiş olursunuz:

1. Hizmet Kapsamı ve Fikri Mülkiyet
TRIVEXA, yazılım çözümleri ve danışmanlık hizmetleri sunar. Platformda yer alan içerik, logo, tasarım ve yazılım kodları TRIVEXA'nın mülkiyetindedir. Sözleşme ile aksi belirtilmedikçe kopyalanamaz veya izinsiz kullanılamaz.

2. Kullanıcı Yükümlülükleri
Müşteri paneline erişim bilgilerinizin güvenliğinden tamamen siz sorumlusunuz. Platformumuzu kullanırken yasalara uygun hareket etmeli, sisteme zarar verecek her türlü işlemden kaçınmalısınız.

3. Sunulan Bilgilerin Doğruluğu
Proje talepleri ve formlar aracılığıyla bize ilettiğiniz tüm bilgilerin doğru olduğunu beyan edersiniz. TRIVEXA, yanıltıcı bilgi sunulması halinde hizmet vermeyi reddedebilir.

4. Güncellemeler ve Değişiklikler
TRIVEXA, işbu Kullanıcı Politikası şartlarını ve sağlanan hizmetin detaylarını, önceden haber vermeksizin dilediği zaman değiştirme hakkını saklı tutar.

5. Sorumluluk Reddi
Web sitemiz veya hizmetlerimiz kesintisiz veya tamamen hatasız olma garantisi vermez. TRIVEXA, teknik veya idari kesintilerden doğabilecek doğrudan veya dolaylı zararlardan sorumlu tutulamaz.`,
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
  const privacyPolicy = { ...DEFAULT_LANDING_CONTENT.privacyPolicy, ...(payload.privacyPolicy ?? {}) };
  const userPolicy = { ...DEFAULT_LANDING_CONTENT.userPolicy, ...(payload.userPolicy ?? {}) };

  return {
    hero,
    intro,
    services,
    process,
    impact,
    contact,
    privacyPolicy,
    userPolicy,
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
  const safePayload = { ...payload };
  delete safePayload.meta;
  const data = await requestWithFallback<MaybeWrapped<unknown>>({
    method: 'POST',
    url: '/landing/content',
    data: safePayload,
  });
  const response = unwrapData(data);
  return normalizeLandingContent(response);
}
