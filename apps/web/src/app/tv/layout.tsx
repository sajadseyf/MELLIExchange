import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Melli Exchange — Live Rates',
  robots: { index: false, follow: false },
};

export default function TVLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#04060f', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
