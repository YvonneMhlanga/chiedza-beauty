// How and where a braider works. Many Zimbabwean braiders don't have a shop —
// they work from home, travel to the client, or set up at a market.
export const WORK_TYPES = [
  { value: 'home', label: 'Home salon', short: 'Home', emoji: '🏠' },
  { value: 'mobile', label: 'I travel to the client', short: 'Comes to you', emoji: '🚗' },
  { value: 'salon', label: 'Salon / studio', short: 'Salon', emoji: '💈' },
  { value: 'market', label: 'Market stall', short: 'Market', emoji: '🛍️' },
  { value: 'outdoor', label: 'Outdoor / roadside', short: 'Roadside', emoji: '🌳' },
] as const;

export type WorkTypeValue = (typeof WORK_TYPES)[number]['value'];

export function workTypeLabel(value?: string | null) {
  const w = WORK_TYPES.find((t) => t.value === value);
  return w ? `${w.emoji} ${w.short}` : '';
}
