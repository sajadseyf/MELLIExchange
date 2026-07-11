import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Melli Exchange — Digital Card',
  description: 'Currency Exchange & Gold Jewelry · Coquitlam, BC · FINTRAC Registered',
};

export default function VCardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
