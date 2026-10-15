import type { Course, Milestone } from '@/types';

export function getMilestoneTimestamp(milestone: Milestone): number {
  return new Date(milestone.date).getTime();
}

export function getMilestoneLabel(milestone: Milestone): string {
  if (milestone.type === 'task') return 'Entrega';
  if (milestone.examSubtype === 'partial') return 'Parcial';
  if (milestone.examSubtype === 'final') return 'Examen final';
  return 'Examen';
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function sortMilestonesByDate(milestones: Milestone[]): Milestone[] {
  return [...milestones].sort((first, second) => getMilestoneTimestamp(first) - getMilestoneTimestamp(second));
}

export function getUpcomingMilestones(milestones: Milestone[], now = Date.now()): Milestone[] {
  return sortMilestonesByDate(milestones).filter((milestone) => getMilestoneTimestamp(milestone) >= now);
}

function toGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function getGoogleCalendarUrl(course: Course, milestone: Milestone): string {
  const start = new Date(milestone.date);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const parameters = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${course.title} · ${milestone.title}`,
    dates: `${toGoogleCalendarDate(start)}/${toGoogleCalendarDate(end)}`,
    details: `${getMilestoneLabel(milestone)} de ${course.title} (${course.code}) · MktHub US`,
  });
  if (milestone.classroom) parameters.set('location', milestone.classroom);
  return `https://calendar.google.com/calendar/render?${parameters.toString()}`;
}
