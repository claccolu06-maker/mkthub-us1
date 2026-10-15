'use client';

import { ChevronRight, X } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useModal } from '@/lib/agenda/use-modal';
import type { Course } from '@/types';

/** Ventana para elegir la asignatura antes de añadir un hito. */
export default function CoursePicker({ courses, onChoose, onClose }: { courses: Course[]; onChoose: (course: Course) => void; onClose: () => void }) {
  const dialogRef = useModal<HTMLElement>(onClose);

  const closeOnBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#172544]/35 p-4 backdrop-blur-[2px]" onMouseDown={closeOnBackdrop}>
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-picker-title"
        className="flex max-h-[85vh] w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border border-blue-100 bg-[#f7f9fe] shadow-2xl outline-none"
      >
        <header className="flex items-center justify-between gap-3 border-b border-blue-100 px-5 py-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-blue-700">Nuevo hito</p>
            <h2 id="course-picker-title" className="mt-0.5 text-lg font-extrabold text-ink">
              ¿De qué asignatura es?
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-800">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="overflow-y-auto p-3">
          {courses.map((course) => (
            <button key={course.id} type="button" onClick={() => onChoose(course)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white">
              <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-slate-700" style={{ backgroundColor: course.badgeBg }}>
                {course.code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-ink">{course.title}</span>
                <span className="mt-0.5 block text-xs text-slate-600">{course.quarters.map((quarter) => `${quarter}º`).join(' y ')} cuatrimestre</span>
              </span>
              <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
            </button>
          ))}
        </div>

        <footer className="border-t border-blue-100 px-5 py-3 text-xs text-slate-500">El hito aparecerá en la asignatura que elijas.</footer>
      </section>
    </div>
  );
}
