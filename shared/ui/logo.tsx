import type { CSSProperties } from 'react';

type LogoProps = {
  compact?: boolean;
  inverse?: boolean;
  size?: number;
  style?: CSSProperties;
};

export function PowerChainLogo({ compact = false, inverse = false, size = 38, style }: LogoProps) {
  const textColor = inverse ? '#ffffff' : '#10231a';
  const muted = inverse ? '#cfe0d6' : '#68766f';
  const src = inverse ? '/images/brand/logo-light.png' : '/images/brand/logo-dark.png';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, ...style }}>
      <img src={src} alt="" aria-hidden="true" width={size} height={size} style={{ objectFit: 'contain', display: 'block' }} />
      {!compact ? (
        <span style={{ display: 'grid', lineHeight: 1 }}>
          <span style={{ color: textColor, fontSize: 16, letterSpacing: '-0.02em' }}><b style={{ fontWeight: 700 }}>Power</b><span style={{ fontWeight: 400 }}>Chain</span></span>
          <span style={{ color: muted, fontSize: 10, marginTop: 5, fontWeight: 700, letterSpacing: '0.18em' }}>COPILOT</span>
        </span>
      ) : null}
    </span>
  );
}
