'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento de ventana modal accesible: foco dentro mientras está abierta, Escape cierra,
 * se bloquea el scroll del fondo y al cerrar el foco vuelve al botón que la abrió.
 * Devuelve la referencia que hay que poner en el contenedor (con tabIndex={-1}).
 */
export function useModal<T extends HTMLElement>(onClose: () => void) {
  const containerRef = useRef<T>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    container?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !container) return;

      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => element.offsetParent !== null);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return containerRef;
}
