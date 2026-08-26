import type { Metadata } from 'next';
import './globals.css';
import { DocsHeader } from '../../../components/docs/DocsHeader';
import { DocsFooter } from '../../../components/docs/DocsFooter';

export const metadata: Metadata = {
  title: { default: 'PowerChain Copilot Documentation', template: '%s | PowerChain Copilot' },
  description: 'Product, architecture, PWRC credit and security documentation for PowerChain Copilot mobile.',
  icons: { icon: [{ url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' }], apple: '/icons/apple-touch-icon.png' },
  manifest: '/site.webmanifest',
  themeColor: '#06241B',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><DocsHeader /><main>{children}</main><DocsFooter /></body></html>;
}
