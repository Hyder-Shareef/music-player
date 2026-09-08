import { useEffect, useRef } from 'react';

/**
 * useCursorLight
 * Dynamically binds mouse coordinates to CSS custom properties (--mouse-x, --mouse-y)
 * on a container element for reactive specular glass highlights (Luminescent / React Glass UI).
 */
export function useCursorLight<T extends HTMLElement>() {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);
    };

    el.addEventListener('mousemove', handleMouseMove);
    return () => el.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return elementRef;
}
