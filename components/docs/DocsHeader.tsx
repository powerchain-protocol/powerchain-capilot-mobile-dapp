import Link from 'next/link';
import { PowerChainLogo } from '../../shared/ui/logo';
import { BookIcon, ExternalIcon } from '../../shared/ui/icons';

export function DocsHeader() {
  return <header className="site-header"><div className="site-header__inner"><Link href="/" className="brand-link" aria-label="PowerChain Copilot documentation"><PowerChainLogo /></Link><nav className="site-nav" aria-label="Primary"><Link href="/mobile">Mobile</Link><Link href="/architecture">Architecture</Link><Link href="/operations">Operations</Link><Link href="/credits">PWRC Credits</Link><Link href="/security">Security</Link><Link href="/references">References</Link></nav><div className="header-actions"><a href="/assets/powerchain-copilot-mobile-whitepaper.pdf" className="button button--subtle"><BookIcon size={17}/> PDF</a><a href="https://explorer.solana.com/address/PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc" className="button button--dark" target="_blank" rel="noreferrer">PWRC <ExternalIcon size={16}/></a></div></div></header>;
}
