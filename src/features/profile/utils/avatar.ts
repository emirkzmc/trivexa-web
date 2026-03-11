export function buildAvatarSrc(rawUrl: string | null | undefined): string {
  const raw = (rawUrl || '').trim();
  if (!raw) return '';
  const normalized = raw.replace(/\\/g, '/');
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  let base = envBase ? envBase.replace(/\/+$/, '') : '';
  if (base.endsWith('/api/v1')) {
    base = base.replace(/\/api\/v1$/, '');
  } else if (base.endsWith('/api')) {
    base = base.replace(/\/api$/, '');
  }
  if (!base) {
    base = 'http://localhost:3500';
  }
  const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${base}${path}`;
}
