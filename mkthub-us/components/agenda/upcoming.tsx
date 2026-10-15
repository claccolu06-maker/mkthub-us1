import { CalendarDays, ChevronRight, MessageCircle } from 'lucide-react';
import { DateTile } from '@/components/agenda/ui';
import { formatDateTime, getMilestoneLabel } from '@/lib/academic';
import type { Comment, Course, Milestone } from '@/types';

export interface MilestoneEntry {
  course: Course;
  milestone: Milestone;
}

export interface QuestionEntry {
  course: Course;
  question: Comment;
}

const TONES = {
  rose: {
    panel: 'border-rose-100 bg-[linear-gradient(112deg,#fff4f5_0%,#fffafb_100%)]',
    icon: 'bg-rose-100 text-rose-700',
    count: 'bg-white text-rose-700',
    badge: 'bg-rose-50 text-rose-700',
    tile: 'bg-rose-100 text-rose-800',
  },
  blue: {
    panel: 'border-blue-100 bg-[linear-gradient(112deg,#eaf1ff_0%,#f8faff_100%)]',
    icon: 'bg-blue-100 text-blue-700',
    count: 'bg-white text-blue-700',
    badge: 'bg-blue-50 text-blue-700',
    tile: 'bg-[#edf3ff] text-blue-800',
  },
} as const;

export function UpcomingSection({
  title,
  items,
  total,
  tone,
  onOpen,
}: {
  title: string;
  items: MilestoneEntry[];
  /** Total real de hitos próximos cuando `items` es solo una parte (por defecto, `items.length`). */
  total?: number;
  tone: keyof typeof TONES;
  onOpen: (course: Course) => void;
}) {
  const palette = TONES[tone];

  return (
    <section aria-label={title} className={`rounded-2xl border p-4 sm:px-5 ${palette.panel}`}>
      <div className="flex items-center gap-2 text-sm font-extrabold text-ink">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${palette.icon}`}>
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2>{title}</h2>
        <span className={`rounded-md px-1.5 py-0.5 text-xs ${palette.count}`}>{total ?? items.length}</span>
      </div>

      <div className="mt-3 space-y-2">
        {items.map(({ course, milestone }) => (
          <button
            key={`${course.id}-${milestone.id}`}
            type="button"
            onClick={() => onOpen(course)}
            aria-label={`${milestone.title}, ${course.title}, ${formatDateTime(milestone.date)}`}
            className="flex w-full items-center gap-3 rounded-xl border border-white/90 bg-white/80 px-3 py-2.5 text-left shadow-sm transition hover:bg-white"
            style={{ borderLeftWidth: '3px', borderLeftColor: course.borderColor }}
          >
            <DateTile date={milestone.date} className={palette.tile} />
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-2">
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-extrabold ${palette.badge}`}>{getMilestoneLabel(milestone)}</span>
                <span className="truncate text-sm font-extrabold text-ink">{milestone.title}</span>
              </span>
              <span className="mt-0.5 block truncate text-xs text-slate-600">
                {course.code} · {course.title} · {formatDateTime(milestone.date)}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="mt-2.5 text-xs text-slate-500">
        {total !== undefined && total > items.length ? `Mostrando las ${items.length} más próximas.` : 'Ordenados desde la fecha más próxima.'}
      </p>
    </section>
  );
}

export function RecentQuestions({ items, onOpen }: { items: QuestionEntry[]; onOpen: (course: Course) => void }) {
  return (
    <section aria-label="Dudas recientes" className="rounded-2xl border border-violet-100 bg-[linear-gradient(110deg,#f5f0ff_0%,#fbf8ff_100%)] p-4 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-violet-950">
          <MessageCircle className="h-4 w-4 text-violet-700" aria-hidden="true" />
          <h2>Dudas recientes</h2>
          <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-xs text-violet-700">{items.length}</span>
        </div>
        {items.length > 3 && <span className="text-xs font-medium text-violet-700">Mostrando las 3 últimas</span>}
      </div>

      <div className="mt-3 space-y-2">
        {items.slice(0, 3).map(({ course, question }) => (
          <button
            key={`${course.id}-${question.id}`}
            type="button"
            onClick={() => onOpen(course)}
            className="flex w-full items-center gap-3 rounded-xl border border-white/90 bg-white/80 px-3 py-2.5 text-left shadow-sm transition hover:bg-white"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink">{question.text}</span>
              <span className="mt-0.5 block truncate text-xs text-slate-600">
                {course.code} · {course.title} · {formatDateTime(question.date)}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
