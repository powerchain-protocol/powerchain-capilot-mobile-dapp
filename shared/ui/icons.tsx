import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export function SparkIcon({ size = 20, ...props }: IconProps) { return <svg {...base(size)} {...props}><path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>; }
export function ShieldIcon({ size = 20, ...props }: IconProps) { return <svg {...base(size)} {...props}><path d="M12 3 5 6v5c0 4.8 2.7 8 7 10 4.3-2 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>; }
export function WalletIcon({ size = 20, ...props }: IconProps) { return <svg {...base(size)} {...props}><path d="M4 6.5h14a2 2 0 0 1 2 2v9H5a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2h12"/><path d="M16 11h5v4h-5a2 2 0 1 1 0-4Z"/></svg>; }
export function EnergyIcon({ size = 20, ...props }: IconProps) { return <svg {...base(size)} {...props}><path d="m13 2-8 12h6l-1 8 9-13h-6V2Z"/></svg>; }
export function NetworkIcon({ size = 20, ...props }: IconProps) { return <svg {...base(size)} {...props}><circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M12 7v4M6.5 16.5 11 12m6.5 4.5L13 12"/></svg>; }
export function LedgerIcon({ size = 20, ...props }: IconProps) { return <svg {...base(size)} {...props}><path d="M5 3h14v18H5z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>; }
export function PhoneIcon({ size = 20, ...props }: IconProps) { return <svg {...base(size)} {...props}><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 5h4M11 19h2"/></svg>; }
export function ArrowIcon({ size = 20, ...props }: IconProps) { return <svg {...base(size)} {...props}><path d="M5 12h14M14 7l5 5-5 5"/></svg>; }
export function CheckIcon({ size = 20, ...props }: IconProps) { return <svg {...base(size)} {...props}><path d="m5 12 4 4L19 6"/></svg>; }
export function BookIcon({ size = 20, ...props }: IconProps) { return <svg {...base(size)} {...props}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z"/><path d="M4 19a2 2 0 0 1 2-2h14"/></svg>; }
export function ExternalIcon({ size = 20, ...props }: IconProps) { return <svg {...base(size)} {...props}><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H5V6h6"/></svg>; }
export function MenuIcon({ size = 20, ...props }: IconProps) { return <svg {...base(size)} {...props}><path d="M4 7h16M4 12h16M4 17h16"/></svg>; }
