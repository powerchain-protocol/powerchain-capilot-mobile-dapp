import type { ReactNode } from 'react';

export function DocCard({ icon, eyebrow, title, children }: { icon?: ReactNode; eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <article className="doc-card">
      {icon ? <div className="doc-card__icon" aria-hidden>{icon}</div> : null}
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <h3>{title}</h3>
      <div className="doc-card__body">{children}</div>
    </article>
  );
}
