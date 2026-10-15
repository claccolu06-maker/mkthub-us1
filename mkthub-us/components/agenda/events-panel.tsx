'use client';

import { CalendarDays, CalendarPlus, CheckCircle2, Clock3, MapPin, Plus, ThumbsUp, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { DateTile, EmptyPanel, FilterChip, fieldClass, labelClass } from '@/components/agenda/ui';
import { formatDateTime, getGoogleCalendarUrl, getMilestoneLabel, sortMilestonesByDate } from '@/lib/academic';
import { createId } from '@/lib/id';
import type { Course, ExamSubtype, Milestone, MilestoneType } from '@/types';

type EventFilter = 'all' | MilestoneType;

const GROUPS: Array<{ value: MilestoneType; label: string }> = [
  { value: 'exam', label: 'Exámenes' },
  { value: 'task', label: 'Entregas' },
];

const TONES = {
  exam: { surface: '#fff7f7', border: '#f3dfe2', tile: 'bg-rose-100 text-rose-800', badge: 'bg-rose-50 text-rose-700' },
  task: { surface: '#f2f5ff', border: '#dce5ff', tile: 'bg-indigo-100 text-indigo-800', badge: 'bg-blue-50 text-blue-700' },
} as const;

export default function EventsPanel({
  course,
  startOpen,
  onAddEvent,
  onVote,
}: {
  course: Course;
  startOpen: boolean;
  onAddEvent: (courseId: string, event: Milestone) => void;
  onVote: (courseId: string, eventId: string) => void;
}) {
  const [composerOpen, setComposerOpen] = useState(startOpen);
  const [filter, setFilter] = useState<EventFilter>('all');
  const [type, setType] = useState<MilestoneType>('exam');
  const [examSubtype, setExamSubtype] = useState<ExamSubtype | ''>('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [classroom, setClassroom] = useState('');

  const sorted = useMemo(() => sortMilestonesByDate(course.events), [course.events]);
  const groups = useMemo(
    () =>
      GROUPS.filter((group) => filter === 'all' || filter === group.value)
        .map((group) => ({ ...group, events: sorted.filter((milestone) => milestone.type === group.value) }))
        .filter((group) => group.events.length > 0),
    [filter, sorted],
  );

  const filterOptions: Array<{ value: EventFilter; label: string; count: number }> = [
    { value: 'all', label: 'Todas', count: course.events.length },
    { value: 'exam', label: 'Exámenes', count: course.events.filter((event) => event.type === 'exam').length },
    { value: 'task', label: 'Entregas', count: course.events.filter((event) => event.type === 'task').length },
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const parsedDate = new Date(date);
    if (!cleanTitle || !date || !Number.isFinite(parsedDate.getTime())) return;

    onAddEvent(course.id, {
      id: createId(),
      type,
      ...(type === 'exam' && examSubtype ? { examSubtype } : {}),
      title: cleanTitle,
      date: parsedDate.toISOString(),
      classroom: classroom.trim(),
      votes: 0,
    });

    setFilter(type);
    setTitle('');
    setDate('');
    setClassroom('');
    setType('exam');
    setExamSubtype('');
    setComposerOpen(false);
  };

  const typeButton = (value: MilestoneType, label: string) => (
    <button
      type="button"
      aria-pressed={type === value}
      onClick={() => {
        setType(value);
        if (value === 'task') setExamSubtype('');
      }}
      className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-bold transition ${type === value ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
    >
      {label}
    </button>
  );

  return (
    <section id="subject-panel-events" role="tabpanel" aria-labelledby="subject-tab-events">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-ink">Fechas importantes</h3>
          <p className="mt-0.5 text-sm text-slate-600">Exámenes y entregas, en orden.</p>
        </div>
        {!composerOpen && (
          <button type="button" onClick={() => setComposerOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-dark">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Añadir fecha
          </button>
        )}
      </div>

      {course.events.length > 0 && (
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtrar fechas por tipo">
          {filterOptions.map((option) => (
            <FilterChip key={option.value} label={option.label} count={option.count} active={filter === option.value} disabled={option.value !== 'all' && option.count === 0} onClick={() => setFilter(option.value)} />
          ))}
        </div>
      )}

      {composerOpen && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-2xl border border-blue-100 bg-[#eaf1ff] p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-extrabold text-ink">Nueva fecha</h4>
            <button type="button" onClick={() => setComposerOpen(false)} aria-label="Cerrar formulario" className="rounded-lg p-1.5 text-slate-500 hover:bg-white">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mb-3 flex gap-2" role="group" aria-label="Tipo de fecha">
            {typeButton('exam', 'Examen')}
            {typeButton('task', 'Entrega de trabajo')}
          </div>

          {type === 'exam' && (
            <div className="mb-3">
              <label htmlFor="event-subtype" className={labelClass}>Tipo de examen (opcional)</label>
              <select id="event-subtype" value={examSubtype} onChange={(event) => setExamSubtype(event.target.value as ExamSubtype | '')} className={fieldClass}>
                <option value="">Sin especificar</option>
                <option value="partial">Parcial</option>
                <option value="final">Final</option>
              </select>
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="event-title" className={labelClass}>Título</label>
            <input id="event-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} required placeholder="Por ejemplo, Parcial temas 1 a 3" className={fieldClass} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="event-date" className={labelClass}>Fecha y hora</label>
              <input id="event-date" type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} required className={fieldClass} />
            </div>
            <div>
              <label htmlFor="event-room" className={labelClass}>Aula (si se conoce)</label>
              <input id="event-room" value={classroom} onChange={(event) => setClassroom(event.target.value)} maxLength={160} placeholder="Por ejemplo, Aula 12" className={fieldClass} />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setComposerOpen(false)} className="rounded-lg px-3.5 py-2.5 text-sm font-bold text-slate-600 hover:bg-white">Cancelar</button>
            <button type="submit" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-extrabold text-white hover:bg-brand-dark">Guardar</button>
          </div>
        </form>
      )}

      {groups.length > 0 ? (
        <div className="space-y-5">
          {groups.map((group) => {
            const tone = TONES[group.value];
            return (
              <section key={group.value} aria-label={`${group.label}: ${group.events.length}`}>
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <h4 className="text-sm font-extrabold text-ink">{group.label}</h4>
                  <span className="rounded-md bg-white px-1.5 py-0.5 text-xs font-bold text-slate-600">{group.events.length}</span>
                </div>
                <div className="space-y-2.5">
                  {group.events.map((milestone) => (
                    <article key={milestone.id} className="rounded-2xl border p-3.5 shadow-card" style={{ backgroundColor: tone.surface, borderColor: tone.border }}>
                      <div className="flex gap-3">
                        <DateTile date={milestone.date} size="lg" className={tone.tile} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-md px-2 py-1 text-xs font-extrabold ${tone.badge}`}>{getMilestoneLabel(milestone)}</span>
                            {milestone.votes >= 3 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                Verificado por la clase
                              </span>
                            )}
                          </div>
                          <h5 className="mt-1.5 break-words text-sm font-extrabold text-ink">{milestone.title}</h5>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-slate-600">
                            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{formatDateTime(milestone.date)}</span>
                            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{milestone.classroom || 'Aula por confirmar'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        <button type="button" onClick={() => onVote(course.id, milestone.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0f4fd] px-3 py-2 text-xs font-extrabold text-[#375691] transition hover:bg-blue-100">
                          <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                          El profe lo confirmó (+1)
                          <span className="rounded-full bg-white px-1.5 py-0.5 text-xs text-slate-600">{milestone.votes}</span>
                        </button>
                        <a href={getGoogleCalendarUrl(course, milestone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700">
                          <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                          Google Calendar
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyPanel tone="blue" icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />} title="Sin fechas todavía" description="Añade la próxima fecha en cuanto se anuncie." />
      )}

      <p className="mt-4 text-center text-xs leading-5 text-slate-500">
        Los datos se guardan en este navegador; para compartirlos con la clase hará falta sincronización.
      </p>
    </section>
  );
}
