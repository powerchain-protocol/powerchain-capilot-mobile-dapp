import { SectionHeading } from '../../../../shared/components/ui/docs/SectionHeading';
import { ExternalIcon } from '../../../../shared/ui/icons';
export const metadata = { title: 'References' };
const refs = [
  ['Expo SDK reference', 'https://docs.expo.dev/versions/latest/', 'SDK 57 / React Native compatibility and platform requirements.'],
  ['Expo project creation', 'https://docs.expo.dev/get-started/create-a-project/', 'Current create-expo-app guidance and SDK 57 template.'],
  ['Solana Pay', 'https://docs.solanapay.com/', 'Payment protocol and wallet integration guidance.'],
  ['Solana Pay specification', 'https://github.com/solana-labs/solana-pay/blob/master/SPEC.md', 'Transfer-request fields and verification expectations.'],
  ['Solana Token Extensions', 'https://solana.com/docs/tokens/extensions', 'Token-2022 extension model.'],
  ['OWASP MASVS', 'https://mas.owasp.org/MASVS/', 'Mobile application security verification baseline.'],
];
export default function ReferencesPage() { return <article className="docs-page"><SectionHeading eyebrow="References" title="External standards and implementation sources">External references complement the canonical PowerChain source configuration and repository documentation.</SectionHeading><div className="reference-list">{refs.map(([title,url,desc]) => <a key={url} href={url} target="_blank" rel="noreferrer"><div><strong>{title}</strong><p>{desc}</p></div><ExternalIcon/></a>)}</div><div className="prose"><h2>PowerChain source references</h2><ul><li><code>src/constants/pwrc.ts</code> — canonical mobile PWRC identity and credit constants.</li><li><code>server/credits/*</code> — quote, reservation, ledger and top-up domain logic.</li><li><code>server/payment-kernel/verify.ts</code> — authenticated settlement boundary.</li><li><code>docs/PWRC_CREDITS.md</code> — implementation notes and invariants.</li></ul></div></article>; }
