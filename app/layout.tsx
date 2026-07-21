import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Claim Guardian',
  description: 'Check whether your insurance claim denial or delay violated the law.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
