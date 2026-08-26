import Link from 'next/link';
import { ArchitectureFigure } from '../../../components/docs/ArchitectureFigure';
import { MockupGallery } from '../../../components/docs/MockupGallery';
import { DocCard } from '../../../shared/components/ui/docs/DocCard';
import { Metric } from '../../../shared/components/ui/docs/Metric';
import { SectionHeading } from '../../../shared/components/ui/docs/SectionHeading';
import { ArrowIcon, EnergyIcon, LedgerIcon, PhoneIcon, ShieldIcon, SparkIcon } from '../../../shared/ui/icons';

export default function HomePage() {
  return <>
    <section className="hero"><div className="hero__copy"><div className="eyebrow">PowerChain Copilot · Mobile v1.0.0</div><h1>AI operations for renewable infrastructure, with evidence and execution controls built in.</h1><p>Technical documentation for the PowerChain mobile operator experience: Copilot, renewable RWA workflows, PWRC credits, Solana settlement and human approval.</p><div className="hero__actions"><Link className="button button--dark button--large" href="/mobile">Explore mobile UX <ArrowIcon size={18}/></Link><a className="button button--outline button--large" href="/assets/powerchain-copilot-mobile-whitepaper.pdf">Download whitepaper</a></div><div className="hero__metrics"><Metric label="PWRC decimals" value="9"/><Metric label="Copilot response" value="10,000 PWRC"/><Metric label="Execution" value="Human approved"/></div></div><div className="hero__visual"><img src="/images/mockups/onboarding-device.webp" alt="PowerChain Copilot mobile onboarding device mockup" /></div></section>

    <section className="section"><SectionHeading eyebrow="Product model" title="One operator surface, four trust boundaries">The interface separates AI assistance from evidence, approval, wallet signing and settlement.</SectionHeading><div className="card-grid"><DocCard icon={<SparkIcon/>} title="Copilot"><p>Chat, prompts and suggestions coordinate research and analysis while grounding responses in authenticated context.</p></DocCard><DocCard icon={<EnergyIcon/>} title="Operational evidence"><p>Energy readings, asset state and RWA evidence remain authoritative inputs rather than invented AI telemetry.</p></DocCard><DocCard icon={<ShieldIcon/>} title="Human approval"><p>High-impact actions move through review and approval before any wallet-signable transaction exists.</p></DocCard><DocCard icon={<LedgerIcon/>} title="PWRC accounting"><p>Integer base-unit accounting, deterministic quotes and append-only ledgers make usage auditable.</p></DocCard></div></section>

    <section className="section section--soft"><SectionHeading eyebrow="Mobile experience" title="Designed for operator decisions, not dashboard density">The app prioritizes the next decision, the evidence behind it and the exact execution boundary.</SectionHeading><MockupGallery /></section>
    <section className="section"><SectionHeading eyebrow="Architecture" title="Agents prepare work. Operators authorize impact."/><ArchitectureFigure /><div className="center-link"><Link href="/architecture">Read the architecture model <ArrowIcon size={17}/></Link></div></section>
    <section className="section section--dark"><div><div className="eyebrow eyebrow--light">Documentation set</div><h2>Product, protocol and security references in one place.</h2><p>Use the documentation app for implementation detail and the PDF whitepaper for review, governance and stakeholder circulation.</p></div><div className="dark-links"><Link href="/operations"><EnergyIcon/>EMS / IoT / DePIN</Link><Link href="/credits"><LedgerIcon/>PWRC Credit Kernel</Link><Link href="/security"><ShieldIcon/>Security & approvals</Link><Link href="/mobile"><PhoneIcon/>Mobile UX</Link></div></section>
  </>;
}
