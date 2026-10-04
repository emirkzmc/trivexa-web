import { ArrowRight, BarChart3, Clock, LayoutDashboard, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-[color:var(--role-accent-200)] selection:text-[color:var(--role-accent-900)]">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <span className="text-xl font-bold text-white">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Trivexa</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/demo-login" className="hidden text-sm font-medium text-gray-600 transition hover:text-gray-900 sm:block">
              Demo'yu İncele
            </Link>
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/3 rounded-full bg-indigo-50 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] -translate-x-1/3 translate-y-1/3 rounded-full bg-purple-50 blur-[100px]"></div>
        
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mx-auto flex max-w-3xl flex-col items-center">
            <span className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-4 py-1.5 text-sm font-medium text-indigo-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
              Trivexa 2.0 Yayında
            </span>
            <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Ajans Süreçlerinizi <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Tek Platformda</span> Yönetin
            </h1>
            <p className="mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl">
              Projeler, görevler, finans yönetimi ve müşteri ilişkileri... İhtiyacınız olan her şey Trivexa'nın modern ve sezgisel arayüzünde.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link 
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:scale-105 hover:shadow-indigo-500/40"
              >
                Hemen Başla
                <ArrowRight size={20} />
              </Link>
              <Link 
                to="/demo-login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-gray-900 ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50 hover:ring-gray-300"
              >
                Demoyu İncele
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mx-auto mt-24 max-w-5xl">
            <div className="rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-gray-900/5 lg:p-4">
              <div className="overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-900/5">
                <div className="flex h-12 items-center gap-2 border-b border-gray-200 bg-gray-100/50 px-4">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                    <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  </div>
                </div>
                {/* Dashboard Skeleton/Mockup */}
                <div className="flex h-[400px] p-6 lg:h-[600px]">
                   <div className="hidden w-64 flex-col gap-4 border-r border-gray-200 pr-6 sm:flex">
                     {[...Array(6)].map((_, i) => (
                       <div key={i} className="h-10 rounded-lg bg-gray-200/50"></div>
                     ))}
                   </div>
                   <div className="flex flex-1 flex-col gap-6 pl-0 sm:pl-6">
                     <div className="flex gap-4">
                       <div className="h-32 flex-1 rounded-xl bg-indigo-50"></div>
                       <div className="h-32 flex-1 rounded-xl bg-purple-50"></div>
                       <div className="h-32 flex-1 rounded-xl bg-sky-50"></div>
                     </div>
                     <div className="flex-1 rounded-xl bg-gray-100/50"></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">Daha Hızlı Üretin</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ajansınız için Her Şey
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Dağınık araçlara veda edin. Trivexa ile süreçlerinizi tek bir çatı altında birleştirin ve verimliliğinizi artırın.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  name: 'Proje ve Görev Yönetimi',
                  description: 'Gelişmiş kanban board, gantt şemaları ve detaylı görev takibi ile projelerinizi zamanında teslim edin.',
                  icon: LayoutDashboard,
                  color: 'bg-blue-500'
                },
                {
                  name: 'Finans ve Ön Muhasebe',
                  description: 'Faturalar, gelir-gider takibi ve müşteri ekstrelerini otomatik oluşturarak nakit akışınızı koruyun.',
                  icon: BarChart3,
                  color: 'bg-emerald-500'
                },
                {
                  name: 'Müşteri Portalı',
                  description: 'Müşterilerinize özel panel ile süreçleri şeffaf hale getirin, onay süreçlerini hızlandırın.',
                  icon: Users,
                  color: 'bg-purple-500'
                },
                {
                  name: 'Zaman Takibi (Time Tracker)',
                  description: 'Ekibinizin hangi projeye ne kadar zaman harcadığını detaylı raporlarla analiz edin.',
                  icon: Clock,
                  color: 'bg-amber-500'
                },
                {
                  name: 'Rol ve Yetkilendirme',
                  description: 'Gelişmiş yetki sistemi ile herkesin sadece görmesi gereken modüllere erişmesini sağlayın.',
                  icon: Shield,
                  color: 'bg-rose-500'
                },
              ].map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${feature.color} shadow-sm`}>
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Trivexa. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
