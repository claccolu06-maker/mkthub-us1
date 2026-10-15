'use client';

import { Lightbulb, Plus, Search, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { EmptyPanel, FilterChip, fieldClass, labelClass, textareaClass } from '@/components/agenda/ui';
import { formatDateTime } from '@/lib/academic';
import { createId } from '@/lib/id';
import type { ClassTip, ClassTipKind, Course } from '@/types';

type TipFilter = 'all' | ClassTipKind | 'uncategorized';
type SortOrder = 'newest' | 'oldest';

const TIP_KINDS: Array<{ value: ClassTipKind; label: string; plural: string }> = [
  { value: 'notice', label: 'Aviso', plural: 'Avisos' },
  { value: 'clarification', label: 'Aclaración', plural: 'Aclaraciones' },
  { value: 'heard-in-class', label: 'Escuchado en clase', plural: 'Escuchado en clase' },
];

const PALETTE: Record<ClassTipKind, { surface: string; badge: string; active: string }> = {
  notice: { surface: 'border-amber-100 bg-[#fff9ed]', badge: 'bg-amber-100 text-amber-900', active: 'border-amber-200 bg-amber-50 text-amber-900' },
  clarification: { surface: 'border-violet-100 bg-[#f7f3ff]', badge: 'bg-violet-100 text-violet-900', active: 'border-violet-200 bg-violet-50 text-violet-900' },
  'heard-in-class': { surface: 'border-emerald-100 bg-[#eff9f4]', badge: 'bg-emerald-100 text-emerald-900', active: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
};
const NEUTRAL = { surface: 'border-blue-100 bg-[#f2f6ff]', badge: 'bg-blue-100 text-blue-900', active: 'border-blue-200 bg-blue-50 text-blue-900' };

const palette = (kind?: ClassTipKind) => (kind ? PALETTE[kind] : NEUTRAL);
const kindLabel = (kind?: ClassTipKind) => TIP_KINDS.find((option) => option.value === kind)?.label ?? 'Sin clasificar';

export default function TipsPanel({ course, startOpen, onAddTip }: { course: Course; startOpen: boolean; onAddTip: (courseId: string, tip: ClassTip) => void }) {
  const [composerOpen, setComposerOpen] = useState(startOpen);
  const [filter, setFilter] = useState<TipFilter>('all');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [kind, setKind] = useState<ClassTipKind>('heard-in-class');
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    return [...course.tips]
      .filter((tip) => {
        const matchesType = filter === 'all' || (filter === 'uncategorized' ? !tip.kind : tip.kind === filter);
        const matchesSearch = !query || `${tip.text} ${tip.user}`.toLocaleLowerCase('es').includes(query);
        return matchesType && matchesSearch;
      })
      .sort((first, second) => {
        const difference = Date.parse(first.date) - Date.parse(second.date);
        return sortOrder === 'newest' ? -difference : difference;
      });
  }, [course.tips, filter, search, sortOrder]);

  const groups = useMemo(() => {
    const defs: Array<{ value: Exclude<TipFilter, 'all'>; label: string }> = [
      ...TIP_KINDS.map((option) => ({ value: option.value, label: option.plural })),
      { value: 'uncategorized', label: 'Sin clasificar' },
    ];
    return defs
      .map((group) => ({ ...group, tips: visible.filter((tip) => (group.value === 'uncategorized' ? !tip.kind : tip.kind === group.value)) }))
      .filter((group) => group.tips.length > 0);
  }, [visible]);

  const uncategorized = course.tips.filter((tip) => !tip.kind).length;
  const filterOptions: Array<{ value: TipFilter; label: string; count: number }> = [
    { value: 'all', label: 'Todos', count: course.tips.length },
    ...TIP_KINDS.map((option) => ({ value: option.value, label: option.label, count: course.tips.filter((tip) => tip.kind === option.value).length })),
    ...(uncategorized > 0 ? [{ value: 'uncategorized' as const, label: 'Sin tipo', count: uncategorized }] : []),
  ];
  const hasFilters = filter !== 'all' || search.trim().length > 0;

  const openComposer = () => {
    if (filter !== 'all' && filter !== 'uncategorized') setKind(filter);
    setComposerOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) return;

    onAddTip(course.id, { id: createId(), user: author.trim() || 'Anónimo', text: cleanText, kind, date: new Date().toISOString() });
    setText('');
    setAuthor('');
    setFilter(kind);
    setSearch('');
    setKind('heard-in-class');
    setComposerOpen(false);
  };

  return (
    <section id="subject-panel-tips" role="tabpanel" aria-labelledby="subject-tab-tips">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-ink">Apuntes de clase</h3>
          <p className="mt-0.5 text-sm text-slate-600">Avisos, aclaraciones y cosas escuchadas.</p>
        </div>
        {!composerOpen && (
          <button type="button" onClick={openComposer} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-dark">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Añadir apunte
          </button>
        )}
      </div>

      {course.tips.length > 0 && (
        <div className="mb-3 space-y-2.5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <label className="relative block min-w-0">
              <span className="sr-only">Buscar en apuntes</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en apuntes" className={`${fieldClass} pl-9`} />
            </label>
            <label>
              <span className="sr-only">Ordenar apuntes</span>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className={`${fieldClass} w-auto`}>
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
              </select>
            </label>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtrar apuntes por tipo">
            {filterOptions.map((option) => (
              <FilterChip key={option.value} label={option.label} count={option.count} active={filter === option.value} onClick={() => setFilter(option.value)} />
            ))}
          </div>
        </div>
      )}

      {composerOpen && (
        <form onSubmit={handleSubmit} className={`mb-4 rounded-2xl border p-4 shadow-card ${PALETTE[kind].surface}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-extrabold text-ink">¿Qué quieres guardar?</h4>
            <button type="button" onClick={() => setComposerOpen(false)} aria-label="Cerrar formulario" className="rounded-lg p-1.5 text-slate-500 hover:bg-white">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Tipo de apunte">
            {TIP_KINDS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={kind === option.value}
                onClick={() => setKind(option.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-extrabold transition ${kind === option.value ? PALETTE[option.value].active : 'border-slate-200 bg-white/75 text-slate-600 hover:bg-white'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mb-3">
            <label htmlFor="tip-text" className={labelClass}>Nota de clase</label>
            <textarea id="tip-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} required rows={4} placeholder="Escribe una nota breve para tus compañeros…" className={textareaClass} />
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="tip-author" className={labelClass}>Nombre (opcional)</label>
              <input id="tip-author" value={author} onChange={(event) => setAuthor(event.target.value)} maxLength={100} placeholder="Anónimo" className={fieldClass} />
            </div>
            <button type="submit" className="h-10 rounded-lg bg-brand px-4 text-sm font-extrabold text-white hover:bg-brand-dark">Publicar</button>
          </div>
        </form>
      )}

      {groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => {
            const groupPalette = palette(group.value === 'uncategorized' ? undefined : group.value);
            return (
              <section key={group.value} aria-label={`${group.label}: ${group.tips.length}`} className={`rounded-2xl border p-2.5 ${groupPalette.surface}`}>
                <div className="flex items-center justify-between gap-2 px-1 py-0.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-extrabold ${groupPalette.badge}`}>
                    <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                    {group.label}
                  </span>
                  <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-xs font-bold text-slate-600">{group.tips.length}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {group.tips.map((tip) => (
                    <article key={tip.id} className="rounded-xl border border-white/90 bg-white/75 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-extrabold ${palette(tip.kind).badge}`}>
                          <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                          {kindLabel(tip.kind)}
                        </span>
                        <time dateTime={tip.date} className="text-xs text-slate-500">{formatDateTime(tip.date)}</time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{tip.text}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">{tip.user}</p>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : course.tips.length > 0 && hasFilters ? (
        <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 px-5 py-9 text-center">
          <p className="text-sm font-extrabold text-ink">No hay apuntes que coincidan</p>
          <p className="mt-1 text-sm text-slate-600">Prueba otro tipo de apunte o cambia la búsqueda.</p>
          <button type="button" onClick={() => { setFilter('all'); setSearch(''); }} className="mt-2 text-sm font-bold text-brand hover:text-brand-dark">Limpiar filtros</button>
        </div>
      ) : (
        <EmptyPanel tone="amber" icon={<Lightbulb className="h-5 w-5" aria-hidden="true" />} title="Sin apuntes todavía" description="Guarda un aviso, una aclaración o algo que se haya comentado en clase." />
      )}
    </section>
  );
}
