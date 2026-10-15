import { CalendarDays } from 'lucide-react';
import type { ReactNode } from 'react';

export const fieldClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50';

export const textareaClass =
  'w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50';

export const labelClass = 'mb-1.5 block text-xs font-bold text-slate-600';

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function FilterChip({ label, count, active, onClick, disabled }: FilterChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-white bg-white/70 text-slate-600 hover:bg-white'
      }`}
    >
      {label}
      <span className={`text-xs ${active ? 'text-blue-500' : 'text-slate-400'}`}>{count}</span>
    </button>
  );
}

type Tone = 'blue' | 'amber' | 'violet';

const EMPTY_TONES: Record<Tone, { panel: string; icon: string }> = {
  blue: { panel: 'border-blue-100 bg-[#eef4ff]', icon: 'bg-blue-100 text-blue-700' },
  amber: { panel: 'border-amber-100 bg-[#fff7e7]', icon: 'bg-amber-100 text-amber-800' },
  violet: { panel: 'border-violet-100 bg-[#f5f0ff]', icon: 'bg-violet-100 text-violet-800' },
};

export function EmptyPanel({ icon, title, description, tone }: { icon: ReactNode; title: string; description: string; tone: Tone }) {
  const palette = EMPTY_TONES[tone];
  return (
    <div className={`rounded-2xl border border-dashed px-5 py-10 text-center ${palette.panel}`}>
      <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl ${palette.icon}`}>{icon}</span>
      <h4 className="mt-3 text-sm font-extrabold text-ink">{title}</h4>
      <p className="mx-auto mt-1 max-w-xs text-sm leading-5 text-slate-600">{description}</p>
    </div>
  );
}

/** Cuadrado con el día y el mes abreviado de una fecha ISO. */
export function DateTile({ date, className = 'bg-[#edf3ff] text-blue-800', size = 'md' }: { date: string; className?: string; size?: 'md' | 'lg' }) {
  const parsed = new Date(date);
  const box = size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';

  if (!Number.isFinite(parsed.getTime())) {
    return (
      <span className={`flex ${box} shrink-0 items-center justify-center rounded-lg ${className}`}>
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }

  const day = new Intl.DateTimeFormat('es-ES', { day: '2-digit' }).format(parsed);
  const month = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(parsed).replace('.', '');
  return (
    <span className={`flex ${box} shrink-0 flex-col items-center justify-center rounded-lg ${className}`} aria-hidden="true">
      <span className="text-sm font-extrabold leading-none">{day}</span>
      <span className="mt-0.5 text-[10px] font-extrabold uppercase leading-none">{month}</span>
    </span>
  );
}

/** Color translúcido a partir de un hex (#RRGGBB o #RGB) para tintar la fila de cada asignatura. */
export function tint(hexColor: string, opacity: number): string {
  const hex = hexColor.replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map((value) => `${value}${value}`).join('') : hex;
  if (!/^[\da-f]{6}$/i.test(normalized)) return `rgba(49, 88, 219, ${opacity})`;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}
