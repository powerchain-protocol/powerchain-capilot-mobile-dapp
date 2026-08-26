import type { ReactNode } from 'react';
export function Callout({ title, children, tone = 'green' }: { title: string; children: ReactNode; tone?: 'green' | 'neutral' | 'warning' }) {
  return <aside className={`callout callout--${tone}`}><strong>{title}</strong><div>{children}</div></aside>;
}
