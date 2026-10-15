import { courses } from '@/lib/catalog';
import type { ClassTip, ClassTipKind, Comment, Course, Milestone, MilestoneType } from '@/types';

/** Misma clave que la versión anterior: lo que ya esté guardado en el navegador se sigue leyendo. */
export const COURSES_STORAGE_KEY = 'mkthub_us_courses_v1';

const MAX_ITEMS_PER_COURSE = 300;
const MAX_TEXT_LENGTH = 4_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: unknown, maxLength = MAX_TEXT_LENGTH): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}

function readDate(value: unknown): string | null {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
}

function normalizeMilestone(value: unknown): Milestone | null {
  if (!isRecord(value)) return null;

  const id = readText(value.id, 120);
  const title = readText(value.title, 180);
  const date = readDate(value.date);
  const type = value.type;
  if (!id || !title || !date || (type !== 'exam' && type !== 'task')) return null;

  const votes = typeof value.votes === 'number' && Number.isFinite(value.votes) ? Math.max(0, Math.floor(value.votes)) : 0;
  const examSubtype = value.examSubtype === 'partial' || value.examSubtype === 'final' ? value.examSubtype : undefined;

  return {
    id,
    type: type as MilestoneType,
    ...(type === 'exam' && examSubtype ? { examSubtype } : {}),
    title,
    date,
    classroom: typeof value.classroom === 'string' ? value.classroom.slice(0, 160).trim() : '',
    votes,
  };
}

function normalizeTip(value: unknown): ClassTip | null {
  if (!isRecord(value)) return null;
  const id = readText(value.id, 120);
  const text = readText(value.text);
  const date = readDate(value.date);
  if (!id || !text || !date) return null;

  const kind: ClassTipKind | undefined =
    value.kind === 'notice' || value.kind === 'clarification' || value.kind === 'heard-in-class' ? value.kind : undefined;

  return { id, text, date, user: readText(value.user, 100) ?? 'Anónimo', ...(kind ? { kind } : {}) };
}

function normalizeComment(value: unknown): Comment | null {
  if (!isRecord(value)) return null;
  const id = readText(value.id, 120);
  const text = readText(value.text);
  const date = readDate(value.date);
  if (!id || !text || !date) return null;

  return { id, text, date, user: readText(value.user, 100) ?? 'Anónimo' };
}

function normalizeList<T>(value: unknown, normalize: (entry: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];

  const result: T[] = [];
  for (const entry of value) {
    if (result.length >= MAX_ITEMS_PER_COURSE) break;
    const normalized = normalize(entry);
    if (normalized) result.push(normalized);
  }
  return result;
}

/** Copia nueva del catálogo oficial, sin aportaciones. */
export function createEmptyCourses(): Course[] {
  return courses.map((course) => ({
    ...course,
    quarters: [...course.quarters],
    events: [],
    tips: [],
    comments: [],
  }));
}

/**
 * Lee solo las aportaciones (hitos, apuntes y dudas) de las nueve asignaturas oficiales.
 * Nombre, código, cuatrimestre y colores salen siempre del catálogo.
 * Cada guardado se asigna a su asignatura por id y, si el id no coincide, por código (DV1-US…).
 */
export function parseStoredCourses(rawValue: string | null): Course[] {
  if (!rawValue) return createEmptyCourses();

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return createEmptyCourses();

    const savedById = new Map<string, Record<string, unknown>>();
    const savedByCode = new Map<string, Record<string, unknown>>();
    for (const entry of parsed) {
      if (!isRecord(entry)) continue;
      if (typeof entry.id === 'string') savedById.set(entry.id, entry);
      if (typeof entry.code === 'string') savedByCode.set(entry.code, entry);
    }

    return createEmptyCourses().map((course) => {
      const saved = savedById.get(course.id) ?? savedByCode.get(course.code);
      if (!saved) return course;

      return {
        ...course,
        events: normalizeList(saved.events, normalizeMilestone),
        tips: normalizeList(saved.tips, normalizeTip),
        comments: normalizeList(saved.comments, normalizeComment),
      };
    });
  } catch {
    return createEmptyCourses();
  }
}
