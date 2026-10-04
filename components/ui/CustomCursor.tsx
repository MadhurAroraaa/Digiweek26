'use client';

import { useEffect, useRef } from 'react';

/**
 * Cinematic custom cursor for fine-pointer (mouse) devices.
 *
 * Uses direct GPU translate3d styling on the cursor element to eliminate
 * the constant document-wide style recalculations that occur when writing
 * CSS variables to :root on every pointer event.
 */
export function CustomCursor() {
  const orbRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supportsFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!supportsFinePointer) {
      return;
    }

    const orb = orbRef.current;
    if (!orb) return;

    let isVisible = false;

    const handlePointerMove = (event: PointerEvent) => {
      orb.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      if (!isVisible) {
        isVisible = true;
        orb.style.opacity = '1';
      }
    };

    const handlePointerLeave = () => {
      isVisible = false;
      orb.style.opacity = '0';
    };

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target instanceof HTMLElement ? event.target.closest('a, button') : null;
      if (target) {
        document.documentElement.classList.add('cursor-hover');
      }
    };

    const handlePointerOut = (event: PointerEvent) => {
      const nextTarget =
        event.relatedTarget instanceof HTMLElement ? event.relatedTarget.closest('a, button') : null;
      if (!nextTarget) {
        document.documentElement.classList.remove('cursor-hover');
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('pointerover', handlePointerOver, { passive: true });
    window.addEventListener('pointerout', handlePointerOut, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('pointerover', handlePointerOver);
      window.removeEventListener('pointerout', handlePointerOut);
      document.documentElement.classList.remove('cursor-hover');
    };
  }, []);

  return (
    <div ref={orbRef} className="cursor-orb" aria-hidden="true">
      <span />
    </div>
  );
}
