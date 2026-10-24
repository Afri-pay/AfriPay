import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import { themeBootScript } from '@/lib/theme';
import '../styles/globals.css';

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'AfriPay', template: '%s · AfriPay' },
  description: 'A Stellar wallet for cross-border payments across Africa. Testnet preview.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f6f6f3' }, { media: '(prefers-color-scheme: dark)', color: '#111311' }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nonces must be rendered for each request, never reused from static HTML.
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head><script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeBootScript }} /></head>
      <body><WalletProvider>{children}</WalletProvider></body>
    </html>
  );
}
