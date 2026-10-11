import { ArrowLeft, Home } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

function resolveHomePath(pathname: string): string {
  if (pathname.startsWith('/app')) return '/app/dashboard';
  if (pathname.startsWith('/customer-panel')) return '/customer-panel/dashboard';
  return '/login';
}

export function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fallbackPath = resolveHomePath(location.pathname);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">404</p>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Sayfa bulunamadi</h1>
        <p className="mt-2 text-sm text-gray-500">
          Aradigin sayfa mevcut degil veya tasinmis olabilir.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <ArrowLeft size={16} />
            Geri Don
          </button>
          <button
            type="button"
            onClick={() => navigate(fallbackPath, { replace: true })}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <Home size={16} />
            Ana Sayfaya Git
          </button>
        </div>
        <p className="mt-6 text-xs text-gray-400">
          Bulunamayan yol: <span className="font-mono">{location.pathname}</span>
        </p>
      </div>
    </div>
  );
}
