import type { Metadata } from 'next';
import { headers } from 'next/headers';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'AfriPay',
  description: 'Send money home instantly, across Africa.',
  manifest: '/manifest.json',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nonces must be rendered for each request, never reused from static HTML.
  await headers();
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
