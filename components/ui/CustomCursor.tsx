'use client';

import { useEffect } from 'react';

export function CustomCursor() {
  useEffect(() => {
    const root = document.documentElement;
    const supportsFinePointer = window.matchMedia('(pointer: fine)').matches;

    if (!supportsFinePointer) {
      return;
    }

    const updatePosition = (event: PointerEvent) => {
      root.style.setProperty('--cursor-x', `${event.clientX}px`);
      root.style.setProperty('--cursor-y', `${event.clientY}px`);
    };

    const markInteractiveTarget = (event: PointerEvent) => {
      const target = event.target instanceof HTMLElement ? event.target.closest('a,button') : null;
      if (target) {
        root.classList.add('cursor-hover');
      }
    };

    const clearInteractiveTarget = (event: PointerEvent) => {
      const nextTarget = event.relatedTarget instanceof HTMLElement ? event.relatedTarget.closest('a,button') : null;
      if (!nextTarget) {
        root.classList.remove('cursor-hover');
      }
    };

    window.addEventListener('pointermove', updatePosition, { passive: true });
    window.addEventListener('pointerover', markInteractiveTarget, { passive: true });
    window.addEventListener('pointerout', clearInteractiveTarget, { passive: true });

    return () => {
      window.removeEventListener('pointermove', updatePosition);
      window.removeEventListener('pointerover', markInteractiveTarget);
      window.removeEventListener('pointerout', clearInteractiveTarget);
      root.classList.remove('cursor-hover');
    };
  }, []);

  return (
    <div className="cursor-orb" aria-hidden="true">
      <span />
    </div>
  );
}
