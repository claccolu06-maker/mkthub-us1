'use client';

import { useCallback, useEffect, useState } from 'react';
import { COURSES_STORAGE_KEY, createEmptyCourses, parseStoredCourses } from '@/lib/course-storage';
import type { ClassTip, Comment, Course, Milestone } from '@/types';

/**
 * Estado de la agenda con persistencia en localStorage (por navegador; aún no se comparte entre compañeros).
 * Lee al montar, guarda en cada cambio y sincroniza entre pestañas abiertas.
 */
export function useCourses() {
  const [courses, setCourses] = useState<Course[]>(() => createEmptyCourses());
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      setCourses(parseStoredCourses(window.localStorage.getItem(COURSES_STORAGE_KEY)));
    } catch {
      setCourses(createEmptyCourses());
      setStorageError(true);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [courses, loaded]);

  useEffect(() => {
    const syncFromOtherTab = (event: StorageEvent) => {
      if (event.key !== COURSES_STORAGE_KEY) return;
      const next = parseStoredCourses(event.newValue);
      setCourses((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    };
    window.addEventListener('storage', syncFromOtherTab);
    return () => window.removeEventListener('storage', syncFromOtherTab);
  }, []);

  const updateCourse = useCallback((courseId: string, update: (course: Course) => Course) => {
    setCourses((current) => current.map((course) => (course.id === courseId ? update(course) : course)));
  }, []);

  const addEvent = useCallback(
    (courseId: string, event: Milestone) => updateCourse(courseId, (course) => ({ ...course, events: [...course.events, event] })),
    [updateCourse],
  );

  const voteEvent = useCallback(
    (courseId: string, eventId: string) =>
      updateCourse(courseId, (course) => ({
        ...course,
        events: course.events.map((event) => (event.id === eventId ? { ...event, votes: event.votes + 1 } : event)),
      })),
    [updateCourse],
  );

  const addTip = useCallback(
    (courseId: string, tip: ClassTip) => updateCourse(courseId, (course) => ({ ...course, tips: [...course.tips, tip] })),
    [updateCourse],
  );

  const addComment = useCallback(
    (courseId: string, comment: Comment) => updateCourse(courseId, (course) => ({ ...course, comments: [...course.comments, comment] })),
    [updateCourse],
  );

  return { courses, loaded, storageError, addEvent, voteEvent, addTip, addComment };
}
