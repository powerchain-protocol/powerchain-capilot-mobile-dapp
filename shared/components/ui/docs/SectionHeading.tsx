import type { ReactNode } from 'react';
export function SectionHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return <header className="section-heading">{eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}<h2>{title}</h2>{children ? <p>{children}</p> : null}</header>;
}
