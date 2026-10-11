export function normalizeRoleKey(role?: string): string {
  const raw = String(role ?? '').trim();
  if (!raw) return '';
  return raw.replace(/[\s-]+/g, '_').toUpperCase();
}
