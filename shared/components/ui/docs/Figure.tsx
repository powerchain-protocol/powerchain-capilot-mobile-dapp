import type { ReactNode } from 'react';

export function Figure({ src, alt, caption, className = '' }: { src: string; alt: string; caption: ReactNode; className?: string }) {
  return (
    <figure className={`figure ${className}`}>
      <div className="figure__frame"><img src={src} alt={alt} /></div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
