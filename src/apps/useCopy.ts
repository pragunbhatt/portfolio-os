import { useEffect, useRef, useState } from 'react';

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return { copied, copy };
}

export function useInView<T extends HTMLElement>(options?: { threshold?: number }) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const root = node.closest('.app-scroll') as HTMLElement | null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { root, threshold: options?.threshold ?? 0.35 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [options?.threshold]);
  return { ref, inView };
}
