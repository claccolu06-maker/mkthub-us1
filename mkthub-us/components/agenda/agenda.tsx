'use client';

import { CalendarCheck2, CheckCircle2, Library, LogOut, NotebookPen, Plus, Search, TriangleAlert } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { BrandMark } from '@/components/access/shell';
import CoursePicker from '@/components/agenda/course-picker';
import CourseRow from '@/components/agenda/course-row';
import SubjectDrawer, { type SubjectTab } from '@/components/agenda/subject-drawer';
import { FilterChip, fieldClass } from '@/components/agenda/ui';
import { RecentQuestions, UpcomingSection, type MilestoneEntry, type QuestionEntry } from '@/components/agenda/upcoming';
import { getMilestoneTimestamp, getUpcomingMilestones } from '@/lib/academic';
import { useCourses } from '@/lib/agenda/use-courses';
import type { Course, MilestoneType, Quarter } from '@/types';

type QuarterFilter = 'all' | Quarter;

interface Selection {
  courseId: string;
  tab: SubjectTab;
  composer: boolean;
}

const UPCOMING_LIMIT = 3;

/** Minúsculas y sin tildes, para que «mercadotecnia» encuentre «Mercadotecnía». */
function normalize(value: string): string {
  return value.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function collectUpcoming(courses: Course[], type: MilestoneType): MilestoneEntry[] {
  return courses
    .flatMap((course) => getUpcomingMilestones(course.events).filter((milestone) => milestone.type === type).map((milestone) => ({ course, milestone })))
    .sort((first, second) => getMilestoneTimestamp(first.milestone) - getMilestoneTimestamp(second.milestone));
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3.5 shadow-card">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{icon}</span>
      <div>
        <p className="text-2xl font-extrabold leading-none text-ink">{value}</p>
        <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
      </div>
    </div>
  );
}

export default function Agenda() {
  const { courses, loaded, storageError, addEvent, voteEvent, addTip, addComment } = useCourses();
  const [search, setSearch] = useState('');
  const [quarter, setQuarter] = useState<QuarterFilter>('all');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const selectedCourse = selection ? courses.find((course) => course.id === selection.courseId) ?? null : null;

  const totals = useMemo(
    () => ({
      events: courses.reduce((sum, course) => sum + course.events.length, 0),
      tips: courses.reduce((sum, course) => sum + course.tips.length, 0),
    }),
    [courses],
  );

  const visibleCourses = useMemo(() => {
    const query = normalize(search.trim());
    return courses.filter((course) => {
      const matchesQuarter = quarter === 'all' || course.quarters.includes(quarter);
      const matchesSearch = !query || normalize(`${course.title} ${course.code}`).includes(query);
      return matchesQuarter && matchesSearch;
    });
  }, [courses, quarter, search]);

  const exams = useMemo(() => collectUpcoming(courses, 'exam'), [courses]);
  const deliveries = useMemo(() => collectUpcoming(courses, 'task'), [courses]);
  const questions = useMemo<QuestionEntry[]>(
    () =>
      courses
        .flatMap((course) => course.comments.map((question) => ({ course, question })))
        .sort((first, second) => Date.parse(second.question.date) - Date.parse(first.question.date)),
    [courses],
  );

  const quarterOptions: Array<{ value: QuarterFilter; label: string; count: number }> = [
    { value: 'all', label: 'Todas', count: courses.length },
    { value: 1, label: '1er cuatrimestre', count: courses.filter((course) => course.quarters.includes(1)).length },
    { value: 2, label: '2º cuatrimestre', count: courses.filter((course) => course.quarters.includes(2)).length },
  ];

  const openCourse = (course: Course) => setSelection({ courseId: course.id, tab: 'events', composer: false });
  const chooseCourseForMilestone = (course: Course) => {
    setPickerOpen(false);
    setSelection({ courseId: course.id, tab: 'events', composer: true });
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/access/signout', { method: 'POST' });
    } finally {
      window.location.assign('/acceso');
    }
  };

  const hasUpcoming = exams.length > 0 || deliveries.length > 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
      <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-blue-100/70 bg-[linear-gradient(112deg,#e7efff_0%,#edf2ff_48%,#f5efff_100%)] px-4 py-3 shadow-card sm:px-5">
        <BrandMark />
        <div className="min-w-0">
          <p className="text-base font-extrabold leading-tight tracking-tight text-ink">
            MktHub <span className="text-brand">US</span>
          </p>
          <p className="text-xs font-medium text-slate-500">3º · Marketing</p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {storageError ? (
            <span role="status" className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
              No se puede guardar en este navegador
            </span>
          ) : (
            <span role="status" className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-600">
              <CheckCircle2 className={`h-3.5 w-3.5 ${loaded ? 'text-emerald-600' : 'text-slate-300'}`} aria-hidden="true" />
              {loaded ? 'Guardado en este navegador' : 'Cargando…'}
            </span>
          )}
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Salir
          </button>
        </div>
      </header>

      <section aria-labelledby="agenda-title" className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h1 id="agenda-title" className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Tu curso, <span className="text-brand">más claro.</span>
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Fechas de exámenes y entregas, apuntes de clase y dudas de cada asignatura, en un solo sitio.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={!loaded}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white shadow-sm shadow-blue-200 transition hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Añadir hito
        </button>
      </section>

      <section aria-label="Resumen" className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-4">
        <Metric icon={<CalendarCheck2 className="h-5 w-5" aria-hidden="true" />} label="Hitos" value={totals.events} />
        <Metric icon={<Library className="h-5 w-5" aria-hidden="true" />} label="Asignaturas" value={courses.length} />
        <Metric icon={<NotebookPen className="h-5 w-5" aria-hidden="true" />} label="Apuntes" value={totals.tips} />
      </section>

      {hasUpcoming && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {exams.length > 0 && <UpcomingSection title="Próximos exámenes" items={exams.slice(0, UPCOMING_LIMIT)} total={exams.length} tone="rose" onOpen={openCourse} />}
          {deliveries.length > 0 && <UpcomingSection title="Próximas entregas" items={deliveries.slice(0, UPCOMING_LIMIT)} total={deliveries.length} tone="blue" onOpen={openCourse} />}
        </div>
      )}

      <section aria-labelledby="courses-title" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="courses-title" className="text-lg font-extrabold text-ink">
            Asignaturas
            <span className="ml-2 rounded-md bg-white px-1.5 py-0.5 text-xs font-bold text-slate-600">{visibleCourses.length}</span>
          </h2>
          <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="Filtrar por cuatrimestre">
            {quarterOptions.map((option) => (
              <FilterChip key={String(option.value)} label={option.label} count={option.count} active={quarter === option.value} onClick={() => setQuarter(option.value)} />
            ))}
          </div>
        </div>

        <label className="relative mt-3 block">
          <span className="sr-only">Buscar asignatura</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar asignatura o código" className={`${fieldClass} h-11 bg-white/90 pl-9`} />
        </label>

        {visibleCourses.length > 0 ? (
          <div className="mt-3 space-y-2.5">
            {visibleCourses.map((course) => (
              <CourseRow key={course.id} course={course} onOpen={openCourse} disabled={!loaded} />
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-blue-200 bg-white/70 px-5 py-10 text-center">
            <p className="text-sm font-extrabold text-ink">No hay asignaturas que coincidan</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setQuarter('all');
              }}
              className="mt-2 text-sm font-bold text-brand hover:text-brand-dark"
            >
              Limpiar búsqueda y filtros
            </button>
          </div>
        )}
      </section>

      {questions.length > 0 && (
        <div className="mt-6">
          <RecentQuestions items={questions} onOpen={openCourse} />
        </div>
      )}

      <p className="mt-10 text-center text-xs leading-5 text-slate-500">Guardado en este navegador · aún no sincronizado entre compañeros.</p>

      {pickerOpen && <CoursePicker courses={courses} onChoose={chooseCourseForMilestone} onClose={() => setPickerOpen(false)} />}

      {selection && selectedCourse && (
        <SubjectDrawer
          key={selectedCourse.id}
          course={selectedCourse}
          initialTab={selection.tab}
          startWithComposer={selection.composer}
          onClose={() => setSelection(null)}
          onAddEvent={addEvent}
          onVoteEvent={voteEvent}
          onAddTip={addTip}
          onAddComment={addComment}
        />
      )}
    </div>
  );
}
