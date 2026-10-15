'use client';

import { CalendarDays, Lightbulb, MessageCircle, Share2, X } from 'lucide-react';
import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import EventsPanel from '@/components/agenda/events-panel';
import QuestionsPanel from '@/components/agenda/questions-panel';
import TipsPanel from '@/components/agenda/tips-panel';
import { formatDateTime, getMilestoneLabel, getUpcomingMilestones } from '@/lib/academic';
import { useModal } from '@/lib/agenda/use-modal';
import type { ClassTip, Comment, Course, Milestone } from '@/types';

export type SubjectTab = 'events' | 'tips' | 'questions';

interface SubjectDrawerProps {
  course: Course;
  initialTab: SubjectTab;
  /** Abre directamente el formulario de la pestaña inicial (al venir de «Añadir hito»). */
  startWithComposer: boolean;
  onClose: () => void;
  onAddEvent: (courseId: string, event: Milestone) => void;
  onVoteEvent: (courseId: string, eventId: string) => void;
  onAddTip: (courseId: string, tip: ClassTip) => void;
  onAddComment: (courseId: string, comment: Comment) => void;
}

function DrawerTab({ id, active, onSelect, icon, label, count }: { id: SubjectTab; active: boolean; onSelect: (tab: SubjectTab) => void; icon: ReactNode; label: string; count: number }) {
  return (
    <button
      id={`subject-tab-${id}`}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={`subject-panel-${id}`}
      onClick={() => onSelect(id)}
      className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-extrabold transition sm:gap-2 sm:text-sm ${active ? 'bg-white text-blue-800 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}
    >
      {icon}
      <span>{label}</span>
      <span className={`rounded-md px-1.5 py-0.5 text-xs ${active ? 'bg-blue-50 text-blue-700' : 'bg-white/70 text-slate-600'}`}>{count}</span>
    </button>
  );
}

export default function SubjectDrawer({ course, initialTab, startWithComposer, onClose, onAddEvent, onVoteEvent, onAddTip, onAddComment }: SubjectDrawerProps) {
  const [tab, setTab] = useState<SubjectTab>(initialTab);
  const [autoOpenComposer, setAutoOpenComposer] = useState(startWithComposer);
  const dialogRef = useModal<HTMLElement>(onClose);

  const upcoming = useMemo(() => getUpcomingMilestones(course.events), [course.events]);
  const term = course.quarters.map((quarter) => `${quarter}º`).join(' y ');

  const selectTab = (next: SubjectTab) => {
    setTab(next);
    setAutoOpenComposer(false);
  };

  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const shareOnWhatsApp = () => {
    const dates = upcoming.length
      ? upcoming
          .map((item) => `• ${getMilestoneLabel(item)}: ${item.title} — ${formatDateTime(item.date)}${item.classroom ? ` · Aula: ${item.classroom}` : ''}`)
          .join('\n')
      : 'Aún no hay próximas fechas registradas.';
    const message = [`*MktHub US · ${course.title} (${course.code})*`, '', '*Próximas fechas:*', dates, '', `Consulta la agenda: ${window.location.origin}`].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#172544]/35 backdrop-blur-[2px]" onMouseDown={closeOnBackdrop}>
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-drawer-title"
        className="flex h-full w-full max-w-[560px] flex-col overflow-hidden border-l border-blue-100 bg-[#f4f6fc] shadow-[-18px_0_60px_rgba(23,37,68,0.14)] outline-none"
      >
        <header className="shrink-0 border-b border-blue-100/80 bg-[linear-gradient(115deg,#e8f0ff_0%,#f0efff_56%,#f5efff_100%)] px-5 pb-4 pt-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                {course.code} · {term} cuatrimestre
              </p>
              <h2 id="subject-drawer-title" className="mt-1.5 text-2xl font-extrabold leading-tight tracking-tight text-ink">
                {course.title}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={shareOnWhatsApp} title="Compartir fechas en WhatsApp" aria-label={`Compartir las fechas de ${course.title} en WhatsApp`} className="rounded-xl p-2.5 text-blue-700 transition hover:bg-blue-100/70">
                <Share2 className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
              <button type="button" onClick={onClose} aria-label="Cerrar asignatura" className="rounded-xl p-2.5 text-slate-500 transition hover:bg-white hover:text-slate-900">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-blue-100/80 bg-[#e6ecf8] p-1" role="tablist" aria-label="Secciones de la asignatura">
            <DrawerTab id="events" active={tab === 'events'} onSelect={selectTab} icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />} label="Fechas" count={course.events.length} />
            <DrawerTab id="tips" active={tab === 'tips'} onSelect={selectTab} icon={<Lightbulb className="h-4 w-4" aria-hidden="true" />} label="Apuntes" count={course.tips.length} />
            <DrawerTab id="questions" active={tab === 'questions'} onSelect={selectTab} icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />} label="Dudas" count={course.comments.length} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {tab === 'events' && <EventsPanel course={course} startOpen={autoOpenComposer} onAddEvent={onAddEvent} onVote={onVoteEvent} />}
          {tab === 'tips' && <TipsPanel course={course} startOpen={autoOpenComposer} onAddTip={onAddTip} />}
          {tab === 'questions' && <QuestionsPanel course={course} startOpen={autoOpenComposer} onAddComment={onAddComment} />}
        </div>
      </section>
    </div>
  );
}
