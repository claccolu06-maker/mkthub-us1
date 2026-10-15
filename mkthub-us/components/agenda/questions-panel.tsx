'use client';

import { MessageCircle, Plus, Search, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { EmptyPanel, fieldClass, labelClass, textareaClass } from '@/components/agenda/ui';
import { formatDateTime } from '@/lib/academic';
import { createId } from '@/lib/id';
import type { Comment, Course } from '@/types';

type SortOrder = 'newest' | 'oldest';

export default function QuestionsPanel({ course, startOpen, onAddComment }: { course: Course; startOpen: boolean; onAddComment: (courseId: string, comment: Comment) => void }) {
  const [composerOpen, setComposerOpen] = useState(startOpen);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    return [...course.comments]
      .filter((question) => !query || `${question.text} ${question.user}`.toLocaleLowerCase('es').includes(query))
      .sort((first, second) => {
        const difference = Date.parse(first.date) - Date.parse(second.date);
        return sortOrder === 'newest' ? -difference : difference;
      });
  }, [course.comments, search, sortOrder]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) return;

    onAddComment(course.id, { id: createId(), user: author.trim() || 'Anónimo', text: cleanText, date: new Date().toISOString() });
    setText('');
    setAuthor('');
    setSearch('');
    setSortOrder('newest');
    setComposerOpen(false);
  };

  return (
    <section id="subject-panel-questions" role="tabpanel" aria-labelledby="subject-tab-questions">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-ink">Dudas</h3>
          <p className="mt-0.5 text-sm text-slate-600">Pregunta y comparte respuestas.</p>
        </div>
        {!composerOpen && (
          <button type="button" onClick={() => setComposerOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-700 px-3.5 py-2.5 text-sm font-extrabold text-white transition hover:bg-violet-800">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva duda
          </button>
        )}
      </div>

      {course.comments.length > 0 && (
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <label className="relative block min-w-0">
            <span className="sr-only">Buscar en dudas</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en dudas" className={`${fieldClass} pl-9`} />
          </label>
          <label>
            <span className="sr-only">Ordenar dudas</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className={`${fieldClass} w-auto`}>
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguas</option>
            </select>
          </label>
        </div>
      )}

      {composerOpen && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-2xl border border-violet-100 bg-[#f6f2ff] p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-extrabold text-ink">Nueva duda</h4>
            <button type="button" onClick={() => setComposerOpen(false)} aria-label="Cerrar formulario" className="rounded-lg p-1.5 text-slate-500 hover:bg-white">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mb-3">
            <label htmlFor="question-text" className={labelClass}>Tu pregunta</label>
            <textarea id="question-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} required rows={4} placeholder="¿Qué necesitas aclarar?" className={textareaClass} />
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="question-author" className={labelClass}>Nombre (opcional)</label>
              <input id="question-author" value={author} onChange={(event) => setAuthor(event.target.value)} maxLength={100} placeholder="Anónimo" className={fieldClass} />
            </div>
            <button type="submit" className="h-10 rounded-lg bg-violet-700 px-4 text-sm font-extrabold text-white hover:bg-violet-800">Publicar</button>
          </div>
        </form>
      )}

      {visible.length > 0 ? (
        <div className="space-y-2.5">
          {visible.map((question) => (
            <article key={question.id} className="rounded-2xl border border-violet-100 bg-[#fbf9ff] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold text-ink">{question.user}</span>
                <time dateTime={question.date} className="text-xs text-slate-500">{formatDateTime(question.date)}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{question.text}</p>
            </article>
          ))}
        </div>
      ) : course.comments.length > 0 && search.trim() ? (
        <div className="rounded-2xl border border-dashed border-violet-200 bg-white/75 px-5 py-9 text-center">
          <p className="text-sm font-extrabold text-ink">No hay dudas que coincidan</p>
          <button type="button" onClick={() => setSearch('')} className="mt-2 text-sm font-bold text-violet-700 hover:text-violet-900">Limpiar búsqueda</button>
        </div>
      ) : (
        <EmptyPanel tone="violet" icon={<MessageCircle className="h-5 w-5" aria-hidden="true" />} title="No hay dudas todavía" description="Deja la primera pregunta sobre esta asignatura." />
      )}
    </section>
  );
}
