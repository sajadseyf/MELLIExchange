import type { Metadata } from 'next';
import '../globals.css';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: `${site.name} | Live Rates — Coquitlam BC`,
  description: 'Live currency exchange rates and gold prices. USD, EUR, AED, GBP and 18K gold. Walk-ins welcome, open 7 days.',
  robots: { index: false, follow: false },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#080e24] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
