export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const linearSupported = typeof CSS !== 'undefined' && CSS.supports('animation-timing-function', 'linear(0, 1)');

// Spring curves sampled into linear() so WAAPI animations settle like Tahoe's fluid motion.
export const SPRING = linearSupported
  ? 'linear(0, 0.009 1%, 0.035 2.1%, 0.141 4.4%, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017 19.4%, 1.061 22.3%, 1.071 25.6%, 1.056 30.2%, 1.018 38.1%, 1.001 45.2%, 0.995 52.8%, 1)'
  : 'cubic-bezier(0.2, 0.9, 0.2, 1.06)';

export const SPRING_SOFT = linearSupported
  ? 'linear(0, 0.022 1.6%, 0.087 3.4%, 0.316 8.1%, 0.577 13.2%, 0.781 18.5%, 0.904 23.7%, 0.975 29.5%, 1.009 36%, 1.019 43.7%, 1.006 60%, 1)'
  : 'cubic-bezier(0.2, 0.85, 0.25, 1)';
