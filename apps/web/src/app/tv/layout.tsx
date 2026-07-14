import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Melli Exchange — Live Rates',
  robots: { index: false, follow: false },
};

export default function TVLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Hard reload every 5 minutes — keeps TV displays fresh even if JS stalls */}
        <meta httpEquiv="refresh" content="300" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#04060f', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
