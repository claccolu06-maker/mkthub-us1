import { CalendarCheck2, CalendarDays, ChevronRight, Lightbulb, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { tint } from '@/components/agenda/ui';
import { formatDateTime, getMilestoneLabel, getUpcomingMilestones } from '@/lib/academic';
import type { Course } from '@/types';

function RowCount({ icon, count, label }: { icon: ReactNode; count: number; label: string }) {
  return (
    <span className="flex min-w-[44px] flex-col items-center gap-0.5">
      <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700">
        {icon}
        {count}
      </span>
      <span className="text-xs text-slate-500">{label}</span>
    </span>
  );
}

export default function CourseRow({ course, onOpen, disabled }: { course: Course; onOpen: (course: Course) => void; disabled: boolean }) {
  const upcoming = getUpcomingMilestones(course.events)[0] ?? null;
  const term = course.quarters.map((quarter) => `${quarter}º`).join(' y ');

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onOpen(course)}
      aria-label={`Abrir ${course.title}`}
      className="group flex w-full items-center gap-3 rounded-2xl border border-white/70 px-3 py-3.5 text-left shadow-card transition duration-200 hover:-translate-y-px hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:gap-4 sm:px-4"
      style={{ borderLeftWidth: '4px', borderLeftColor: course.borderColor, backgroundColor: tint(course.borderColor, 0.055) }}
    >
      <span
        className="flex h-11 w-[58px] shrink-0 items-center justify-center rounded-xl text-xs font-extrabold tracking-wide text-[#304779] shadow-sm sm:h-12 sm:w-16"
        style={{ backgroundColor: course.badgeBg }}
      >
        {course.code}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[15px] font-extrabold leading-snug text-ink transition-colors group-hover:text-blue-800">{course.title}</span>
          <span className="rounded-md bg-[#f0f3fa] px-1.5 py-0.5 text-xs font-bold text-slate-600">{term} cuatri</span>
        </span>
        <span className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[13px] text-slate-600">
          {upcoming ? (
            <>
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
              <span className="truncate font-semibold">
                {getMilestoneLabel(upcoming)} · {upcoming.title}
              </span>
              <span className="hidden shrink-0 text-slate-500 sm:inline">· {formatDateTime(upcoming.date)}</span>
            </>
          ) : (
            <>
              <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" aria-hidden="true" />
              <span className="truncate">Sin fechas próximas</span>
            </>
          )}
        </span>
      </span>

      <span className="hidden shrink-0 items-center gap-4 sm:flex">
        <RowCount icon={<CalendarCheck2 className="h-4 w-4 text-blue-600" aria-hidden="true" />} count={course.events.length} label="hitos" />
        <RowCount icon={<Lightbulb className="h-4 w-4 text-amber-600" aria-hidden="true" />} count={course.tips.length} label="apuntes" />
        <RowCount icon={<MessageCircle className="h-4 w-4 text-violet-600" aria-hidden="true" />} count={course.comments.length} label="dudas" />
      </span>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0f4fd] text-slate-400 transition group-hover:bg-blue-50 group-hover:text-blue-700">
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );
}
