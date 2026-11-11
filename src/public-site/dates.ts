export function validISO(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function formatDatesInText(value: string): string {
  return value.replace(/\b\d{4}-\d{2}-\d{2}\b/g, iso => validISO(iso) ? iso.split('-').reverse().join('/') : iso);
}
export function toISO(value: string): string | null {
  if (validISO(value)) return value;
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const iso = m && `${m[3]}-${m[2]}-${m[1]}`;
  return iso && validISO(iso) ? iso : null;
}
