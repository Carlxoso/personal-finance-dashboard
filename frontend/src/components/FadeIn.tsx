import { useEffect, useState, type ReactNode } from 'react';

/** Aparece suavemente al montarse. */
export function FadeIn({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return <div className={`transition-opacity duration-700 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}>{children}</div>;
}
